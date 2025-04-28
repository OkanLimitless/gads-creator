"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import axios from "axios";
import { MCCAccountList } from "@/components/accounts/MCCAccountList";

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
    };
  };
  message?: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true);
        console.log("Fetching accounts from API");
        const response = await axios.get("/api/google-ads/accounts");
        console.log("API response:", response.data);
        
        // Handle both accounts and customers property names for backward compatibility
        const accountData = response.data.accounts || response.data.customers || [];
        setCustomers(accountData);
        setError(null);
        
        if (accountData.length > 0) {
          console.log(`Found ${accountData.length} accounts`);
        } else {
          console.log("No accounts found");
        }
      } catch (err: unknown) {
        console.error("Error fetching customers:", err);
        const apiError = err as ApiError;
        setError(apiError.response?.data?.error || apiError.message || "Failed to fetch Google Ads accounts");
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchCustomers();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-gray-600">Loading your accounts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 max-w-3xl mx-auto">
        <div className="text-center">
          <h3 className="text-lg leading-6 font-medium text-red-600">Error Loading Accounts</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </div>
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
          <div className="mt-6">
            <Link
              href="/dashboard/campaigns/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create New Campaign
            </Link>
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