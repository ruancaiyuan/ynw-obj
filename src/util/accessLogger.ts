import { nanoid } from 'nanoid';

interface AccessLog {
  id: string;
  timestamp: number;
  ip: string;
  path: string;
  userAgent: string;
}

const STORAGE_KEY = 'access_logs';
const MAX_LOGS = 1000; // 最多保存1000条记录

class AccessLogger {
  private logs: AccessLog[] = [];

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const storedLogs = localStorage.getItem(STORAGE_KEY);
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
      this.logs = [];
    }
  }

  private saveLogs() {
    try {
      // 如果日志数量超过限制，删除最旧的记录
      if (this.logs.length > MAX_LOGS) {
        this.logs = this.logs.slice(-MAX_LOGS);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  async logAccess(path: string) {
    const log: AccessLog = {
      id: nanoid(),
      timestamp: Date.now(),
      ip: await this.getIP(),
      path,
      userAgent: navigator.userAgent,
    };

    this.logs.push(log);
    this.saveLogs();
  }

  private async getIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get IP:', error);
      return 'unknown';
    }
  }

  getLogs(): AccessLog[] {
    return this.logs;
  }
}

export const accessLogger = new AccessLogger(); 