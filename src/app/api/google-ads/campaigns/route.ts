import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import googleAdsClient, { CreateCampaignParams } from "@/lib/googleAds";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.refreshToken) {
      return NextResponse.json(
        { error: "Not authenticated or missing refresh token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { customerId, name, budget, maxCpc, headlines, descriptions } = body;

    // Basic validation
    if (!customerId || !name || !budget || !maxCpc || !headlines || !descriptions) {
      return NextResponse.json(
        { error: "Missing required campaign parameters" },
        { status: 400 }
      );
    }

    // Validate headlines and descriptions
    if (headlines.length !== 10) {
      return NextResponse.json(
        { error: "Exactly 10 headlines are required" },
        { status: 400 }
      );
    }

    if (descriptions.length < 1) {
      return NextResponse.json(
        { error: "At least one description is required" },
        { status: 400 }
      );
    }

    // Validate headline and description lengths
    for (const headline of headlines) {
      if (headline.length > 30) {
        return NextResponse.json(
          { error: "Headlines must be 30 characters or less" },
          { status: 400 }
        );
      }
    }

    for (const description of descriptions) {
      if (description.length > 90) {
        return NextResponse.json(
          { error: "Descriptions must be 90 characters or less" },
          { status: 400 }
        );
      }
    }

    const params: CreateCampaignParams = {
      customerId,
      name,
      budget,
      maxCpc,
      headlines,
      descriptions,
    };

    const result = await googleAdsClient.createSearchCampaign(params, session.refreshToken);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error creating Google Ads campaign:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create campaign" },
      { status: 500 }
    );
  }
} 