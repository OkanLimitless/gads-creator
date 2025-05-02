"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Spinner, Card, CardBody, Accordion, AccordionItem, Button } from "@nextui-org/react";
import { toast } from "sonner";
import { ChevronDown, RefreshCcw } from "lucide-react";
import { DiagnosticErrorDisplay } from "@/components/ui/DiagnosticErrorDisplay";

interface Account {
  id: string;
  resourceName: string;
  displayName?: string;
  isMCC?: boolean;
  parentId?: string;
}

interface AccountHierarchyProps {
  mccId: string;
}

export function AccountHierarchy({ mccId }: AccountHierarchyProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [mccAccount, setMccAccount] = useState<Account | null>(null);
  const [subAccounts, setSubAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isForceRefreshing, setIsForceRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const accountsPerPage = 10; // Show 10 accounts per page
  const [showRawApiData, setShowRawApiData] = useState(false);
  const [rawApiData, setRawApiData] = useState<any>(null);
  const [fullAccountList, setFullAccountList] = useState<any>(null);
  const [showFullAccountList, setShowFullAccountList] = useState(false);

  const fetchAccountHierarchy = async (clearCache = false) => {
    setIsLoading(true);
    setError(null);
    
    if (clearCache) {
      setIsForceRefreshing(true);
    }
    
    try {
      console.log(`AccountHierarchy: Fetching hierarchy for MCC ID ${mccId}${clearCache ? ' (with cache clear)' : ''}`);
      
      // Add a timestamp-based cache buster to prevent browser caching
      const cacheBuster = `_t=${Date.now()}`;
      
      // Add debug flag to include more details from the backend
      const debugParam = `debug=true`;
      
      const url = clearCache 
        ? `/api/google-ads/accounts/hierarchy?mccId=${mccId}&clear_cache=true&${debugParam}&${cacheBuster}` 
        : `/api/google-ads/accounts/hierarchy?mccId=${mccId}&${debugParam}&${cacheBuster}`;
      
      console.log(`AccountHierarchy: Making API request to: ${url}`);
      const response = await axios.get(url);
      
      // Save raw API data for debugging
      setRawApiData(response.data);
      
      console.log("AccountHierarchy: API response:", response.data);
      const { mccAccount, subAccounts } = response.data;
      
      if (!mccAccount) {
        console.error("AccountHierarchy: No MCC account in the response");
        setError("Failed to find MCC account details");
        toast.error("Could not load MCC account details");
        return;
      }
      
      setMccAccount(mccAccount);
      setSubAccounts(subAccounts || []);
      
      console.log(`AccountHierarchy: Found ${subAccounts?.length || 0} sub-accounts`);
      
      // Reset to first page when loading new data
      setCurrentPage(1);
      
      // Show toast notifications
      if (subAccounts?.length > 0) {
        toast.success(`Found ${subAccounts.length} sub-accounts for this MCC`);
      } else {
        toast.info("No sub-accounts found for this MCC");
      }
      
      // Check for warnings in the response
      if (response.data.warnings) {
        console.warn("AccountHierarchy: API returned warnings:", response.data.warnings);
        toast.warning("API warnings detected - check Debug data for details");
      }
    } catch (err: any) {
      console.error("Error fetching account hierarchy:", err);
      
      // Extract error message and diagnostic info
      const errorResponse = err.response?.data;
      const errorMessage = errorResponse?.error || err.message || "Failed to fetch Google Ads account hierarchy";
      
      setError(errorMessage);
      
      // Save the enhanced debug info including diagnostic report if available
      setDebugInfo({
        error: errorResponse || err,
        timestamp: errorResponse?.timestamp || new Date().toISOString(),
        diagnosticReport: errorResponse?.diagnosticReport,
        requestInfo: {
          url: err.config?.url,
          method: err.config?.method,
          status: err.response?.status,
          statusText: err.response?.statusText
        }
      });
      
      toast.error("Failed to load account hierarchy");
    } finally {
      setIsLoading(false);
      setIsForceRefreshing(false);
    }
  };

  // Force refresh clears the cache and fetches fresh data
  const forceRefresh = (e: React.MouseEvent) => {
    e.preventDefault();
    fetchAccountHierarchy(true);
  };

  // Fetch the full account list for debugging
  const fetchFullAccountList = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/google-ads/debug/full-account-list?mccId=${mccId}`);
      setFullAccountList(response.data);
      setShowFullAccountList(true);
      toast.success(`Retrieved ${response.data.totalAccounts} accounts`);
    } catch (err) {
      console.error("Error fetching full account list:", err);
      toast.error("Failed to fetch full account list");
    } finally {
      setIsLoading(false);
    }
  };

  // Normal refresh doesn't clear cache
  const normalRefresh = (e: React.MouseEvent) => {
    e.preventDefault();
    fetchAccountHierarchy(false);
  };

  // Simple retry for error display component
  const handleRetry = () => {
    fetchAccountHierarchy(false);
  };

  // Calculate pagination
  const totalPages = Math.ceil(subAccounts.length / accountsPerPage);
  const indexOfLastAccount = currentPage * accountsPerPage;
  const indexOfFirstAccount = indexOfLastAccount - accountsPerPage;
  const currentAccounts = subAccounts.slice(indexOfFirstAccount, indexOfLastAccount);

  useEffect(() => {
    if (session && mccId) {
      fetchAccountHierarchy();
    }
  }, [session, mccId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner size="lg" label="Loading accounts..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Account Hierarchy</h2>
          <Button 
            variant="flat" 
            size="sm" 
            color="primary"
            startContent={<RefreshCcw size={16} />}
            onClick={(e) => {
              e.preventDefault();
              fetchAccountHierarchy(false);
            }}
          >
            Try Again
          </Button>
        </div>
        
        <Card className="border border-red-200 bg-red-50">
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-red-800 mb-2">Error Loading Account Hierarchy</h3>
                <div className="text-red-700 mb-2">{error}</div>
                
                {debugInfo?.error?.details && (
                  <div className="mb-3">
                    <p className="font-medium text-red-700 text-sm">Details:</p>
                    <p className="text-sm text-red-600 mt-1">{debugInfo.error.details}</p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button 
                    size="sm" 
                    color="danger"
                    variant="flat"
                    onClick={handleRetry}
                  >
                    Retry
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="secondary"
                    onClick={fetchFullAccountList}
                  >
                    Try Full Account List
                  </Button>
                  <Button
                    size="sm"
                    variant="flat" 
                    color={showRawApiData ? "danger" : "default"}
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      setShowRawApiData(!showRawApiData);
                    }}
                  >
                    {showRawApiData ? "Hide Debug Info" : "Show Debug Info"}
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Detailed error info */}
        {showRawApiData && debugInfo && (
          <Card className="border border-slate-200">
            <CardBody>
              <h3 className="text-sm font-medium mb-2">Diagnostic Information</h3>
              <div className="bg-gray-800 p-4 rounded-md overflow-auto max-h-96 text-white">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
              <div className="mt-4 bg-slate-100 p-3 rounded-md">
                <h4 className="text-xs font-medium mb-2">Troubleshooting Tips:</h4>
                <ul className="list-disc pl-5 text-xs space-y-1 text-slate-700">
                  <li>Check that your Google Ads account has proper API access</li>
                  <li>Verify authentication settings and refresh tokens</li>
                  <li>Confirm your Google Ads developer token is valid</li>
                  <li>Look for rate limiting or quota issues in the error details</li>
                  <li>Try the "Full Account List" button to use a different API endpoint</li>
                </ul>
              </div>
            </CardBody>
          </Card>
        )}
        
        <DiagnosticErrorDisplay
          error={error}
          details={debugInfo?.error?.details}
          diagnosticReport={debugInfo?.diagnosticReport}
          timestamp={debugInfo?.timestamp}
          code={debugInfo?.error?.code}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Account Hierarchy</h2>
        <div className="flex gap-2">
          <Button 
            variant="flat" 
            size="sm" 
            startContent={<RefreshCcw size={16} />}
            onClick={normalRefresh}
            isDisabled={isForceRefreshing}
          >
            Refresh
          </Button>
          <Button 
            variant="flat" 
            size="sm" 
            color="warning"
            startContent={<RefreshCcw size={16} />}
            onClick={forceRefresh}
            isLoading={isForceRefreshing}
            isDisabled={isForceRefreshing}
          >
            Force Refresh
          </Button>
          <Button
            variant="flat"
            size="sm"
            color={showRawApiData ? "danger" : "secondary"}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              setShowRawApiData(!showRawApiData);
            }}
          >
            {showRawApiData ? "Hide Raw Data" : "Show Raw Data"}
          </Button>
          <Button
            variant="flat"
            size="sm"
            color="primary"
            onClick={fetchFullAccountList}
          >
            Full Account List
          </Button>
        </div>
      </div>
      
      {/* Test API notice */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
        <CardBody className="py-3">
          <div className="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div>
              <p className="text-sm text-blue-800">
                <span className="font-medium">Test API Notice:</span> You're using test API credentials with limited functionality. 
                Some features like fetching sub-accounts may be restricted until you have full production access.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Try the "Full Account List" button for an alternative way to view accounts.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
      
      {/* Show raw API data for debugging */}
      {showRawApiData && rawApiData && (
        <Card className="w-full mb-4">
          <CardBody>
            <h3 className="text-sm font-medium mb-2">Raw API Response Data</h3>
            <div className="bg-gray-800 p-4 rounded-md overflow-auto max-h-96 text-white">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(rawApiData, null, 2)}
              </pre>
            </div>
          </CardBody>
        </Card>
      )}
      
      {/* Show full account list for debugging */}
      {showFullAccountList && fullAccountList && (
        <Card className="w-full mb-4 border border-blue-200">
          <CardBody>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Full Account List ({fullAccountList.totalAccounts} accounts)</h3>
              <Button
                size="sm"
                variant="light"
                onClick={() => setShowFullAccountList(false)}
              >
                Hide
              </Button>
            </div>
            <div className="bg-slate-50 p-4 rounded-md overflow-auto max-h-96 border border-slate-200">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-slate-200">
                    <th className="p-2 text-left font-semibold">ID</th>
                    <th className="p-2 text-left font-semibold">Name</th>
                    <th className="p-2 text-left font-semibold">Level</th>
                    <th className="p-2 text-left font-semibold">Is MCC</th>
                    <th className="p-2 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fullAccountList.accounts.map((account: any, index: number) => (
                    <tr key={account.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50 hover:bg-blue-50'}>
                      <td className="p-2 font-mono">{account.id}</td>
                      <td className="p-2">{account.displayName}</td>
                      <td className="p-2 text-center">{account.level}</td>
                      <td className="p-2 text-center">
                        {account.isMCC ? 
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Yes</span> : 
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">No</span>
                        }
                      </td>
                      <td className="p-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                          account.status === 'ENABLED' ? 'bg-green-100 text-green-800' : 
                          account.status === 'DISABLED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {account.status || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
      
      {mccAccount && (
        <Card className="w-full border border-slate-200 shadow-sm">
          <CardBody>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-semibold text-lg">{mccAccount.displayName || `MCC Account ${mccAccount.id}`}</span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">MCC</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-md mb-4 flex flex-col gap-1">
              <p className="text-sm text-slate-700"><span className="font-medium">ID:</span> <span className="font-mono">{mccAccount.id}</span></p>
              <p className="text-sm text-slate-700"><span className="font-medium">Resource:</span> <span className="font-mono text-xs">{mccAccount.resourceName}</span></p>
            </div>
            
            {subAccounts.length > 0 ? (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-medium">Sub Accounts <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-sm">{subAccounts.length}</span></h3>
                  
                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Button
                        size="sm"
                        variant="flat"
                        isIconOnly
                        isDisabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      >
                        &laquo;
                      </Button>
                      <span className="text-xs">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="flat"
                        isIconOnly
                        isDisabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      >
                        &raquo;
                      </Button>
                    </div>
                  )}
                </div>
                
                <Accordion className="bg-white rounded-md border border-slate-200">
                  {currentAccounts.map((account) => (
                    <AccordionItem
                      key={account.id}
                      title={
                        <div className="flex items-center">
                          <span className="font-medium">{account.displayName || `Account ${account.id}`}</span>
                          {account.isMCC && (
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              MCC
                            </span>
                          )}
                        </div>
                      }
                      subtitle={<span className="font-mono text-xs text-slate-500">ID: {account.id}</span>}
                      indicator={<ChevronDown className="text-slate-500" />}
                      classNames={{
                        base: "border-b border-slate-200 last:border-0 hover:bg-slate-50",
                        title: "text-base",
                        subtitle: "text-slate-600"
                      }}
                    >
                      <div className="px-3 py-2 space-y-2 bg-slate-50 rounded-b-md">
                        <p className="text-sm"><span className="font-medium text-slate-700">Resource:</span> <span className="font-mono text-xs">{account.resourceName}</span></p>
                        <p className="text-sm"><span className="font-medium text-slate-700">Parent MCC:</span> <span className="font-mono text-xs">{account.parentId}</span></p>
                        <p className="text-sm"><span className="font-medium text-slate-700">Account Type:</span> {account.isMCC ? 
                          <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs ml-1">Manager Account (MCC)</span> : 
                          <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs ml-1">Client Account</span>
                        }</p>
                        <p className="text-sm"><span className="font-medium text-slate-700">Relationship:</span> <span className="text-slate-600">Sub-account of <span className="font-mono text-xs">{mccAccount.id}</span></span></p>
                      </div>
                    </AccordionItem>
                  ))}
                </Accordion>
                
                {/* Bottom pagination for many accounts */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-4">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="flat"
                        isDisabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                      >
                        First
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        isDisabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      >
                        Previous
                      </Button>
                      <span className="mx-2 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="flat"
                        isDisabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      >
                        Next
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        isDisabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <div className="p-6 border border-amber-200 bg-amber-50 rounded-md">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-amber-100">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-amber-700">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-900 mb-2">No Sub-Accounts Found</h3>
                      <p className="text-amber-800 mb-4">
                        No sub-accounts were found for this MCC account. This could be due to several reasons:
                      </p>
                      <ul className="list-disc pl-5 mb-4 text-amber-700 space-y-1">
                        <li>Your Google account doesn't have access to sub-accounts under this MCC</li>
                        <li>This account might not actually be an MCC account</li>
                        <li>There are no sub-accounts linked to this MCC</li>
                        <li>The Google Ads API might be experiencing issues or has rate-limited the requests</li>
                        <li><strong>Test API Limitation:</strong> You're using test API credentials which have restricted access. Some Google Ads API features are only available with approved production access.</li>
                      </ul>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                        <h4 className="font-medium text-blue-800 mb-1">Test API Note</h4>
                        <p className="text-sm text-blue-700">
                          The Google Ads API test account has limited functionality. Getting sub-accounts may work only with full production access. 
                          To get production access, you'll need to complete your app and apply for approval.
                        </p>
                        <a 
                          href="https://developers.google.com/google-ads/api/docs/first-call/overview" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-xs text-blue-600 hover:underline"
                        >
                          Learn more about Google Ads API access
                        </a>
                      </div>
                      
                      <div className="flex gap-3 mt-4">
                        <Button 
                          size="sm" 
                          variant="flat" 
                          color="warning"
                          onClick={forceRefresh}
                          startContent={<RefreshCcw size={14} />}
                        >
                          Force Refresh
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          onClick={fetchFullAccountList}
                        >
                          Try Full Account List
                        </Button>
                      </div>
                      
                      {/* Debug tips */}
                      <div className="mt-5 border-t border-amber-200 pt-4">
                        <p className="text-xs text-amber-800 font-medium">Debugging Tips:</p>
                        <ul className="list-disc pl-5 mt-1 text-xs text-amber-700 space-y-1">
                          <li>Enable "Show Raw Data" to view the API response</li>
                          <li>Try the "Full Account List" button to use a different API method</li>
                          <li>Check console logs for detailed error information</li>
                          <li>Verify Google Ads API access and permissions in Google Cloud Console</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
} 