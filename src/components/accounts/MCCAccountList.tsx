"use client";

import { useState } from "react";
import Link from "next/link";

interface Account {
  id: string;
  resourceName: string;
  displayName?: string;
  isMCC?: boolean;
  parentId?: string;
}

interface MCCAccountListProps {
  accounts: Account[];
}

export function MCCAccountList({ accounts }: MCCAccountListProps) {
  const [expandedMCCs, setExpandedMCCs] = useState<Set<string>>(new Set());

  // Identify MCC accounts and their sub-accounts
  const mccAccounts = accounts.filter(acc => acc.isMCC);
  
  // Toggle expanded state for an MCC account
  const toggleExpanded = (mccId: string) => {
    const newExpanded = new Set(expandedMCCs);
    if (newExpanded.has(mccId)) {
      newExpanded.delete(mccId);
    } else {
      newExpanded.add(mccId);
    }
    setExpandedMCCs(newExpanded);
  };

  // Get sub-accounts for an MCC
  const getSubAccounts = (mccId: string) => {
    return accounts.filter(acc => acc.parentId === mccId);
  };

  // Standalone accounts (not under an MCC)
  const standaloneAccounts = accounts.filter(acc => !acc.isMCC && !acc.parentId);

  if (accounts.length === 0) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">No Accounts Found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No Google Ads accounts were found. Make sure you&apos;ve granted the necessary permissions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* MCC Accounts with sub-accounts */}
      {mccAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">MCC Accounts</h2>
          <div className="space-y-4">
            {mccAccounts.map((mcc) => {
              const subAccounts = getSubAccounts(mcc.id);
              const isExpanded = expandedMCCs.has(mcc.id);
              
              return (
                <div key={mcc.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div 
                    className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleExpanded(mcc.id)}
                  >
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                        {mcc.displayName || `MCC: ${mcc.id}`}
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          MCC
                        </span>
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        ID: {mcc.id} • {subAccounts.length} sub-accounts
                      </p>
                    </div>
                    <div>
                      <svg 
                        className={`h-5 w-5 text-gray-500 transform ${isExpanded ? 'rotate-180' : ''}`} 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    </div>
                  </div>
                  
                  {isExpanded && subAccounts.length > 0 && (
                    <div className="border-t border-gray-200">
                      <ul className="divide-y divide-gray-200">
                        {subAccounts.map((subAccount) => (
                          <li key={subAccount.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {subAccount.displayName || `Account: ${subAccount.id}`}
                                </p>
                                <p className="text-sm text-gray-500">ID: {subAccount.id}</p>
                              </div>
                              <div>
                                <Link
                                  href={`/dashboard/campaigns/new?customerId=${subAccount.id}`}
                                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md"
                                >
                                  Create Campaign
                                </Link>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {isExpanded && subAccounts.length === 0 && (
                    <div className="px-4 py-4 sm:px-6 text-center text-sm text-gray-500">
                      No sub-accounts found
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Standalone Accounts */}
      {standaloneAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Standard Accounts</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {standaloneAccounts.map((account) => (
                <li key={account.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {account.displayName || `Account: ${account.id}`}
                      </p>
                      <p className="text-sm text-gray-500">ID: {account.id}</p>
                    </div>
                    <div>
                      <Link
                        href={`/dashboard/campaigns/new?customerId=${account.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md"
                      >
                        Create Campaign
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 