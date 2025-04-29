import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import googleAdsClient from "@/lib/googleAds";
import { formatError } from "@/lib/diagnostics";

interface DetailedError {
  message: string;
  details?: string;
  code?: string;
  timestamp: string;
  diagnosticReport?: any;
}

// Simple in-memory cache for account hierarchy
// This will be cleared when the serverless function restarts
const hierarchyCache = new Map<string, {data: any, timestamp: number}>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour cache TTL to avoid repeated API calls

export async function GET(request: Request) {
  console.log("API route: GET /api/google-ads/accounts/hierarchy - Starting");
  
  try {
    // Get the search params from the request
    const url = new URL(request.url);
    const mccId = url.searchParams.get('mccId');
    
    console.log("API route: Processing request with mccId:", mccId);
    
    // Check if mccId was provided
    if (!mccId) {
      console.log("API route: Missing mccId parameter");
      return NextResponse.json(
        { error: "Missing mccId parameter" },
        { status: 400 }
      );
    }
    
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("API route: No session found");
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Log session details for debugging
    console.log("API route: Session info:");
    console.log("- User:", session.user?.name || "Unknown");
    console.log("- Email:", session.user?.email || "Unknown");
    console.log("- RefreshToken:", session.refreshToken ? "Present" : "Missing");
    
    if (!session.refreshToken) {
      console.log("API route: No refresh token in session");
      return NextResponse.json(
        { 
          error: "Missing refresh token. You might need to sign in again.",
          details: "The OAuth refresh token is missing from your session.",
          code: "MISSING_REFRESH_TOKEN"
        },
        { status: 401 }
      );
    }
    
    // Check if we have cached data for this MCC
    const cacheKey = `hierarchy-${mccId}-${session.user?.email}`;
    const cachedData = hierarchyCache.get(cacheKey);
    const now = Date.now();
    
    if (cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
      console.log("API route: Using cached hierarchy data");
      return NextResponse.json(cachedData.data);
    }

    console.log(`API route: Session found, fetching sub-accounts for MCC ${mccId}`);
    
    try {
      // Get the MCC account details first
      console.log("API route: Fetching MCC accounts");
      const mccAccounts = await googleAdsClient.getMCCAccounts(session.refreshToken);
      console.log(`API route: Found ${mccAccounts.length} MCC accounts`);
      
      // Dump account details for debugging
      console.log("API route: Available accounts:");
      mccAccounts.forEach((acc) => {
        console.log(`- ID: ${acc.id}, Name: ${acc.displayName || 'Unnamed'}, isMCC: ${acc.isMCC || false}`);
      });
      
      const mccAccount = mccAccounts.find(acc => acc.id === mccId);
      
      if (!mccAccount) {
        console.log(`API route: MCC account not found with ID ${mccId}`);
        return NextResponse.json(
          { 
            error: "MCC account not found",
            details: `No MCC account found with ID ${mccId}`,
            code: "MCC_NOT_FOUND"
          },
          { status: 404 }
        );
      }
      
      // Force isMCC flag for this account since we're treating it as an MCC
      mccAccount.isMCC = true;
      
      console.log(`API route: Found MCC account: ${mccAccount.displayName || mccAccount.id}`);
      
      // Get sub-accounts for the MCC
      console.log(`API route: Fetching sub-accounts for MCC ${mccId}`);
      const subAccounts = await googleAdsClient.getSubAccounts(mccId, session.refreshToken);
      console.log(`API route: Found ${subAccounts.length} sub-accounts`);
      
      // Log information about found sub-accounts
      if (subAccounts.length > 0) {
        console.log("API route: Sub-accounts found:");
        subAccounts.forEach((acc, index) => {
          console.log(`- ${index+1}. ID: ${acc.id}, Name: ${acc.displayName || 'Unnamed'}, isMCC: ${acc.isMCC || false}`);
        });
      } else {
        console.log("API route: No sub-accounts found for this MCC");
      }
      
      // Create the response data
      const responseData = { 
        mccAccount,
        subAccounts,
        success: true 
      };
      
      // Cache the successful response
      hierarchyCache.set(cacheKey, {
        data: responseData,
        timestamp: now
      });
      
      console.log("API route: Returning successful response");
      return NextResponse.json(responseData);
    } catch (error: any) {
      // API call failed
      console.error("API route: API method failed:", error);
      
      const errorDetail: DetailedError = {
        message: `Failed to fetch sub-accounts for MCC ${mccId}`,
        details: error.message || "Unknown error in API call",
        code: error.code || "GOOGLE_ADS_API_ERROR",
        timestamp: new Date().toISOString(),
        diagnosticReport: error.diagnosticReport || null
      };
      
      console.error("API route: API method failed:", errorDetail);
      
      return NextResponse.json(
        { 
          error: errorDetail.message,
          details: errorDetail.details,
          code: errorDetail.code,
          timestamp: errorDetail.timestamp,
          diagnosticReport: errorDetail.diagnosticReport
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const timestamp = new Date().toISOString();
    const formattedError = formatError(error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch Google Ads account hierarchy";
    
    console.error("API route: Unhandled error:", errorMessage);
    console.error("API route: Formatted error:", JSON.stringify(formattedError, null, 2));
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: "An unexpected error occurred while processing your request",
        code: "SERVER_ERROR",
        timestamp,
        debug: formattedError
      },
      { status: 500 }
    );
  } finally {
    console.log("API route: GET /api/google-ads/accounts/hierarchy - Completed");
  }
} 