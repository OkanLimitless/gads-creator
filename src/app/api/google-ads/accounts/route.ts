import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import googleAdsClient from "@/lib/googleAds";

interface DetailedError {
  message: string;
  details?: string;
  code?: string;
  timestamp: string;
}

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

    console.log("API route: Session found, fetching Google Ads accounts");
    
    try {
      // First try to get MCC accounts to support account hierarchy
      console.log("API route: Calling getMCCAccounts");
      const accounts = await googleAdsClient.getMCCAccounts(session.refreshToken);
      console.log(`API route: Found ${accounts.length} accounts`);
      console.log("API route: First few accounts:", accounts.slice(0, 3));
      
      return NextResponse.json({ 
        accounts: accounts,
        success: true 
      });
    } catch (adError: any) {
      console.error("API route: Error in Google Ads API call:", adError);
      console.error("API route: Error details:", adError.message);
      if (adError.stack) {
        console.error("API route: Error stack:", adError.stack);
      }
      
      // If getMCCAccounts fails, fallback to the original implementation
      console.log("API route: Falling back to getAccessibleCustomers");
      try {
        const customersResponse = await googleAdsClient.getAccessibleCustomers(session.refreshToken);
        
        // The response format isn't well typed in the library, so we check and handle it appropriately
        let customersList: string[] = [];
        
        if (customersResponse && 'resourceNames' in customersResponse) {
          // Handle the case where it returns { resourceNames: string[] }
          customersList = customersResponse.resourceNames as string[];
        } else if (Array.isArray(customersResponse)) {
          // Handle the case where it returns string[]
          customersList = customersResponse;
        }

        console.log(`API route: Found ${customersList.length} customers via fallback`);
        console.log("API route: customersList:", customersList);

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

        return NextResponse.json({ customers: formattedCustomers });
      } catch (fallbackError: any) {
        // Both methods failed, return a detailed error
        const errorDetail: DetailedError = {
          message: "Failed to fetch Google Ads accounts after multiple attempts",
          details: fallbackError.message || "Unknown error in fallback method",
          code: "GOOGLE_ADS_API_ERROR",
          timestamp: new Date().toISOString()
        };
        
        console.error("API route: Both API methods failed:", errorDetail);
        console.error("API route: Original error:", adError);
        console.error("API route: Fallback error:", fallbackError);
        
        return NextResponse.json(
          { 
            error: errorDetail.message,
            details: errorDetail.details,
            code: errorDetail.code,
            timestamp: errorDetail.timestamp,
            originalError: adError.message || "Unknown primary error", 
          },
          { status: 500 }
        );
      }
    }
  } catch (error: unknown) {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch Google Ads accounts";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("API route: Unhandled error:", errorMessage, errorStack);
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorStack,
        code: "SERVER_ERROR",
        timestamp
      },
      { status: 500 }
    );
  } finally {
    console.log("API route: GET /api/google-ads/accounts - Completed");
  }
} 