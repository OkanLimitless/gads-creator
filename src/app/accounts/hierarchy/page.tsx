"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountHierarchy } from "@/components/accounts/AccountHierarchy";
import { AccountSelector } from "@/components/accounts/AccountSelector";
import { Card, CardBody, Spinner, Button } from "@nextui-org/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function AccountHierarchyPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [mccId, setMccId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [debug, setDebug] = useState<boolean>(false);

  useEffect(() => {
    const mccIdFromUrl = searchParams.get("mccId");
    const debugFromUrl = searchParams.get("debug") === "true";
    
    if (mccIdFromUrl) {
      console.log("Hierarchy page: Setting MCC ID from URL:", mccIdFromUrl);
      setMccId(mccIdFromUrl);
      setAccountId(mccIdFromUrl);
    }
    
    setDebug(debugFromUrl);
  }, [searchParams]);

  // Handle account selection
  const handleAccountSelect = (id: string) => {
    console.log("Hierarchy page: Account selected:", id);
    setAccountId(id);
    setMccId(id);
    
    // Update URL to include the selected mccId
    if (id) {
      const newUrl = `/accounts/hierarchy?mccId=${id}${debug ? "&debug=true" : ""}`;
      console.log("Hierarchy page: Updating URL to:", newUrl);
      router.push(newUrl);
    }
  };

  // Toggle debug mode
  const toggleDebug = () => {
    const newDebug = !debug;
    setDebug(newDebug);
    
    if (mccId) {
      router.push(`/accounts/hierarchy?mccId=${mccId}${newDebug ? "&debug=true" : ""}`);
    } else {
      router.push(`/accounts/hierarchy${newDebug ? "?debug=true" : ""}`);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" label="Loading..." />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="max-w-lg w-full">
          <CardBody className="flex flex-col items-center p-6 text-center">
            <h1 className="text-xl font-bold mb-4">Authentication Required</h1>
            <p className="mb-6">You need to sign in to access this page.</p>
            <Button 
              color="primary" 
              as={Link} 
              href="/api/auth/signin"
            >
              Sign In
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft size={16} className="mr-2" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">Google Ads Account Hierarchy</h1>
      
      {/* Account selector for MCC accounts only */}
      <div className="mb-6">
        <Card className="w-full">
          <CardBody>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Select MCC Account</h2>
              <Button 
                variant="flat" 
                size="sm" 
                color={debug ? "warning" : "default"}
                onClick={toggleDebug}
              >
                {debug ? "Debug Mode ON" : "Debug Mode"}
              </Button>
            </div>
            <AccountSelector 
              value={accountId || ""}
              onChange={handleAccountSelect}
              error={""}
            />
            {debug && (
              <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <h3 className="text-sm font-medium mb-2">Debug Info:</h3>
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify({
                    mccId,
                    accountId,
                    debug,
                    sessionStatus: status,
                    hasSession: !!session,
                  }, null, 2)}
                </pre>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
      
      {/* Account hierarchy display */}
      {mccId ? (
        <AccountHierarchy mccId={mccId} />
      ) : (
        <Card className="w-full">
          <CardBody className="text-center py-8">
            <p className="text-gray-600">
              Please select an MCC account to view its hierarchy.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default function AccountHierarchyPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" label="Loading..." />
      </div>
    }>
      <AccountHierarchyPageContent />
    </Suspense>
  );
} 