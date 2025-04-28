"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import axios from "axios";
import { MCCAccountList } from "@/components/accounts/MCCAccountList";

// Mock data for debugging when API fails
const MOCK_ACCOUNTS = [
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
  }
];

interface Customer {
  id: string;
  resourceName: string;
  displayName?: string;
  isMCC?: boolean;
  parentId?: string;
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

export default function DashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showMockData, setShowMockData] = useState(false);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true);
        setError(null);
        setDebugInfo(null);
        
        // Set a timeout to handle cases where the API call hangs
        timeoutRef.current = setTimeout(() => {
          console.error("API call timeout after 60 seconds");
          setError("The Google Ads API request is taking longer than expected. Please refresh the page to try again.");
          setLoading(false);
        }, 60000); // Increase to 60 seconds (max Vercel function duration)

        console.log("Fetching accounts from API");
        const response = await axios.get("/api/google-ads/accounts");
        
        // Clear timeout since we got a response
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        console.log("API response:", response.data);
        
        // Handle both accounts and customers property names for backward compatibility
        const accountData = response.data.accounts || response.data.customers || [];
        setCustomers(accountData);
        
        if (accountData.length > 0) {
          console.log(`Found ${accountData.length} accounts`);
        } else {
          console.log("No accounts found");
        }
      } catch (err: unknown) {
        // Clear timeout since we got an error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        console.error("Error fetching customers:", err);
        const apiError = err as ApiError;
        const errorMessage = apiError.response?.data?.error || apiError.message || "Failed to fetch Google Ads accounts";
        setError(errorMessage);
        
        // Save debug information
        setDebugInfo({
          error: apiError.response?.data || apiError,
          timestamp: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchCustomers();
    } else {
      setLoading(false);
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [session]);

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-gray-600">Loading your accounts...</p>
        <p className="mt-1 text-xs text-gray-400">This may take a few moments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 max-w-3xl mx-auto">
        <div className="text-center">
          <h3 className="text-lg leading-6 font-medium text-red-600">Error Loading Accounts</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{error}</p>
          
          {debugInfo && (
            <details className="mt-4 text-left">
              <summary className="text-sm text-blue-500 cursor-pointer">Technical Details</summary>
              <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-60">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          )}
          
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
            
            <button
              onClick={() => {
                setShowMockData(true);
                setCustomers(MOCK_ACCOUNTS);
                setError(null);
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Load Sample Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showMockData) {
    return (
      <div>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Showing sample data. This is not your actual Google Ads account data.
              </p>
            </div>
          </div>
        </div>

        <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Sample Google Ads Accounts</h3>
          <div className="mt-3 sm:mt-0 sm:ml-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Loading Real Data
            </button>
          </div>
        </div>
        
        <div className="mt-6">
          <MCCAccountList accounts={customers} />
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 max-w-3xl mx-auto">
        <div className="text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">No Google Ads Accounts Found</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            You don&apos;t have any Google Ads accounts connected to your Google account, or you haven&apos;t granted the necessary permissions.
          </p>
          <div className="mt-6 flex justify-center space-x-4">
            <Link
              href="/dashboard/campaigns/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create New Campaign
            </Link>
            
            <button
              onClick={() => {
                setShowMockData(true);
                setCustomers(MOCK_ACCOUNTS);
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Load Sample Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Your Google Ads Accounts</h3>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <Link
            href="/dashboard/campaigns/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create New Campaign
          </Link>
        </div>
      </div>
      
      <div className="mt-6">
        <MCCAccountList accounts={customers} />
      </div>
    </div>
  );
} 