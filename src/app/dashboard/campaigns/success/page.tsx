"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaCheckCircle } from "react-icons/fa";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("id") || "";
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="text-center">
          <FaCheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Campaign Created Successfully!
          </h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Your Google Ads campaign has been created and is being processed. It may take some time before it appears in your Google Ads account.
            </p>
            {campaignId && (
              <p className="mt-2 text-sm text-gray-900">
                Campaign ID: <span className="font-medium">{campaignId}</span>
              </p>
            )}
          </div>
          <div className="mt-6 flex justify-center space-x-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Dashboard
            </Link>
            <Link
              href="/dashboard/campaigns/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Another Campaign
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 