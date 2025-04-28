"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, useDisclosure, Spinner, Checkbox } from "@nextui-org/react";
import { ChevronDown, RefreshCcw } from 'lucide-react';
import { AccountSelectorModal } from '@/components/accounts/AccountSelectorModal';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { DiagnosticErrorDisplay } from '@/components/ui/DiagnosticErrorDisplay';

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
      code?: string;
      timestamp?: string;
      diagnosticReport?: any;
    };
  };
  message?: string;
}

export function AccountSelector({ value, onChange, error }: AccountSelectorProps) {
  const { data: session } = useSession();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  
  const [selectedAccount, setSelectedAccount] = useState<Customer | null>(null);
  const [accounts, setAccounts] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedMCC, setSelectedMCC] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [useMockData, setUseMockData] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<string>('Initializing...');
  
  // Use a longer timeout for production/Vercel environments
  const CLIENT_TIMEOUT_MS = process.env.NODE_ENV === 'production' ? 60000 : 45000;

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      setDebugInfo(null);
      setLoadingProgress('Initializing connection...');

      // Set progress updates - calculate based on timeout
      const progressInterval = Math.floor(CLIENT_TIMEOUT_MS / 8); // 8 steps for more frequent updates
      const progressUpdates = [
        { time: progressInterval, message: 'Connecting to Google Ads API...' },
        { time: progressInterval * 2, message: 'API request in progress...' },
        { time: progressInterval * 3, message: 'Still waiting for response...' },
        { time: progressInterval * 4, message: 'This is taking longer than expected...' },
        { time: progressInterval * 5, message: 'Google Ads API is slow today...' },
        { time: progressInterval * 6, message: 'Almost there, please wait...' },
        { time: progressInterval * 7, message: 'Fallback to sample data in a few seconds...' }
      ];
      
      // Schedule progress updates
      const progressTimers = progressUpdates.map(update => {
        return setTimeout(() => {
          setLoadingProgress(update.message);
        }, update.time);
      });

      // Set a timeout for the API call
      timeoutRef.current = setTimeout(() => {
        console.error(`Account selector: API call timeout after ${CLIENT_TIMEOUT_MS/1000} seconds`);
        console.log("Using mock data due to API timeout");
        
        // Instead of showing error, use mock data as a fallback
        setAccounts(MOCK_CUSTOMER_ACCOUNTS);
        setUseMockData(true);
        setIsLoading(false);
        setLoadingProgress('Using sample data (API timeout)');
      }, CLIENT_TIMEOUT_MS);

      console.log("Account selector: Fetching accounts");
      const response = await axios.get("/api/google-ads/accounts");
      
      // Clear timeout since we got a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Clear progress timers
      progressTimers.forEach(timer => clearTimeout(timer));
      
      console.log("Account selector: API response:", response.data);
      
      // Handle both accounts and customers property names for backward compatibility
      const accountData = response.data.accounts || response.data.customers || [];
      setAccounts(accountData);
    } catch (err: unknown) {
      // Clear timeout if there was an error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      console.error("Account selector: Error fetching accounts:", err);
      const apiError = err as ApiError;
      
      // Extract error message and diagnostic info
      const errorResponse = apiError.response?.data;
      const errorMessage = errorResponse?.error || apiError.message || "Failed to fetch Google Ads accounts";
      
      setFetchError(errorMessage);
      
      // Save the enhanced debug info including diagnostic report if available
      setDebugInfo({
        error: errorResponse || apiError,
        timestamp: errorResponse?.timestamp || new Date().toISOString(),
        diagnosticReport: errorResponse?.diagnosticReport
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session && !useMockData) {
      fetchCustomers();
    } else {
      // Use mock data instead
      setAccounts(MOCK_CUSTOMER_ACCOUNTS);
      setIsLoading(false);
    }

    // Cleanup timeout if component unmounts
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [session, useMockData]);

  useEffect(() => {
    if (selectedAccount) {
      onChange(selectedAccount.id);
    }
  }, [selectedAccount, onChange]);

  // Get list of MCC accounts
  const mccAccounts = accounts.filter(customer => customer.isMCC === true);
  
  // Get regular accounts, filtered by selected MCC if applicable
  const regularAccounts = accounts.filter(customer => {
    if (customer.isMCC) return false;
    if (selectedMCC) return customer.parentId === selectedMCC;
    return true;
  });

  const handleRefresh = () => {
    if (session && !useMockData) {
      fetchCustomers();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2 py-1">
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <Spinner size="sm" className="mr-2" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Loading Google Ads accounts</h3>
              <p className="text-sm text-blue-600 mt-1">{loadingProgress}</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Note: The Google Ads API can sometimes take up to {Math.floor(CLIENT_TIMEOUT_MS/1000)} seconds to respond.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <DiagnosticErrorDisplay
        error={fetchError}
        details={debugInfo?.error?.details}
        code={debugInfo?.error?.code}
        timestamp={debugInfo?.timestamp}
        diagnosticReport={debugInfo?.diagnosticReport}
        onRetry={handleRefresh}
        onUseSampleData={() => setUseMockData(true)}
      />
    );
  }

  if (accounts.length === 0) {
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
              setSelectedAccount(null);
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

      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2 items-center">
          <Dropdown>
            <DropdownTrigger>
              <Button 
                variant="flat" 
                className="justify-between min-w-[240px]"
                endContent={<ChevronDown size={16} />}
                isDisabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" /> 
                    <span>{loadingProgress}</span>
                  </div>
                ) : selectedAccount ? (
                  selectedAccount.displayName || `Account ${selectedAccount.id}`
                ) : (
                  'Select an account'
                )}
              </Button>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="Google Ads Accounts"
              variant="flat"
              onAction={(key) => {
                if (key === "view_all") {
                  onOpen();
                } else {
                  const account = accounts.find(acc => acc.id === key);
                  if (account) {
                    setSelectedAccount(account);
                  }
                }
              }}
            >
              {accounts.length > 0 ? (
                <>
                  {accounts.slice(0, 5).map((account) => (
                    <DropdownItem key={account.id}>
                      {account.displayName || `Account ${account.id}`}
                      {account.isMCC && <span className="ml-2 text-xs bg-blue-100 px-1 rounded">MCC</span>}
                    </DropdownItem>
                  ))}
                  {accounts.length > 5 && (
                    <DropdownItem key="view_all" className="text-primary">View all accounts</DropdownItem>
                  )}
                </>
              ) : (
                <DropdownItem key="no_accounts" isDisabled>No accounts found</DropdownItem>
              )}
            </DropdownMenu>
          </Dropdown>
          
          <Button 
            isIconOnly 
            variant="light" 
            onClick={handleRefresh}
            isDisabled={isLoading}
          >
            <RefreshCcw size={16} />
          </Button>
          
          <div className="flex items-center ml-4">
            <Checkbox 
              isSelected={!useMockData} 
              onValueChange={(isSelected) => setUseMockData(!isSelected)}
              size="sm"
            >
              Use real API data
            </Checkbox>
          </div>
        </div>
        
        {error && (
          <div className="text-sm text-danger mt-1">
            {error}
          </div>
        )}
      </div>
      
      <AccountSelectorModal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        accounts={accounts}
        onSelectAccount={(account: Customer) => {
          setSelectedAccount(account);
          onOpenChange();
        }}
      />
    </div>
  );
} 