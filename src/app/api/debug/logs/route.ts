import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRecentLogs, getLogsByContext, loggerInfo } from "@/lib/serverLogger";

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
    
    // Get logs based on parameters
    let logs = [];
    if (context) {
      logs = getLogsByContext(context, limit);
    } else {
      logs = getRecentLogs(limit, level);
    }
    
    // Add status info to the response
    return NextResponse.json({ 
      logs,
      count: logs.length,
      loggerStatus: {
        ...loggerInfo,
        inMemoryLogCount: loggerInfo.inMemoryLogCount(),
        serverTime: new Date().toISOString(),
        // Add environment-specific info to help debug serverless issues
        env: {
          vercel: process.env.VERCEL === '1' ? true : false,
          aws: process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined,
          nodeEnv: process.env.NODE_ENV,
          tempDir: process.env.TMPDIR || '/tmp'
        }
      }
    });
  } catch (error) {
    console.error("Error retrieving logs:", error);
    return NextResponse.json(
      { 
        error: "Failed to retrieve logs",
        message: error instanceof Error ? error.message : String(error),
        loggerStatus: {
          ...loggerInfo,
          inMemoryLogCount: loggerInfo.inMemoryLogCount(),
          serverTime: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
} 