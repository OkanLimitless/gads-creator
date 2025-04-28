import { GoogleAdsApi } from "google-ads-api";

export interface CreateCampaignParams {
  customerId: string;
  name: string;
  budget: number;
  maxCpc: number;
  headlines: string[]; // Array of 10 headlines, each max 30 chars
  descriptions: string[]; // Array of descriptions, each max 90 chars
}

export class GoogleAdsClient {
  private client: GoogleAdsApi;

  constructor(developerToken: string, clientId?: string, clientSecret?: string) {
    this.client = new GoogleAdsApi({
      developer_token: developerToken,
      client_id: clientId || "",
      client_secret: clientSecret || "",
    });
  }

  async createCustomer(customerId: string, refreshToken: string) {
    return this.client.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
    });
  }

  async getAccessibleCustomers(refreshToken: string) {
    try {
      const customers = await this.client.listAccessibleCustomers(refreshToken);
      return customers;
    } catch (error) {
      console.error("Error fetching accessible customers:", error);
      throw error;
    }
  }

  async createSearchCampaign(params: CreateCampaignParams, refreshToken: string) {
    try {
      const { customerId, name, budget, maxCpc, headlines, descriptions } = params;
      
      const customer = this.client.Customer({
        customer_id: customerId,
        refresh_token: refreshToken,
      });

      // API implementation would go here
      // This is a simplified example. In a real implementation, you would:
      // 1. Create a campaign budget
      // 2. Create a campaign using that budget
      // 3. Create ad groups within the campaign
      // 4. Create ads with the provided headlines and descriptions
      
      // For now, we'll return a mock response
      return {
        success: true,
        campaignId: `Campaign_${Date.now()}`,
        message: "Campaign created successfully",
      };
    } catch (error) {
      console.error("Error creating search campaign:", error);
      throw error;
    }
  }
}

// Create a singleton instance
const googleAdsClient = new GoogleAdsClient(
  process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export default googleAdsClient; 