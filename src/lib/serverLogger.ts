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

// Directory for log files - uses tmp directory in development
const LOG_DIR = process.env.NODE_ENV === 'production'
  ? path.join(process.cwd(), 'logs')
  : path.join(process.cwd(), '.logs');

// Ensure the log directory exists
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
} catch (err) {
  console.error('Failed to create log directory:', err);
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

// Write a log entry to disk
function persistLog(entry: LogEntry) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logFile = path.join(LOG_DIR, `server-${today}.log`);
    
    const logLine = formatLogEntry(entry) + "\n";
    fs.appendFileSync(logFile, logLine);
    
    // Add to memory logs
    memoryLogs.unshift(entry);
    if (memoryLogs.length > MAX_MEMORY_LOGS) {
      memoryLogs = memoryLogs.slice(0, MAX_MEMORY_LOGS);
    }
  } catch (err) {
    console.error('Failed to write log entry:', err);
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