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

// Simple in-memory cache for accounts
// This will be cleared when the serverless function restarts
const accountsCache = new Map<string, {data: any, timestamp: number}>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour cache TTL to avoid repeated API calls

export async function GET() {
  console.log("API route: GET /api/google-ads/accounts - Starting");
  
  try {
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
    console.log("- AccessToken:", session.accessToken ? "Present" : "Missing");
    console.log("- RefreshToken:", session.refreshToken ? "Present" : "Missing");
    console.log("- ExpiresAt:", session.expiresAt || "Unknown");
    
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
    
    // Check if we have cached data for this user
    const cacheKey = `accounts-${session.user?.email}`;
    const cachedData = accountsCache.get(cacheKey);
    const now = Date.now();
    
    if (cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
      console.log("API route: Using cached accounts data");
      return NextResponse.json(cachedData.data);
    }

    console.log("API route: Session found, fetching Google Ads accounts");
    
    // Run both methods simultaneously to increase chances of success
    try {
      // Start both API calls at the same time
      console.log("API route: Running getMCCAccounts and getAccessibleCustomers in parallel");
      
      const mccPromise = googleAdsClient.getMCCAccounts(session.refreshToken)
        .catch(err => {
          console.log("API route: getMCCAccounts failed, will use fallback", err.message);
          console.log("API route: getMCCAccounts error details:", err.diagnosticReport || "No diagnostic report");
          return null;
        });
        
      const customersPromise = googleAdsClient.getAccessibleCustomers(session.refreshToken)
        .catch(err => {
          console.log("API route: getAccessibleCustomers failed", err.message);
          console.log("API route: getAccessibleCustomers error details:", err.diagnosticReport || "No diagnostic report");
          return null;
        });
      
      // Wait for both results
      const [mccResult, customersResult] = await Promise.all([mccPromise, customersPromise]);
      
      // Process getMCCAccounts result if available
      if (mccResult) {
        console.log(`API route: Found ${mccResult.length} accounts via getMCCAccounts`);
        
        const responseData = { 
          accounts: mccResult,
          success: true 
        };
        
        // Cache the successful response
        accountsCache.set(cacheKey, {
          data: responseData,
          timestamp: now
        });
        
        return NextResponse.json(responseData);
      }
      
      // Process getAccessibleCustomers result as fallback
      if (customersResult) {
        console.log("API route: Using getAccessibleCustomers result as fallback");
        
        // The response format isn't well typed in the library, so we check and handle it appropriately
        let customersList: string[] = [];
        
        if (customersResult && typeof customersResult === 'object' && 'resourceNames' in customersResult) {
          // Handle the case where it returns { resourceNames: string[] }
          customersList = customersResult.resourceNames as string[];
        } else if (Array.isArray(customersResult)) {
          // Handle the case where it returns string[]
          customersList = customersResult;
        }

        console.log(`API route: Found ${customersList.length} customers via fallback`);

        // Format the customer IDs for the frontend
        const formattedCustomers = customersList.map((customerResource: string) => {
          // Extract the customer ID from the resource name (format: "customers/12345678")
          const customerId = customerResource.split("/")[1];
          return {
            id: customerId,
            resourceName: customerResource,
            displayName: `Account ${customerId}`, // Simple display name for better UX
          };
        });
        
        const responseData = {
          customers: formattedCustomers,
          success: true
        };
        
        // Cache the successful response
        accountsCache.set(cacheKey, {
          data: responseData,
          timestamp: now
        });

        return NextResponse.json(responseData);
      }
      
      // Both methods failed
      throw new Error("Both API methods failed to return valid data");
    } catch (error: any) {
      // Both methods failed, return a detailed error
      const errorDetail: DetailedError = {
        message: "Failed to fetch Google Ads accounts after multiple attempts",
        details: error.message || "Unknown error in API calls",
        code: error.code || "GOOGLE_ADS_API_ERROR",
        timestamp: new Date().toISOString(),
        diagnosticReport: error.diagnosticReport || null
      };
      
      console.error("API route: All API methods failed:", errorDetail);
      
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
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch Google Ads accounts";
    
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
    console.log("API route: GET /api/google-ads/accounts - Completed");
  }
} 