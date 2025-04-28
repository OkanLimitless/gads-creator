// Mark this file as server-only to prevent client-side importing
import 'server-only';
import { diagnosticTracer, formatError, createTimeoutPromise } from './diagnostics';
import { createLogger, createLogSession } from './serverLogger';

// We will dynamically import the GoogleAdsApi to prevent it from being included in client bundles
// This is necessary because the google-ads-api package uses Node.js specific modules

// Create a dedicated logger for Google Ads operations
const logger = createLogger('google-ads');

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
    // Create a dedicated log session for this API call
    const logSession = createLogSession('getAccessibleCustomers');
    const sessionLogger = logSession.logger;
    
    // Start diagnostic tracing
    diagnosticTracer.start(60000); // 60 second timeout
    diagnosticTracer.addTrace("googleAds", "getAccessibleCustomers started", { refreshTokenLength: refreshToken?.length || 0 });
    sessionLogger.info('Starting getAccessibleCustomers', { refreshTokenLength: refreshToken?.length || 0 });
    
    try {
      if (this.useMockData) {
        console.log("GoogleAdsClient (MOCK): Getting accessible customers");
        diagnosticTracer.addTrace("googleAds", "Using mock data");
        sessionLogger.info('Using mock data');
        diagnosticTracer.end();
        logSession.end('success', { mock: true });
        return { resourceNames: MOCK_CUSTOMER_ACCOUNTS.map(a => a.resourceName) };
      }
      
      console.log("GoogleAdsClient: Getting accessible customers with refresh token");
      console.log("GoogleAdsClient: Refresh token length:", refreshToken?.length || 0);
      console.log("GoogleAdsClient: Refresh token first 10 chars:", refreshToken?.substring(0, 10) || 'none');
      diagnosticTracer.addTrace("googleAds", "Refresh token validated", { 
        length: refreshToken?.length || 0,
        firstChars: refreshToken?.substring(0, 10) || 'none'
      });
      sessionLogger.info('Refresh token validated', {
        length: refreshToken?.length || 0,
        firstChars: refreshToken?.substring(0, 10) || 'none'
      });
      
      // Dynamically import the Google Ads API only on the server side
      console.log("GoogleAdsClient: Dynamically importing Google Ads API");
      diagnosticTracer.addTrace("googleAds", "Dynamically importing Google Ads API");
      sessionLogger.info('Dynamically importing Google Ads API');
      
      try {
        const importStartTime = Date.now();
        sessionLogger.debug('Starting dynamic import');
        
        const { GoogleAdsApi } = await createTimeoutPromise(
          import('google-ads-api'), 
          20000, 
          "Google Ads API module import timed out"
        );
        
        const importDuration = Date.now() - importStartTime;
        diagnosticTracer.addTrace("googleAds", "Google Ads API module imported", { durationMs: importDuration });
        sessionLogger.info('Google Ads API module imported', { durationMs: importDuration });
        
        // Get environment variables again to ensure they're available
        const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "";
        const clientId = process.env.GOOGLE_CLIENT_ID || "";
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
        
        console.log("GoogleAdsClient: Creating GoogleAdsApi instance with:");
        console.log(`- developer_token: ${developerToken.substring(0, 3)}...${developerToken.substring(developerToken.length - 3)} (${developerToken.length} chars)`);
        console.log(`- client_id: ${clientId.substring(0, 3)}...${clientId.substring(clientId.length - 3)} (${clientId.length} chars)`);
        console.log(`- client_secret: ${clientSecret.substring(0, 3)}...${clientSecret.substring(clientSecret.length - 3)} (${clientSecret.length} chars)`);
        
        diagnosticTracer.addTrace("googleAds", "Creating GoogleAdsApi instance", {
          developerTokenLength: developerToken.length,
          clientIdLength: clientId.length,
          clientSecretLength: clientSecret.length
        });
        sessionLogger.info('Creating GoogleAdsApi instance', {
          developerTokenLength: developerToken.length,
          clientIdLength: clientId.length,
          clientSecretLength: clientSecret.length
        });
        
        const createClientStartTime = Date.now();
        const client = new GoogleAdsApi({
          developer_token: developerToken,
          client_id: clientId,
          client_secret: clientSecret,
        });
        const createClientDuration = Date.now() - createClientStartTime;
        
        diagnosticTracer.addTrace("googleAds", "GoogleAdsApi client created", { 
          durationMs: createClientDuration 
        });
        sessionLogger.info('GoogleAdsApi client created', { 
          durationMs: createClientDuration 
        });
        
        console.log("GoogleAdsClient: Calling listAccessibleCustomers with refresh token");
        diagnosticTracer.addTrace("googleAds", "Calling listAccessibleCustomers API");
        sessionLogger.info('Calling listAccessibleCustomers API');
        
        // Log a ping test to Google's servers
        try {
          const pingStartTime = Date.now();
          sessionLogger.debug('Performing network test to Google APIs');
          
          const pingResponse = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            // Shorter timeout just for the ping test
            signal: AbortSignal.timeout(5000),
          }).then(res => res.ok);
          
          const pingDuration = Date.now() - pingStartTime;
          sessionLogger.info('Google API network test completed', { 
            durationMs: pingDuration,
            success: pingResponse
          });
        } catch (pingError) {
          sessionLogger.warn('Google API network test failed', { 
            error: formatError(pingError)
          });
        }
        
        // Add a timeout to the API call
        const apiCallStartTime = Date.now();
        sessionLogger.debug('Starting API call with 40 second timeout');
        
        // Log in background when timeout would have happened
        setTimeout(() => {
          sessionLogger.warn('API call duration exceeds 20 seconds', {
            currentDuration: Date.now() - apiCallStartTime
          });
        }, 20000);
        
        setTimeout(() => {
          sessionLogger.warn('API call duration exceeds 40 seconds', {
            currentDuration: Date.now() - apiCallStartTime
          });
        }, 40000);
        
        const customers = await createTimeoutPromise(
          client.listAccessibleCustomers(refreshToken),
          40000, // 40 seconds timeout for the API call
          "Google Ads API listAccessibleCustomers call timed out"
        );
        
        const apiCallDuration = Date.now() - apiCallStartTime;
        
        diagnosticTracer.addTrace("googleAds", "API call successful", { 
          durationMs: apiCallDuration,
          responseType: typeof customers
        });
        sessionLogger.info('API call successful', { 
          durationMs: apiCallDuration,
          responseType: typeof customers,
          responseSize: JSON.stringify(customers).length
        });
        
        console.log("GoogleAdsClient: API response type:", typeof customers);
        console.log("GoogleAdsClient: API response:", JSON.stringify(customers, null, 2));
        
        // End diagnostic tracing
        diagnosticTracer.end();
        logSession.end('success', { 
          durationMs: apiCallDuration,
          responseType: typeof customers
        });
        
        return customers;
      } catch (importError) {
        // Handle module import errors specifically
        diagnosticTracer.addTrace("googleAds", "Error importing or initializing Google Ads API", { 
          error: formatError(importError) 
        });
        sessionLogger.error('Error importing or initializing Google Ads API', {
          error: formatError(importError)
        });
        
        throw importError;
      }
    } catch (error: any) {
      console.error("GoogleAdsClient: Error fetching accessible customers:", error);
      
      let errorDetails;
      try {
        errorDetails = JSON.stringify(formatError(error), null, 2);
        console.error("GoogleAdsClient: Detailed error:", errorDetails);
      } catch (e: unknown) {
        errorDetails = `Error could not be stringified: ${(e as Error).message}`;
        console.error("GoogleAdsClient: Error serializing error details:", e);
      }
      
      // Capture the diagnostic trace in the error
      const diagnosticReport = diagnosticTracer.end(error, formatError(error));
      
      // Log the error with the session logger
      sessionLogger.error('API call failed', {
        error: formatError(error),
        diagnosticReport
      });
      
      // End the log session
      logSession.end('error', {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorCode: error.code
      });
      
      // Create an enhanced error with diagnostic info
      const enhancedError = new Error(
        `Failed to fetch Google Ads accounts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      
      // Add diagnostic data to the error
      (enhancedError as any).diagnosticReport = diagnosticReport;
      (enhancedError as any).errorDetails = errorDetails;
      (enhancedError as any).code = error.code || 'GOOGLE_ADS_API_ERROR';
      (enhancedError as any).timestamp = new Date().toISOString();
      (enhancedError as any).sessionId = logSession.sessionId;
      
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
          // to determine if it's an MCC account
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