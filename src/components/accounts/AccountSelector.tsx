"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";

// We're explicitly creating a client-side version of mock accounts
// instead of importing directly from googleAds.ts which is now server-only
const MOCK_CUSTOMER_ACCOUNTS = [
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

interface Customer {
  id: string;
  resourceName: string;
  displayName?: string;
  isMCC?: boolean;
  parentId?: string;
}

interface AccountSelectorProps {
  value: string;
  onChange: (customerId: string) => void;
  error?: string;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
      details?: string;
    };
  };
  message?: string;
}

export function AccountSelector({ value, onChange, error }: AccountSelectorProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedMCC, setSelectedMCC] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [useMockData, setUseMockData] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true);
        setFetchError(null);
        setDebugInfo(null);

        // Set a timeout for the API call
        timeoutRef.current = setTimeout(() => {
          console.error("Account selector: API call timeout after 10 seconds");
          setFetchError("Request timed out. The Google Ads API might be unavailable.");
          setLoading(false);
        }, 10000);

        console.log("Account selector: Fetching accounts");
        const response = await axios.get("/api/google-ads/accounts");
        
        // Clear timeout since we got a response
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        console.log("Account selector: API response:", response.data);
        
        // Handle both accounts and customers property names for backward compatibility
        const accountData = response.data.accounts || response.data.customers || [];
        setCustomers(accountData);
      } catch (err: unknown) {
        // Clear timeout if there was an error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        console.error("Account selector: Error fetching accounts:", err);
        const apiError = err as ApiError;
        const errorMessage = apiError.response?.data?.error || apiError.message || "Failed to fetch Google Ads accounts";
        setFetchError(errorMessage);
        
        // Save the debug info
        setDebugInfo({
          error: apiError.response?.data || apiError,
          timestamp: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    }

    if (!useMockData) {
      fetchCustomers();
    } else {
      // Use mock data instead
      setCustomers(MOCK_CUSTOMER_ACCOUNTS);
      setLoading(false);
    }

    // Cleanup timeout if component unmounts
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [useMockData]);

  // Get list of MCC accounts
  const mccAccounts = customers.filter(customer => customer.isMCC === true);
  
  // Get regular accounts, filtered by selected MCC if applicable
  const regularAccounts = customers.filter(customer => {
    if (customer.isMCC) return false;
    if (selectedMCC) return customer.parentId === selectedMCC;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2 py-1">
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2 py-1">
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center">Loading account information...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading accounts</h3>
            <div className="mt-2 text-sm text-red-700">{fetchError}</div>
            
            {debugInfo && (
              <details className="mt-2">
                <summary className="text-xs text-blue-500 cursor-pointer">Technical Details</summary>
                <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}
            
            <div className="mt-3">
              <button
                onClick={() => setUseMockData(true)}
                className="text-sm text-blue-500 underline"
              >
                Use sample data instead
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">No accounts found</h3>
            <div className="mt-2 text-sm text-yellow-700">
              No Google Ads accounts were found. Make sure you have granted the necessary permissions.
            </div>
            <div className="mt-3">
              <button
                onClick={() => setUseMockData(true)}
                className="text-sm text-blue-500 underline"
              >
                Use sample data instead
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {useMockData && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-2 mb-4">
          <p className="text-xs text-blue-700">
            Using sample data for demonstration. This is not your real Google Ads account data.
          </p>
        </div>
      )}
      
      {/* MCC Account Selector - only show if there are MCC accounts */}
      {mccAccounts.length > 0 && (
        <div>
          <label htmlFor="mcc-selector" className="block text-sm font-medium text-gray-700">
            Select MCC Account (Optional)
          </label>
          <select
            id="mcc-selector"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={selectedMCC || ""}
            onChange={(e) => {
              setSelectedMCC(e.target.value || null);
              // Clear the current account selection if MCC changes
              onChange("");
            }}
          >
            <option value="">All Accounts</option>
            {mccAccounts.map((mcc) => (
              <option key={mcc.id} value={mcc.id}>
                {mcc.displayName || `MCC: ${mcc.id}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="account" className="block text-sm font-medium text-gray-700">
          Google Ads Account
        </label>
        <select
          id="account"
          name="account"
          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${
            error ? "border-red-300" : "border-gray-300"
          }`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select an account</option>
          {regularAccounts.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.displayName || `Account: ${customer.id}`}
            </option>
          ))}
        </select>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        
        {!useMockData && (
          <div className="mt-2 text-right">
            <button
              onClick={() => setUseMockData(true)}
              className="text-xs text-gray-500 hover:text-blue-500"
            >
              Switch to sample data
            </button>
          </div>
        )}
        
        {useMockData && (
          <div className="mt-2 text-right">
            <button
              onClick={() => {
                setUseMockData(false);
                setSelectedMCC(null);
                onChange("");
              }}
              className="text-xs text-gray-500 hover:text-blue-500"
            >
              Try real accounts
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 