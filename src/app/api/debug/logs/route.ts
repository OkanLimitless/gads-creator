import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRecentLogs, getLogsByContext } from "@/lib/serverLogger";

export async function GET(request: NextRequest) {
  try {
    // Only allow in development or with admin session
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user || session.user.email !== process.env.ADMIN_EMAIL) {
        return NextResponse.json(
          { error: "Not authorized to view logs" },
          { status: 403 }
        );
      }
    }
    
    const searchParams = request.nextUrl.searchParams;
    const context = searchParams.get('context');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const level = searchParams.get('level') as any;
    
    if (context) {
      const logs = getLogsByContext(context, limit);
      return NextResponse.json({ logs, count: logs.length });
    } else {
      const logs = getRecentLogs(limit, level);
      return NextResponse.json({ logs, count: logs.length });
    }
  } catch (error) {
    console.error("Error retrieving logs:", error);
    return NextResponse.json(
      { error: "Failed to retrieve logs" },
      { status: 500 }
    );
  }
} 