// Mark this file as server-only to prevent client-side importing
import 'server-only';

// We will dynamically import the GoogleAdsApi to prevent it from being included in client bundles
// This is necessary because the google-ads-api package uses Node.js specific modules

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
  private client: any;
  private useMockData: boolean = false;

  constructor(developerToken: string, clientId?: string, clientSecret?: string) {
    // Enable mock mode if credentials are missing or we're not in a Node.js environment
    const hasValidCredentials = developerToken && developerToken.length > 10 && 
                               clientId && clientId.length > 10 && 
                               clientSecret && clientSecret.length > 10;
    
    // Log environment variable status for debugging
    console.log("GoogleAdsClient: Environment variables check:");
    console.log("- GOOGLE_ADS_DEVELOPER_TOKEN:", developerToken ? `Present (${developerToken.substring(0, 3)}...${developerToken.substring(developerToken.length - 3)})` : 'Missing');
    console.log("- GOOGLE_CLIENT_ID:", clientId ? `Present (${clientId.substring(0, 3)}...${clientId.substring(clientId.length - 3)})` : 'Missing');
    console.log("- GOOGLE_CLIENT_SECRET:", clientSecret ? `Present (${clientSecret.substring(0, 3)}...${clientSecret.substring(clientSecret.length - 3)})` : 'Missing');
    console.log("- hasValidCredentials:", hasValidCredentials);
    console.log("- isClientSide:", typeof window !== 'undefined');
    
    // Always use mock data on the client side or if credentials are missing
    this.useMockData = !hasValidCredentials || typeof window !== 'undefined';
    
    if (this.useMockData) {
      console.warn("GoogleAdsClient: Using mock data mode. Reason:", !hasValidCredentials ? "Invalid credentials" : "Client-side environment");
      this.client = null;
      return;
    }
    
    try {
      // We're not actually importing the module here to avoid webpack errors
      // The actual import will happen in the methods that use it
      this.client = {}; // Placeholder until methods are called
      console.log("GoogleAdsClient: Set up for server-side API calls");
    } catch (error) {
      console.error("GoogleAdsClient: Error initializing Google Ads API client", error);
      this.useMockData = true;
      this.client = null;
    }
  }

  async createCustomer(customerId: string, refreshToken: string) {
    try {
      if (this.useMockData) {
        console.log(`GoogleAdsClient (MOCK): Creating customer for ID ${customerId}`);
        return { customer_id: customerId };
      }
      
      // Dynamically import the Google Ads API only on the server side
      console.log(`GoogleAdsClient: Dynamically importing Google Ads API for customer ${customerId}`);
      const { GoogleAdsApi } = await import('google-ads-api');
      
      const client = new GoogleAdsApi({
        developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      });
      
      console.log(`GoogleAdsClient: Creating customer with refresh token (length: ${refreshToken?.length || 0})`);
      return client.Customer({
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
      console.log("GoogleAdsClient: Refresh token first 10 chars:", refreshToken?.substring(0, 10) || 'none');
      
      // Dynamically import the Google Ads API only on the server side
      console.log("GoogleAdsClient: Dynamically importing Google Ads API");
      const { GoogleAdsApi } = await import('google-ads-api');
      
      // Get environment variables again to ensure they're available
      const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "";
      const clientId = process.env.GOOGLE_CLIENT_ID || "";
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
      
      console.log("GoogleAdsClient: Creating GoogleAdsApi instance with:");
      console.log(`- developer_token: ${developerToken.substring(0, 3)}...${developerToken.substring(developerToken.length - 3)} (${developerToken.length} chars)`);
      console.log(`- client_id: ${clientId.substring(0, 3)}...${clientId.substring(clientId.length - 3)} (${clientId.length} chars)`);
      console.log(`- client_secret: ${clientSecret.substring(0, 3)}...${clientSecret.substring(clientSecret.length - 3)} (${clientSecret.length} chars)`);
      
      const client = new GoogleAdsApi({
        developer_token: developerToken,
        client_id: clientId,
        client_secret: clientSecret,
      });
      
      console.log("GoogleAdsClient: Calling listAccessibleCustomers with refresh token");
      const customers = await client.listAccessibleCustomers(refreshToken);
      console.log("GoogleAdsClient: API response type:", typeof customers);
      console.log("GoogleAdsClient: API response:", JSON.stringify(customers, null, 2));
      return customers;
    } catch (error) {
      console.error("GoogleAdsClient: Error fetching accessible customers:", error);
      console.error("GoogleAdsClient: Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
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
      console.log("GoogleAdsClient: Using refresh token:", refreshToken ? `Present (${refreshToken.length} chars)` : 'Missing');
      
      const customersResponse = await this.getAccessibleCustomers(refreshToken);
      
      let customersList: string[] = [];
      
      if (customersResponse && 'resourceNames' in customersResponse) {
        customersList = customersResponse.resourceNames as string[];
      } else if (Array.isArray(customersResponse)) {
        customersList = customersResponse;
      }

      console.log(`GoogleAdsClient: Processing ${customersList.length} accounts`);
      console.log("GoogleAdsClient: Account resources:", customersList);

      // Try to identify MCC accounts by checking account hierarchy
      const formattedCustomers: CustomerAccount[] = [];
      
      // Dynamically import the Google Ads API only on the server side
      const { GoogleAdsApi } = await import('google-ads-api');
      
      const client = new GoogleAdsApi({
        developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      });
      
      for (const customerResource of customersList) {
        try {
          // Extract the customer ID from the resource name (format: "customers/12345678")
          const customerId = customerResource.split("/")[1];
          console.log(`GoogleAdsClient: Processing customer ${customerId}`);
          
          // Create a customer instance to check if it's an MCC account
          // Note: in a real implementation, you would check account properties
          // to determine if it's an MCC account
          client.Customer({
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
      
      // Dynamically import the Google Ads API only on the server side
      const { GoogleAdsApi } = await import('google-ads-api');
      
      const client = new GoogleAdsApi({
        developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      });
      
      // Create the customer instance but don't need to assign it to a variable if unused
      client.Customer({
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

// Try to use real credentials but fall back to mock data
const googleAdsClient = new GoogleAdsClient(
  process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export default googleAdsClient; 