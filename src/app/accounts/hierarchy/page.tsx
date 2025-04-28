"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountHierarchy } from "@/components/accounts/AccountHierarchy";
import { AccountSelector } from "@/components/accounts/AccountSelector";
import { Card, CardBody, Spinner, Button } from "@nextui-org/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AccountHierarchyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [mccId, setMccId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    const mccIdFromUrl = searchParams.get("mccId");
    if (mccIdFromUrl) {
      setMccId(mccIdFromUrl);
    }
  }, [searchParams]);

  // Handle account selection
  const handleAccountSelect = (id: string) => {
    setAccountId(id);
    // Update URL to include the selected mccId
    if (id) {
      router.push(`/accounts/hierarchy?mccId=${id}`);
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
            <h2 className="text-lg font-semibold mb-4">Select MCC Account</h2>
            <AccountSelector 
              value={accountId || ""}
              onChange={handleAccountSelect}
              error={""}
            />
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