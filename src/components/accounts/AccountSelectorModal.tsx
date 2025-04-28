import { Modal, ModalContent, ModalHeader, ModalBody, Input, ModalFooter, Button } from "@nextui-org/react";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";

interface Customer {
  id: string;
  resourceName: string;
  displayName?: string;
  isMCC?: boolean;
  parentId?: string;
}

interface AccountSelectorModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  accounts: Customer[];
  onSelectAccount: (account: Customer) => void;
}

export function AccountSelectorModal({
  isOpen,
  onOpenChange,
  accounts,
  onSelectAccount,
}: AccountSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter accounts based on search query - use useMemo to cache results
  const filteredAccounts = useMemo(() => {
    if (!searchQuery.trim()) return accounts;
    
    const searchLower = searchQuery.toLowerCase();
    return accounts.filter((account) => (
      account.id.includes(searchLower) ||
      (account.displayName?.toLowerCase().includes(searchLower))
    ));
  }, [searchQuery, accounts]);

  // Group accounts by MCC and regular - also using useMemo for efficiency
  const { mccAccounts, regularAccounts } = useMemo(() => {
    return {
      mccAccounts: filteredAccounts.filter((account) => account.isMCC),
      regularAccounts: filteredAccounts.filter((account) => !account.isMCC)
    };
  }, [filteredAccounts]);

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange}
      size="lg"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose: () => void) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Select Google Ads Account
            </ModalHeader>
            <ModalBody>
              <Input
                autoFocus
                placeholder="Search by account name or ID"
                startContent={<Search size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="bordered"
                size="sm"
                className="mb-4"
              />

              {mccAccounts.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">MCC Accounts</h3>
                  <div className="space-y-2">
                    {mccAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                        onClick={() => onSelectAccount(account)}
                      >
                        <div className="font-medium">
                          {account.displayName || `Account ${account.id}`}
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                            MCC
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">ID: {account.id}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Regular Accounts</h3>
                {regularAccounts.length > 0 ? (
                  <div className="space-y-2">
                    {regularAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                        onClick={() => onSelectAccount(account)}
                      >
                        <div className="font-medium">
                          {account.displayName || `Account ${account.id}`}
                        </div>
                        <div className="text-sm text-gray-500">ID: {account.id}</div>
                        {account.parentId && (
                          <div className="text-xs text-gray-400">
                            Parent: {account.parentId}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    {searchQuery
                      ? "No accounts match your search criteria"
                      : "No regular accounts found"}
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onClick={onClose}>
                Cancel
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
} 