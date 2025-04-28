import { redirect } from "next/navigation";

// This ensures the redirect happens on both client and server
export default function Home() {
  // Use the redirect function to send users to the login page
  redirect("/login");
  
  // This part won't run due to the redirect, but is needed to satisfy TypeScript
  return null;
}
