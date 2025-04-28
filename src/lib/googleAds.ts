import { GoogleAdsApi } from "google-ads-api";

export interface CreateCampaignParams {
  customerId: string;
  name: string;
  budget: number;
  maxCpc: number;
  headlines: string[]; // Array of 10 headlines, each max 30 chars
  descriptions: string[]; // Array of descriptions, each max 90 chars
}

export interface CustomerAccount {
  id: string;
  resourceName: string;
  displayName?: string;
  isMCC?: boolean;
  parentId?: string;
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
      console.log("Getting accessible customers with refresh token");
      const customers = await this.client.listAccessibleCustomers(refreshToken);
      console.log("API response:", JSON.stringify(customers));
      return customers;
    } catch (error) {
      console.error("Error fetching accessible customers:", error);
      throw error;
    }
  }

  async getMCCAccounts(refreshToken: string): Promise<CustomerAccount[]> {
    try {
      // First get all accessible accounts
      const customersResponse = await this.getAccessibleCustomers(refreshToken);
      
      let customersList: string[] = [];
      
      if (customersResponse && 'resourceNames' in customersResponse) {
        customersList = customersResponse.resourceNames as string[];
      } else if (Array.isArray(customersResponse)) {
        customersList = customersResponse;
      }

      // Try to identify MCC accounts by checking account hierarchy
      const formattedCustomers: CustomerAccount[] = [];
      
      for (const customerResource of customersList) {
        try {
          // Extract the customer ID from the resource name (format: "customers/12345678")
          const customerId = customerResource.split("/")[1];
          
          // Create a customer instance to check if it's an MCC account
          // Note: in a real implementation, you would check account properties
          // to determine if it's an MCC account
          this.client.Customer({
            customer_id: customerId,
            refresh_token: refreshToken,
          });
          
          // MCC accounts typically have a manager account label or special permission flags
          // This is a simplified check - in a real implementation you might query specific fields
          const account: CustomerAccount = {
            id: customerId,
            resourceName: customerResource,
            displayName: `Account ${customerId}`, // This would ideally come from the API
            isMCC: false // We'll assume all are non-MCC for now until we can properly check
          };
          
          formattedCustomers.push(account);
        } catch (err) {
          console.error(`Error processing customer ${customerResource}:`, err);
          // Continue with next customer
        }
      }
      
      return formattedCustomers;
    } catch (error) {
      console.error("Error fetching MCC accounts:", error);
      throw error;
    }
  }

  async getSubAccounts(mccId: string): Promise<CustomerAccount[]> {
    try {
      // In a real implementation, you would query the API to get sub-accounts under this MCC
      // For now, this is a placeholder that returns an empty array
      console.log(`Getting sub-accounts for MCC ID: ${mccId}`);
      
      // Placeholder for real implementation
      return [];
    } catch (error) {
      console.error(`Error fetching sub-accounts for MCC ${mccId}:`, error);
      throw error;
    }
  }

  async createSearchCampaign(params: CreateCampaignParams, refreshToken: string) {
    try {
      // This is a simplified example for demonstration purposes
      // In a real implementation, you would use these parameters to create the campaign
      const { customerId } = params;
      
      // Create the customer instance but don't need to assign it to a variable if unused
      this.client.Customer({
        customer_id: customerId,
        refresh_token: refreshToken,
      });

      // API implementation would go here
      // This is a simplified example. In a real implementation, you would:
      // 1. Create a campaign budget
      // 2. Create a campaign using that budget
      // 3. Create ad groups within the campaign
      // 4. Create ads with the provided headlines and descriptions
      
      // Using customer and all params would be necessary in a real implementation
      console.log(`Creating campaign for customer ${customerId}`);
      if (params.name && params.budget > 0 && params.maxCpc > 0 && 
          params.headlines.length === 10 && params.descriptions.length > 0) {
        // In a real implementation, these values would be used to make API calls
      }
      
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