import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createLogger, createLogSession } from "@/lib/serverLogger";
import { formatError } from "@/lib/diagnostics";

// Create a dedicated logger for this endpoint
const logger = createLogger("google-ads-timeout-test");

// Define interfaces for better typing
interface TimeMarker {
  label: string;
  time: number;
}

export async function GET(request: NextRequest) {
  // Create a log session for this test
  const logSession = createLogSession("google-ads-timeout-test");
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
    
    sessionLogger.info("Starting Google Ads API timeout diagnostic test", {
      user: session.user?.email,
      refreshTokenLength: session.refreshToken.length,
    });
    
    // Import the GoogleAdsApi directly to bypass our client
    const googleAdsModule = await import('google-ads-api');
    const { GoogleAdsApi } = googleAdsModule;
    
    sessionLogger.info("Successfully imported Google Ads API module", {
      moduleDetails: Object.keys(googleAdsModule),
    });
    
    // Create a client directly
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "";
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    
    sessionLogger.info("Creating GoogleAdsApi client", {
      developerTokenLength: developerToken.length,
      clientIdLength: clientId.length,
      clientSecretLength: clientSecret.length,
    });
    
    const client = new GoogleAdsApi({
      developer_token: developerToken,
      client_id: clientId,
      client_secret: clientSecret,
    });
    
    sessionLogger.info("GoogleAdsApi client created successfully");
    
    // Track request progress
    const timeMarkers: TimeMarker[] = [];
    const recordTime = (label: string) => {
      const time = Date.now();
      timeMarkers.push({ label, time });
      sessionLogger.info(`Time marker: ${label}`, { time });
      return time;
    };
    
    const startTime = recordTime("Starting API call");
    
    // Set up a timeout to listen for long-running calls
    let completed = false;
    let intervalId: NodeJS.Timeout | null = null;
    
    // Helper to calculate time since the start
    const timeSinceStart = () => Date.now() - startTime;
    
    // Set an interval check rather than a single timeout
    sessionLogger.info("Setting up progress monitoring");
    
    intervalId = setInterval(() => {
      if (completed) {
        if (intervalId) {
          clearInterval(intervalId);
        }
        return;
      }
      
      const elapsed = timeSinceStart();
      sessionLogger.info(`API call in progress`, { elapsedMs: elapsed });
      
      // Escalate to warnings after certain thresholds
      if (elapsed > 10000) {
        sessionLogger.warn(`API call exceeding 10 seconds`, { elapsedMs: elapsed });
      }
      
      if (elapsed > 20000) {
        sessionLogger.warn(`API call exceeding 20 seconds`, { elapsedMs: elapsed });
      }
      
      if (elapsed > 30000) {
        sessionLogger.error(`API call exceeding 30 seconds`, { elapsedMs: elapsed });
      }
    }, 5000);
    
    // Add an absolute timeout to abort the API call
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeout = setTimeout(() => {
        sessionLogger.error("Aborting API call due to timeout", { 
          elapsedMs: timeSinceStart(),
          timeoutMs: 45000
        });
        reject(new Error("API call timed out after 45 seconds"));
      }, 45000);
      
      // Ensure the timeout is cleared if completed
      if (completed) {
        clearTimeout(timeout);
      }
    });
    
    try {
      // Create a race between the API call and our timeout
      const result = await Promise.race([
        client.listAccessibleCustomers(session.refreshToken),
        timeoutPromise
      ]);
      
      // If we get here, the API call succeeded
      completed = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      recordTime("API call completed");
      const totalTime = timeSinceStart();
      
      sessionLogger.info("API call succeeded", { 
        totalTimeMs: totalTime,
        resultType: typeof result,
        resultLength: JSON.stringify(result).length,
      });
      
      // Format results
      let resourceNames: string[] = [];
      if (result && typeof result === 'object' && 'resourceNames' in result) {
        resourceNames = result.resourceNames as string[];
      } else if (Array.isArray(result)) {
        resourceNames = result;
      }
      
      const diagnosticResult = {
        success: true,
        totalTimeMs: totalTime,
        timeMarkers,
        accountsFound: resourceNames.length,
        accounts: resourceNames.slice(0, 5), // Just the first 5 for the response
        sessionId: logSession.sessionId,
      };
      
      logSession.end("success", diagnosticResult);
      return NextResponse.json(diagnosticResult);
    } catch (apiError) {
      // API call failed
      completed = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      recordTime("API call failed");
      const totalTime = timeSinceStart();
      
      sessionLogger.error("API call failed", { 
        totalTimeMs: totalTime,
        error: formatError(apiError),
      });
      
      const errorResult = {
        success: false,
        totalTimeMs: totalTime,
        timeMarkers,
        error: apiError instanceof Error ? apiError.message : String(apiError),
        sessionId: logSession.sessionId,
      };
      
      logSession.end("error", errorResult);
      return NextResponse.json(errorResult, { status: 500 });
    }
  } catch (error) {
    // Overall endpoint error
    logger.error("Error in timeout test endpoint", { error: formatError(error) });
    logSession.end("error", { error: formatError(error) });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      sessionId: logSession.sessionId,
    }, { status: 500 });
  }
} 