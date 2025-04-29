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

  const fetchAccountHierarchy = async (clearCache = false) => {
    setIsLoading(true);
    setError(null);
    
    if (clearCache) {
      setIsForceRefreshing(true);
    }
    
    try {
      console.log(`AccountHierarchy: Fetching hierarchy for MCC ID ${mccId}${clearCache ? ' (with cache clear)' : ''}`);
      const url = clearCache 
        ? `/api/google-ads/accounts/hierarchy?mccId=${mccId}&clear_cache=true` 
        : `/api/google-ads/accounts/hierarchy?mccId=${mccId}`;
      
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
        diagnosticReport: errorResponse?.diagnosticReport
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
            onClick={fetchAccountHierarchy}
          >
            Try Again
          </Button>
        </div>
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
        </div>
      </div>
      
      {/* Show raw API data for debugging */}
      {showRawApiData && rawApiData && (
        <Card className="w-full mb-4">
          <CardBody>
            <h3 className="text-sm font-medium mb-2">Raw API Response Data</h3>
            <div className="bg-gray-100 p-2 rounded-md overflow-auto max-h-64">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(rawApiData, null, 2)}
              </pre>
            </div>
          </CardBody>
        </Card>
      )}
      
      {mccAccount && (
        <Card className="w-full">
          <CardBody>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">{mccAccount.displayName || `MCC Account ${mccAccount.id}`}</span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">MCC</span>
            </div>
            <p className="text-sm text-gray-500">ID: {mccAccount.id}</p>
            <p className="text-sm text-gray-500">Resource: {mccAccount.resourceName}</p>
            
            {subAccounts.length > 0 ? (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Sub Accounts ({subAccounts.length})</h3>
                  
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
                
                <Accordion>
                  {currentAccounts.map((account) => (
                    <AccordionItem
                      key={account.id}
                      title={
                        <div className="flex items-center">
                          <span>{account.displayName || `Account ${account.id}`}</span>
                          {account.isMCC && (
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              MCC
                            </span>
                          )}
                        </div>
                      }
                      subtitle={`ID: ${account.id}`}
                      indicator={<ChevronDown className="text-gray-500" />}
                    >
                      <div className="px-2 py-1 space-y-1">
                        <p className="text-sm">Resource: {account.resourceName}</p>
                        <p className="text-sm">Parent MCC: {account.parentId}</p>
                        <p className="text-sm">Account Type: {account.isMCC ? 'Manager Account (MCC)' : 'Client Account'}</p>
                        <p className="text-sm">Relationship: Sub-account of {mccAccount.id}</p>
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
              <div className="mt-4 text-sm text-gray-500">
                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md">
                  <p className="font-medium text-yellow-800">No sub-accounts found for this MCC.</p>
                  <p className="mt-1 text-yellow-700">
                    This could be because:
                  </p>
                  <ul className="list-disc pl-5 mt-1 text-yellow-700 text-xs">
                    <li>Your Google account doesn't have access to sub-accounts under this MCC</li>
                    <li>This account is not actually an MCC account</li>
                    <li>There are no sub-accounts under this MCC</li>
                    <li>The Google Ads API is experiencing issues</li>
                  </ul>
                  <div className="mt-2">
                    <Button 
                      size="sm" 
                      variant="flat" 
                      color="warning"
                      onClick={forceRefresh}
                      startContent={<RefreshCcw size={14} />}
                    >
                      Force Refresh
                    </Button>
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