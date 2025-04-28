// Utility functions for capturing and formatting diagnostic information

export interface DiagnosticTrace {
  timestamp: string;
  source: string;
  message: string;
  data?: any;
}

export interface DiagnosticReport {
  traces: DiagnosticTrace[];
  startTime: string;
  endTime?: string;
  duration?: number;
  error?: Error;
  errorDetail?: any;
}

class DiagnosticTracer {
  private report: DiagnosticReport;
  private isActive: boolean = false;
  private timeoutMs: number = 0;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor() {
    this.report = {
      traces: [],
      startTime: new Date().toISOString(),
    };
  }

  start(timeoutMs: number = 15000) {
    this.report = {
      traces: [],
      startTime: new Date().toISOString(),
    };
    this.isActive = true;
    this.timeoutMs = timeoutMs;
    
    // Set a timeout to catch hanging requests
    if (timeoutMs > 0) {
      this.timeoutId = setTimeout(() => {
        this.addTrace("diagnostic-tracer", "Request timed out", { timeoutMs });
        this.end(new Error(`Request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }
    
    return this;
  }

  addTrace(source: string, message: string, data?: any) {
    if (!this.isActive) return this;
    
    this.report.traces.push({
      timestamp: new Date().toISOString(),
      source,
      message,
      data,
    });
    
    return this;
  }

  end(error?: Error, errorDetail?: any) {
    if (!this.isActive) return this.report;
    
    // Clear any pending timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    const endTime = new Date();
    this.report.endTime = endTime.toISOString();
    this.report.duration = endTime.getTime() - new Date(this.report.startTime).getTime();
    
    if (error) {
      this.report.error = error;
      this.report.errorDetail = errorDetail;
    }
    
    this.isActive = false;
    return this.report;
  }

  getReport(): DiagnosticReport {
    return this.report;
  }
}

// Create a singleton instance
export const diagnosticTracer = new DiagnosticTracer();

// Helper function to format an error object 
export function formatError(error: any): any {
  if (!error) return "No error details available";
  
  // Try to extract the most useful info from the error
  const formattedError: any = {};
  
  if (error instanceof Error) {
    formattedError.name = error.name;
    formattedError.message = error.message;
    formattedError.stack = error.stack;
  }
  
  // Handle axios errors
  if (error.response) {
    formattedError.status = error.response.status;
    formattedError.statusText = error.response.statusText;
    formattedError.data = error.response.data;
    formattedError.headers = error.response.headers;
  }
  
  // Handle network errors
  if (error.request) {
    formattedError.request = {
      method: error.config?.method,
      url: error.config?.url,
      data: error.config?.data,
    };
  }
  
  // If the error has a code, include it
  if (error.code) {
    formattedError.code = error.code;
  }
  
  // Include any original properties using Object.getOwnPropertyNames
  // to catch non-enumerable properties
  try {
    const errorObj = error;
    Object.getOwnPropertyNames(errorObj).forEach(key => {
      if (!formattedError[key] && typeof errorObj[key] !== 'function') {
        try {
          // Use JSON stringify/parse to handle circular references
          formattedError[key] = JSON.parse(JSON.stringify(errorObj[key]));
        } catch (e) {
          formattedError[key] = '[Circular or non-serializable data]';
        }
      }
    });
  } catch (e) {
    formattedError.originalError = String(error);
  }
  
  return formattedError;
}

export function createTimeoutPromise<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`${errorMessage}: Timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    
    promise
      .then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
} 