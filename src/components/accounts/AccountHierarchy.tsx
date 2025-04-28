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

  const fetchAccountHierarchy = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`AccountHierarchy: Fetching hierarchy for MCC ID ${mccId}`);
      const response = await axios.get(`/api/google-ads/accounts/hierarchy?mccId=${mccId}`);
      
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
    }
  };

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
          onRetry={fetchAccountHierarchy}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Account Hierarchy</h2>
        <Button 
          variant="flat" 
          size="sm" 
          startContent={<RefreshCcw size={16} />}
          onClick={fetchAccountHierarchy}
        >
          Refresh
        </Button>
      </div>
      
      {mccAccount && (
        <Card className="w-full">
          <CardBody>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">{mccAccount.displayName || `MCC Account ${mccAccount.id}`}</span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">MCC</span>
            </div>
            <p className="text-sm text-gray-500">ID: {mccAccount.id}</p>
            
            {subAccounts.length > 0 ? (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Sub Accounts ({subAccounts.length})</h3>
                <Accordion>
                  {subAccounts.map((account) => (
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
                      <div className="px-2 py-1">
                        <p className="text-sm">Resource: {account.resourceName}</p>
                        <p className="text-sm mt-1">Parent MCC: {account.parentId}</p>
                      </div>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ) : (
              <div className="mt-4 text-sm text-gray-500">
                No sub-accounts found for this MCC.
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
} 