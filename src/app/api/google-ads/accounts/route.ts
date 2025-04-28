import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import googleAdsClient from "@/lib/googleAds";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.refreshToken) {
      return NextResponse.json(
        { error: "Not authenticated or missing refresh token" },
        { status: 401 }
      );
    }

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

    // Format the customer IDs for the frontend
    const formattedCustomers = customersList.map((customerResource: string) => {
      // Extract the customer ID from the resource name (format: "customers/12345678")
      const customerId = customerResource.split("/")[1];
      return {
        id: customerId,
        resourceName: customerResource,
      };
    });

    return NextResponse.json({ customers: formattedCustomers });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch Google Ads accounts";
    console.error("Error fetching Google Ads accounts:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 