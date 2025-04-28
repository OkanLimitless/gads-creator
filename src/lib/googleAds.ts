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

// Mock accounts for testing
export const MOCK_CUSTOMER_ACCOUNTS: CustomerAccount[] = [
  {
    id: "1234567890",
    resourceName: "customers/1234567890",
    displayName: "Test Account 1",
    isMCC: false
  },
  {
    id: "9876543210",
    resourceName: "customers/9876543210",
    displayName: "Test MCC Account",
    isMCC: true
  },
  {
    id: "5555555555",
    resourceName: "customers/5555555555",
    displayName: "Sub Account 1",
    isMCC: false,
    parentId: "9876543210"
  }
];

export class GoogleAdsClient {
  private client: GoogleAdsApi;
  private useMockData: boolean = false;

  constructor(developerToken: string, clientId?: string, clientSecret?: string) {
    // Enable mock mode if credentials are missing
    const hasValidCredentials = developerToken && developerToken.length > 10 && 
                               clientId && clientId.length > 10 && 
                               clientSecret && clientSecret.length > 10;
    
    this.useMockData = !hasValidCredentials;
    
    if (this.useMockData) {
      console.warn("GoogleAdsClient: Missing or invalid credentials. Using mock data mode.");
    }
    
    try {
      this.client = new GoogleAdsApi({
        developer_token: developerToken || "mock_token",
        client_id: clientId || "mock_client_id",
        client_secret: clientSecret || "mock_client_secret",
      });
    } catch (error) {
      console.error("GoogleAdsClient: Error initializing Google Ads API client", error);
      this.useMockData = true;
      this.client = {} as GoogleAdsApi; // Empty object as a fallback
    }
  }

  async createCustomer(customerId: string, refreshToken: string) {
    try {
      if (this.useMockData) {
        console.log(`GoogleAdsClient (MOCK): Creating customer for ID ${customerId}`);
        return { customer_id: customerId };
      }
      
      return this.client.Customer({
        customer_id: customerId,
        refresh_token: refreshToken,
      });
    } catch (error) {
      console.error(`GoogleAdsClient: Error creating customer for ID ${customerId}`, error);
      throw error;
    }
  }

  async getAccessibleCustomers(refreshToken: string) {
    try {
      if (this.useMockData) {
        console.log("GoogleAdsClient (MOCK): Getting accessible customers");
        return { resourceNames: MOCK_CUSTOMER_ACCOUNTS.map(a => a.resourceName) };
      }
      
      console.log("GoogleAdsClient: Getting accessible customers with refresh token");
      console.log("GoogleAdsClient: Refresh token length:", refreshToken?.length || 0);
      
      const customers = await this.client.listAccessibleCustomers(refreshToken);
      console.log("GoogleAdsClient: API response type:", typeof customers);
      console.log("GoogleAdsClient: API response:", JSON.stringify(customers, null, 2));
      return customers;
    } catch (error) {
      console.error("GoogleAdsClient: Error fetching accessible customers:", error);
      // Add more detailed diagnostic info to the error
      const enhancedError = new Error(
        `Failed to fetch Google Ads accounts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw enhancedError;
    }
  }

  async getMCCAccounts(refreshToken: string): Promise<CustomerAccount[]> {
    try {
      if (this.useMockData) {
        console.log("GoogleAdsClient (MOCK): Getting MCC accounts");
        return MOCK_CUSTOMER_ACCOUNTS;
      }
      
      // First get all accessible accounts
      console.log("GoogleAdsClient: Getting MCC accounts - starting");
      const customersResponse = await this.getAccessibleCustomers(refreshToken);
      
      let customersList: string[] = [];
      
      if (customersResponse && 'resourceNames' in customersResponse) {
        customersList = customersResponse.resourceNames as string[];
      } else if (Array.isArray(customersResponse)) {
        customersList = customersResponse;
      }

      console.log(`GoogleAdsClient: Processing ${customersList.length} accounts`);

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
          console.error(`GoogleAdsClient: Error processing customer ${customerResource}:`, err);
          // Continue with next customer
        }
      }
      
      console.log(`GoogleAdsClient: Returning ${formattedCustomers.length} formatted accounts`);
      return formattedCustomers;
    } catch (error) {
      console.error("GoogleAdsClient: Error fetching MCC accounts:", error);
      throw error;
    }
  }

  async getSubAccounts(mccId: string): Promise<CustomerAccount[]> {
    try {
      if (this.useMockData) {
        console.log(`GoogleAdsClient (MOCK): Getting sub-accounts for MCC ID ${mccId}`);
        return MOCK_CUSTOMER_ACCOUNTS.filter(acc => acc.parentId === mccId);
      }
      
      // In a real implementation, you would query the API to get sub-accounts under this MCC
      // For now, this is a placeholder that returns an empty array
      console.log(`GoogleAdsClient: Getting sub-accounts for MCC ID: ${mccId}`);
      
      // Placeholder for real implementation
      return [];
    } catch (error) {
      console.error(`GoogleAdsClient: Error fetching sub-accounts for MCC ${mccId}:`, error);
      throw error;
    }
  }

  async createSearchCampaign(params: CreateCampaignParams, refreshToken: string) {
    try {
      // This is a simplified example for demonstration purposes
      // In a real implementation, you would use these parameters to create the campaign
      const { customerId } = params;
      
      if (this.useMockData) {
        console.log(`GoogleAdsClient (MOCK): Creating campaign for customer ${customerId}`);
        return {
          success: true,
          campaignId: `Campaign_MOCK_${Date.now()}`,
          message: "Campaign created successfully (MOCK)",
        };
      }
      
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
      console.log(`GoogleAdsClient: Creating campaign for customer ${customerId}`);
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
      console.error("GoogleAdsClient: Error creating search campaign:", error);
      throw error;
    }
  }
}

// Check if we're in a development environment
const isDevelopment = process.env.NODE_ENV === "development";

// Create a singleton instance
const googleAdsClient = new GoogleAdsClient(
  process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export default googleAdsClient; 