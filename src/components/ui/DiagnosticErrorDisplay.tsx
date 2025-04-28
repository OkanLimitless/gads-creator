"use client";

import { useState } from "react";
import { Button } from "@nextui-org/react";

interface DiagnosticTrace {
  timestamp: string;
  source: string;
  message: string;
  data?: any;
}

interface DiagnosticReport {
  traces: DiagnosticTrace[];
  startTime: string;
  endTime?: string;
  duration?: number;
  error?: any;
  errorDetail?: any;
}

interface DiagnosticErrorDisplayProps {
  error: string;
  details?: string;
  diagnosticReport?: DiagnosticReport;
  timestamp?: string;
  code?: string;
  onRetry?: () => void;
  onUseSampleData?: () => void;
}

export function DiagnosticErrorDisplay({
  error,
  details,
  diagnosticReport,
  timestamp,
  code,
  onRetry,
  onUseSampleData
}: DiagnosticErrorDisplayProps) {
  const [showFullDiagnostics, setShowFullDiagnostics] = useState(false);
  
  // Format timestamp to local time
  const formattedTime = timestamp ? new Date(timestamp).toLocaleString() : '';
  
  // Calculate time difference between traces if available
  const getElapsedTime = (trace: DiagnosticTrace, index: number, traces: DiagnosticTrace[]) => {
    if (index === 0) return '0ms';
    const prevTime = new Date(traces[index - 1].timestamp).getTime();
    const currTime = new Date(trace.timestamp).getTime();
    return `+${currTime - prevTime}ms`;
  };
  
  // Check if error is a timeout
  const isTimeout = error?.toLowerCase().includes('timeout') || error?.toLowerCase().includes('timed out');
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <div className="flex flex-col">
        <h3 className="text-sm font-medium text-red-800">Error loading accounts</h3>
        <div className="mt-2 text-sm text-red-700">{error}</div>
        
        {details && (
          <div className="mt-1 text-xs text-red-600">{details}</div>
        )}
        
        {code && (
          <div className="mt-1 text-xs text-gray-500">Error code: {code}</div>
        )}
        
        {timestamp && (
          <div className="mt-1 text-xs text-gray-500">Occurred at: {formattedTime}</div>
        )}
        
        {isTimeout && (
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
            <h4 className="font-medium text-yellow-800">Why does this happen?</h4>
            <ul className="list-disc pl-5 mt-1 text-yellow-700 text-xs space-y-1">
              <li>The Google Ads API is known to be slow on first access after a period of inactivity</li>
              <li>Your refresh token might need to be renewed if you haven't used the application recently</li>
              <li>Network connectivity issues between our server and Google's API servers</li>
              <li>Google Ads API service may be experiencing temporary issues</li>
            </ul>
            <div className="mt-2 text-xs text-yellow-800">
              <strong>Suggestions:</strong> Try refreshing, using sample data for now, or signing out and back in to refresh your OAuth tokens.
            </div>
          </div>
        )}
        
        {diagnosticReport && (
          <details className="mt-3 text-xs">
            <summary 
              className="cursor-pointer text-blue-500 hover:text-blue-700"
              onClick={(e) => {
                e.preventDefault();
                setShowFullDiagnostics(!showFullDiagnostics);
              }}
            >
              Diagnostic Information
            </summary>
            
            {showFullDiagnostics && (
              <div className="mt-2 border border-gray-200 rounded p-2 bg-gray-50 overflow-auto">
                <div className="mb-2">
                  <span className="font-semibold">Request Duration:</span>{' '}
                  {diagnosticReport.duration ? `${diagnosticReport.duration}ms` : 'Unknown'}
                </div>
                
                <div className="mb-3">
                  <div className="font-semibold mb-1">Request Timeline:</div>
                  <div className="border-l-2 border-gray-300 pl-3 space-y-2">
                    {diagnosticReport.traces.map((trace, index) => (
                      <div key={index} className="text-xs">
                        <div className="flex items-baseline">
                          <span className="font-mono text-gray-500 w-16">
                            {getElapsedTime(trace, index, diagnosticReport.traces)}
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-1 rounded text-xs mr-2">
                            {trace.source}
                          </span>
                          <span>{trace.message}</span>
                        </div>
                        {trace.data && (
                          <div className="ml-16 mt-1 font-mono bg-gray-100 p-1 rounded text-xs overflow-auto">
                            {JSON.stringify(trace.data, null, 2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {diagnosticReport.error && (
                  <div>
                    <div className="font-semibold mb-1 text-red-700">Error Details:</div>
                    <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">
                      {JSON.stringify(diagnosticReport.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </details>
        )}
        
        <div className="mt-4 flex gap-3">
          {onRetry && (
            <Button 
              color="primary" 
              size="sm"
              onClick={onRetry}
            >
              Try Again
            </Button>
          )}
          
          {onUseSampleData && (
            <Button 
              variant="bordered" 
              size="sm"
              onClick={onUseSampleData}
            >
              Use Sample Data
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 