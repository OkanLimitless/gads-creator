import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Ensure this file is server-only
import 'server-only';

// Define log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Persistent log entry
interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
}

// In-memory log storage to keep recent logs accessible
let memoryLogs: LogEntry[] = [];
const MAX_MEMORY_LOGS = 100;

// Detect if we're running in a serverless environment
const IS_SERVERLESS = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

// In serverless environments, we can only write to /tmp
const LOG_DIR = IS_SERVERLESS 
  ? '/tmp/logs' 
  : process.env.NODE_ENV === 'production'
    ? path.join(process.cwd(), 'logs')
    : path.join(process.cwd(), '.logs');

// Flag to track if file logging is available
let fileLoggingAvailable = !IS_SERVERLESS; // Default to true unless we know we're in serverless

// Try to create log directory - only once at startup
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    console.log(`Created log directory at ${LOG_DIR}`);
    fileLoggingAvailable = true;
  } else {
    fileLoggingAvailable = true;
  }
} catch (err) {
  console.warn(`Failed to create log directory: ${err}. File logging disabled.`);
  fileLoggingAvailable = false;
}

// Format a log entry for output
function formatLogEntry(entry: LogEntry): string {
  try {
    return JSON.stringify(entry);
  } catch (e) {
    // Handle circular references
    return JSON.stringify({
      ...entry,
      data: 'Error: Could not stringify data'
    });
  }
}

// Write a log entry to disk - only if file logging is available
function persistLog(entry: LogEntry) {
  // Always add to memory logs first
  memoryLogs.unshift(entry);
  if (memoryLogs.length > MAX_MEMORY_LOGS) {
    memoryLogs = memoryLogs.slice(0, MAX_MEMORY_LOGS);
  }
  
  // Skip file writing if we know it's not available
  if (!fileLoggingAvailable) {
    return;
  }
  
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logFile = path.join(LOG_DIR, `server-${today}.log`);
    
    const logLine = formatLogEntry(entry) + "\n";
    fs.appendFileSync(logFile, logLine);
  } catch (err) {
    // Only log the first file write error
    if (fileLoggingAvailable) {
      console.warn(`Failed to write log entry to file: ${err}. Falling back to memory-only logging.`);
      fileLoggingAvailable = false;
    }
  }
}

// Create a logger for a specific context
export function createLogger(context: string) {
  return {
    debug: (message: string, data?: any) => {
      const entry: LogEntry = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        level: 'debug',
        context,
        message,
        data
      };
      console.debug(`[${context}] ${message}`);
      persistLog(entry);
    },
    
    info: (message: string, data?: any) => {
      const entry: LogEntry = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        level: 'info',
        context,
        message,
        data
      };
      console.info(`[${context}] ${message}`);
      persistLog(entry);
    },
    
    warn: (message: string, data?: any) => {
      const entry: LogEntry = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        level: 'warn',
        context,
        message,
        data
      };
      console.warn(`[${context}] ${message}`);
      persistLog(entry);
    },
    
    error: (message: string, data?: any) => {
      const entry: LogEntry = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        level: 'error',
        context,
        message,
        data
      };
      console.error(`[${context}] ${message}`);
      persistLog(entry);
    }
  };
}

// Get recent logs (useful for debugging endpoints)
export function getRecentLogs(limit: number = 50, level?: LogLevel): LogEntry[] {
  if (level) {
    return memoryLogs
      .filter(log => log.level === level)
      .slice(0, limit);
  }
  return memoryLogs.slice(0, limit);
}

// Get logs by context
export function getLogsByContext(context: string, limit: number = 50): LogEntry[] {
  return memoryLogs
    .filter(log => log.context === context)
    .slice(0, limit);
}

// Create a log session to track related logs
export function createLogSession(sessionName: string) {
  const sessionId = uuidv4();
  const sessionLogger = createLogger(`session:${sessionName}:${sessionId}`);
  
  sessionLogger.info('Session started');
  
  return {
    sessionId,
    logger: sessionLogger,
    end: (status: 'success' | 'error' | 'timeout', data?: any) => {
      sessionLogger.info(`Session ended with status: ${status}`, data);
      return sessionId;
    }
  };
}

// Add information about the logging setup
export const loggerInfo = {
  isServerless: IS_SERVERLESS,
  logDirectory: LOG_DIR,
  fileLoggingAvailable,
  inMemoryLogCount: () => memoryLogs.length,
  environment: process.env.NODE_ENV || 'unknown'
}; 