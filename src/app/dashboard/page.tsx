"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import axios from "axios";

interface Customer {
  id: string;
  resourceName: string;
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
        const response = await axios.get("/api/google-ads/accounts");
        setCustomers(response.data.customers || []);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching customers:", err);
        setError(err.response?.data?.error || "Failed to fetch Google Ads accounts");
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
            You don't have any Google Ads accounts connected to your Google account, or you haven't granted the necessary permissions.
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
      
      <div className="mt-6 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-gray-900">
                    Account: {customer.id}
                  </h3>
                  <div className="mt-3">
                    <Link
                      href={`/dashboard/campaigns/new?customerId=${customer.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md"
                    >
                      Create Campaign
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 