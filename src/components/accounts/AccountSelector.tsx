"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface Customer {
  id: string;
  resourceName: string;
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
    };
  };
  message?: string;
}

export function AccountSelector({ value, onChange, error }: AccountSelectorProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true);
        const response = await axios.get("/api/google-ads/accounts");
        setCustomers(response.data.customers || []);
      } catch (err: unknown) {
        console.error("Error fetching customers:", err);
        const apiError = err as ApiError;
        setFetchError(apiError.response?.data?.error || apiError.message || "Failed to fetch Google Ads accounts");
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-2 py-1">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="account" className="block text-sm font-medium text-gray-700">
        Google Ads Account
      </label>
      <select
        id="account"
        name="account"
        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${
          error ? "border-red-300" : "border-gray-300"
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select an account</option>
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.id}
          </option>
        ))}
      </select>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
} 