import { redirect } from "next/navigation";

// Configure the runtime for this page
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Home page that redirects to login
export default function Home() {
  // Use the redirect function to send users to the login page
  redirect("/login");
  
  // This part won't run due to the redirect, but is needed to satisfy TypeScript
  return null;
}
