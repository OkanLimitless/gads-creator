import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import googleAdsClient, { CustomerAccount } from "@/lib/googleAds";
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
    const clearCache = url.searchParams.get('clear_cache') === 'true';
    const includeDebug = url.searchParams.get('debug') === 'true';
    
    console.log("API route: Processing request with mccId:", mccId);
    console.log("API route: Clear cache:", clearCache);
    console.log("API route: Include debug:", includeDebug);
    
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
    
    // Clear cache if requested
    if (clearCache) {
      console.log(`API route: Clearing cache for ${cacheKey}`);
      hierarchyCache.delete(cacheKey);
    }
    
    const cachedData = hierarchyCache.get(cacheKey);
    const now = Date.now();
    
    if (cachedData && (now - cachedData.timestamp < CACHE_TTL) && !clearCache) {
      console.log("API route: Using cached hierarchy data");
      return NextResponse.json(cachedData.data);
    }

    console.log(`API route: Session found, fetching sub-accounts for MCC ${mccId}`);
    
    try {
      // Get the MCC account details first
      console.log("API route: Fetching MCC accounts");
      let mccAccounts: CustomerAccount[] = [];
      let mccAccountsFetchError = null;
      
      try {
        mccAccounts = await googleAdsClient.getMCCAccounts(session.refreshToken);
        console.log(`API route: Found ${mccAccounts.length} MCC accounts`);
      } catch (mccError) {
        console.error("API route: Error fetching MCC accounts:", mccError);
        mccAccountsFetchError = mccError;
        // Continue with empty array, we'll try another approach
      }
      
      // Dump account details for debugging
      if (mccAccounts.length > 0) {
        console.log("API route: Available accounts:");
        mccAccounts.forEach((acc) => {
          console.log(`- ID: ${acc.id}, Name: ${acc.displayName || 'Unnamed'}, isMCC: ${acc.isMCC || false}`);
        });
      } else {
        console.log("API route: No MCC accounts found or error occurred");
      }
      
      // Find the requested MCC account
      let mccAccount = mccAccounts.find(acc => acc.id === mccId);
      
      // If we couldn't find the MCC account and there was an error, create a placeholder
      if (!mccAccount) {
        if (mccAccountsFetchError) {
          console.log(`API route: Creating placeholder MCC account for ${mccId} due to API error`);
          // Create a placeholder MCC account
          mccAccount = {
            id: mccId,
            resourceName: `customers/${mccId}`,
            displayName: `MCC Account ${mccId}`,
            isMCC: true
          };
        } else {
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
      }
      
      // Force isMCC flag for this account since we're treating it as an MCC
      mccAccount.isMCC = true;
      
      console.log(`API route: Using MCC account: ${mccAccount.displayName || mccAccount.id}`);
      
      // Get sub-accounts for the MCC
      console.log(`API route: Fetching sub-accounts for MCC ${mccId}`);
      let subAccounts: CustomerAccount[] = [];
      let subAccountsFetchError = null;
      
      try {
        subAccounts = await googleAdsClient.getSubAccounts(mccId, session.refreshToken);
        console.log(`API route: Found ${subAccounts.length} sub-accounts from API`);
      } catch (subError: unknown) {
        console.error("API route: Error fetching sub-accounts:", subError);
        subAccountsFetchError = subError;
        
        // Enhanced error logging for debugging
        console.log("API route: Sub-accounts fetch error details:");
        console.log(`- Error message: ${(subError as any)?.message || 'Unknown error'}`);
        console.log(`- Error code: ${(subError as any)?.code || 'No error code'}`);
        
        if ((subError as any)?.response) {
          console.log(`- Response status: ${(subError as any).response.status}`);
          console.log(`- Response data:`, (subError as any).response.data);
        }
        
        // Return empty sub-accounts instead of using a fallback
        subAccounts = [];
        console.log("API route: Returning empty sub-accounts array due to API error");
      }
      
      // Log information about found sub-accounts
      if (subAccounts.length > 0) {
        console.log("API route: Sub-accounts found:");
        subAccounts.forEach((acc, index) => {
          if (index < 10) { // Log first 10 for brevity
            console.log(`- ${index+1}. ID: ${acc.id}, Name: ${acc.displayName || 'Unnamed'}, isMCC: ${acc.isMCC || false}`);
          }
        });
        if (subAccounts.length > 10) {
          console.log(`- ... and ${subAccounts.length - 10} more accounts`);
        }
      } else {
        console.log("API route: No sub-accounts found for this MCC");
      }
      
      // Create the response data
      const responseData = { 
        mccAccount,
        subAccounts,
        success: true 
      };
      
      // If there were errors, include them in the response for debugging
      if (mccAccountsFetchError || subAccountsFetchError) {
        (responseData as any).warnings = {
          mccAccountsFetchError: mccAccountsFetchError ? formatError(mccAccountsFetchError) : null,
          subAccountsFetchError: subAccountsFetchError ? formatError(subAccountsFetchError) : null,
          message: "Fallback data was used due to API errors"
        };
      }
      
      // Add debug info if requested
      if (includeDebug) {
        console.log("API route: Including debug information in response");
        (responseData as any).debug = {
          timestamp: new Date().toISOString(),
          requestParams: {
            mccId,
            clearCache,
            includeDebug
          },
          accountsCounts: {
            totalAccounts: mccAccounts.length,
            subAccountsCount: subAccounts.length
          },
          detailedApiCalls: {
            getMccAccountsCalled: true,
            getSubAccountsCalled: true,
            cacheUsed: !clearCache && !!cachedData
          },
          environment: {
            nodeEnv: process.env.NODE_ENV,
            isTestMode: true,
            // Include additional environment information for troubleshooting
            googleAdsApiVersion: "v15", // This should match the version used in your API calls
            hasCredentials: {
              developerToken: !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
              clientId: !!process.env.GOOGLE_CLIENT_ID,
              clientSecret: !!process.env.GOOGLE_CLIENT_SECRET
            }
          }
        };
      }
      
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
      
      // Add additional debug info if requested
      if (includeDebug) {
        (errorDetail as any).debug = {
          mccId,
          clearCache,
          includeDebug,
          errorObject: formatError(error),
          stackTrace: error.stack
        };
      }
      
      console.error("API route: API method failed:", errorDetail);
      
      return NextResponse.json(
        { 
          error: errorDetail.message,
          details: errorDetail.details,
          code: errorDetail.code,
          timestamp: errorDetail.timestamp,
          diagnosticReport: errorDetail.diagnosticReport,
          debug: includeDebug ? (errorDetail as any).debug : undefined
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