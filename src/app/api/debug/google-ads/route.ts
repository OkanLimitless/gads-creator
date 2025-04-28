import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createLogger, createLogSession } from "@/lib/serverLogger";
import { formatError } from "@/lib/diagnostics";

// Create a logger for this endpoint
const logger = createLogger("debug-google-ads-api");

export async function GET(request: NextRequest) {
  // Create a log session for this diagnostic test
  const logSession = createLogSession("google-ads-debug");
  const sessionLogger = logSession.logger;

  try {
    // Only allow in development or with admin session
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user || session.user.email !== process.env.ADMIN_EMAIL) {
        return NextResponse.json(
          { error: "Not authorized to access this endpoint" },
          { status: 403 }
        );
      }
    }
    
    // Get the session to extract the refresh token
    const session = await getServerSession(authOptions);
    
    if (!session || !session.refreshToken) {
      logSession.end("error", { reason: "No session or refresh token" });
      return NextResponse.json(
        { error: "No authenticated session with refresh token" },
        { status: 401 }
      );
    }
    
    sessionLogger.info("Starting Google Ads API connectivity tests", {
      user: session.user?.email,
      refreshTokenLength: session.refreshToken.length
    });
    
    // Test 1: Basic connectivity to Google APIs
    const tests = [];
    
    // Test connectivity to Google's general API endpoints
    try {
      sessionLogger.info("Testing general Google API connectivity");
      const startTime = Date.now();
      
      const googleApiResponse = await fetch(
        "https://www.googleapis.com/oauth2/v1/tokeninfo", 
        { 
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(5000)
        }
      );
      
      const googleApiDuration = Date.now() - startTime;
      const googleApiStatus = googleApiResponse.status;
      
      sessionLogger.info("Google API test completed", { 
        durationMs: googleApiDuration,
        status: googleApiStatus
      });
      
      tests.push({
        name: "Google API Connectivity",
        success: googleApiResponse.ok,
        durationMs: googleApiDuration,
        status: googleApiStatus,
        url: "https://www.googleapis.com/oauth2/v1/tokeninfo"
      });
    } catch (error) {
      sessionLogger.error("Google API test failed", { error: formatError(error) });
      tests.push({
        name: "Google API Connectivity",
        success: false,
        error: error instanceof Error ? error.message : String(error),
        url: "https://www.googleapis.com/oauth2/v1/tokeninfo"
      });
    }
    
    // Test 2: Validate OAuth token
    try {
      sessionLogger.info("Testing OAuth token validity");
      const startTime = Date.now();
      
      // Use the tokeninfo endpoint to check validity
      const tokenResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/tokeninfo?access_token=" + session.accessToken, 
        { 
          method: "GET",
          signal: AbortSignal.timeout(5000)
        }
      );
      
      const tokenData = await tokenResponse.json();
      const tokenDuration = Date.now() - startTime;
      
      sessionLogger.info("OAuth token test completed", {
        durationMs: tokenDuration,
        valid: tokenResponse.ok,
        expiresIn: tokenData.expires_in,
        scopes: tokenData.scope
      });
      
      tests.push({
        name: "OAuth Token Validation",
        success: tokenResponse.ok,
        durationMs: tokenDuration,
        status: tokenResponse.status,
        expiresIn: tokenData.expires_in,
        scopes: tokenData.scope?.split(" ")
      });
    } catch (error) {
      sessionLogger.error("OAuth token test failed", { error: formatError(error) });
      tests.push({
        name: "OAuth Token Validation",
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Test 3: Check network connectivity to Google Ads API endpoints
    try {
      sessionLogger.info("Testing connectivity to Google Ads API endpoints");
      const startTime = Date.now();
      
      // Just ping the Google Ads API endpoint without sending actual credentials
      const adsApiResponse = await fetch(
        "https://googleads.googleapis.com/v11/customers:listAccessibleCustomers",
        { 
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          signal: AbortSignal.timeout(5000)
        }
      );
      
      const adsApiDuration = Date.now() - startTime;
      
      sessionLogger.info("Google Ads API connectivity test completed", {
        durationMs: adsApiDuration,
        status: adsApiResponse.status
      });
      
      tests.push({
        name: "Google Ads API Connectivity",
        // We expect a 401 here since we're not sending credentials
        // but if we get a response at all, it means we can reach the API
        success: adsApiResponse.status === 401,
        durationMs: adsApiDuration,
        status: adsApiResponse.status,
        url: "https://googleads.googleapis.com/v11/customers:listAccessibleCustomers"
      });
    } catch (error) {
      sessionLogger.error("Google Ads API connectivity test failed", { error: formatError(error) });
      tests.push({
        name: "Google Ads API Connectivity",
        success: false,
        error: error instanceof Error ? error.message : String(error),
        url: "https://googleads.googleapis.com/v11/customers:listAccessibleCustomers"
      });
    }
    
    // Test 4: Check environment variables
    const environmentTests = {
      name: "Environment Variables",
      success: true,
      details: {} as Record<string, { present: boolean; validLength: boolean; }>
    };
    
    const requiredEnvVars = [
      "GOOGLE_ADS_DEVELOPER_TOKEN",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET"
    ];
    
    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      const isPresent = Boolean(value);
      const isValidLength = Boolean(value && value.length > 10);
      
      environmentTests.details[envVar] = {
        present: isPresent,
        validLength: isValidLength
      };
      
      if (!isPresent || !isValidLength) {
        environmentTests.success = false;
      }
    }
    
    tests.push(environmentTests);
    
    // Compile results
    const results = {
      timestamp: new Date().toISOString(),
      sessionId: logSession.sessionId,
      tests,
      overallSuccess: tests.every(test => test.success)
    };
    
    logSession.end("success", results);
    
    return NextResponse.json(results);
  } catch (error) {
    logger.error("Debug endpoint error", { error: formatError(error) });
    logSession.end("error", { error: formatError(error) });
    
    return NextResponse.json(
      { 
        error: "Error running diagnostic tests",
        message: error instanceof Error ? error.message : String(error),
        sessionId: logSession.sessionId
      },
      { status: 500 }
    );
  }
} 