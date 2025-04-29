import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatError } from "@/lib/diagnostics";

export async function GET(request: Request) {
  console.log("API route: GET /api/google-ads/debug/full-account-list - Starting");
  
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("API route: No session found");
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    if (!session.refreshToken) {
      console.log("API route: No refresh token in session");
      return NextResponse.json(
        { error: "Missing refresh token" },
        { status: 401 }
      );
    }

    // Dynamically import the Google Ads API
    const { GoogleAdsApi } = await import('google-ads-api');
    
    const client = new GoogleAdsApi({
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    });
    
    // Get the MCC ID from the query parameters
    const url = new URL(request.url);
    const mccId = url.searchParams.get('mccId');
    
    if (!mccId) {
      return NextResponse.json({ error: "Missing mccId parameter" }, { status: 400 });
    }
    
    console.log(`API route: Creating customer instance for MCC ${mccId}`);
    const customer = client.Customer({
      customer_id: mccId,
      refresh_token: session.refreshToken,
    });
    
    // Query all customer_client data without filtering
    console.log("API route: Querying all customer client data");
    const query = `
      SELECT
        customer_client.client_customer,
        customer_client.level,
        customer_client.manager,
        customer_client.descriptive_name,
        customer_client.id,
        customer_client.status
      FROM
        customer_client
    `;
    
    const response = await customer.query(query);
    console.log(`API route: Found ${response?.length || 0} records`);
    
    // Process the data for easier debugging
    const processedData = response.map(row => {
      const clientInfo = row.customer_client;
      if (!clientInfo) return null;
      
      return {
        id: clientInfo.client_customer,
        displayName: clientInfo.descriptive_name || `Account ${clientInfo.client_customer}`,
        level: clientInfo.level,
        isMCC: !!clientInfo.manager,
        status: clientInfo.status
      };
    }).filter(item => item !== null);
    
    // Sort the data for easier navigation
    const sortedData = [...processedData].sort((a, b) => {
      // Sort by level first
      if ((a?.level || 0) !== (b?.level || 0)) {
        return (a?.level || 0) - (b?.level || 0);
      }
      // Then by ID for consistent ordering
      return (a?.id || '').localeCompare(b?.id || '');
    });
    
    return NextResponse.json({
      success: true,
      mccId,
      totalAccounts: sortedData.length,
      accounts: sortedData
    });
  } catch (error: unknown) {
    console.error("API route: Error fetching full account list:", error);
    
    const timestamp = new Date().toISOString();
    const formattedError = formatError(error);
    const errorMessage = error instanceof Error ? error.message : "Error fetching account data";
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: "An error occurred while fetching account data",
        debug: formattedError,
        timestamp
      },
      { status: 500 }
    );
  } finally {
    console.log("API route: GET /api/google-ads/debug/full-account-list - Completed");
  }
} 