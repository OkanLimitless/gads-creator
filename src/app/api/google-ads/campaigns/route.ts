import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import googleAdsClient from "@/lib/googleAds";
import { CampaignFormData } from "@/lib/validations/campaignSchema";

interface GoogleAdsError {
  message?: string;
  stack?: string;
  code?: string;
}

export async function POST(request: Request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.refreshToken) {
      return NextResponse.json(
        { error: "Not authenticated or missing refresh token" },
        { status: 401 }
      );
    }

    // Parse request body
    const data = await request.json() as CampaignFormData;
    
    console.log("Creating campaign with data:", {
      customerId: data.customerId,
      name: data.name,
      budget: data.budget,
      maxCpc: data.maxCpc,
      headlines: data.headlines.length,
      descriptions: data.descriptions.length,
    });

    // Validate customer ID
    if (!data.customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    try {
      // Create campaign
      const result = await googleAdsClient.createSearchCampaign(
        {
          customerId: data.customerId,
          name: data.name,
          budget: data.budget,
          maxCpc: data.maxCpc,
          headlines: data.headlines,
          descriptions: data.descriptions,
        },
        session.refreshToken
      );

      return NextResponse.json(result);
    } catch (apiError: unknown) {
      console.error("Google Ads API error:", apiError);
      
      // Cast to our error interface
      const error = apiError as GoogleAdsError;
      
      // Check if the error is related to MCC account
      const errorMessage = error.message || "Unknown error";
      const isMCCError = 
        errorMessage.includes("manager") || 
        errorMessage.includes("MCC") || 
        errorMessage.includes("permission");
      
      // Provide a more helpful error message for MCC-related issues
      if (isMCCError) {
        return NextResponse.json(
          {
            error: "You cannot create campaigns directly on a manager (MCC) account. Please select a non-manager account instead.",
            details: errorMessage,
            code: "MCC_ACCOUNT_ERROR"
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: error.stack,
          code: error.code || "API_ERROR" 
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Campaign creation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create campaign";
    
    return NextResponse.json(
      { 
        error: errorMessage,
        code: "SERVER_ERROR",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 