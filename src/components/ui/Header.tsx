"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import Image from "next/image";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-lg font-bold">
                Google Ads Creator
              </Link>
            </div>
            <nav className="ml-6 flex space-x-4 sm:space-x-8">
              <Link
                href="/dashboard"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === "/dashboard"
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/campaigns/new"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === "/dashboard/campaigns/new"
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Create Campaign
              </Link>
              <Link
                href="/accounts/hierarchy"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === "/accounts/hierarchy"
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Account Hierarchy
              </Link>
              <Link
                href="/accounts/hierarchy?debug=true"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === "/accounts/hierarchy" && pathname.includes("debug=true")
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Hierarchy Debug
              </Link>
            </nav>
          </div>
          <div className="flex items-center">
            {session?.user && (
              <div className="flex items-center">
                <div className="flex items-center">
                  {session.user.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="h-8 w-8 rounded-full mr-2"
                      width={32}
                      height={32}
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700 mr-4 hidden sm:block">
                    {session.user.name}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="ml-3 inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </div>
            )}
            {!session && (
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <FcGoogle className="mr-2 h-5 w-5" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 