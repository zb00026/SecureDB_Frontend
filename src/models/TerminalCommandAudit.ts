import { TerminalSessionRecording } from "./TerminalSessionRecording";

export interface TerminalCommandAudit {
  id: number;
  sessionId: string;
  rawInput: string; // Exact input received
  parsedCommand: string; // Cleaned/parsed command
  commandOutput: string; // Response from the command
  executionTimeMs?: number;
  clientIp?: string;
  executedAt: string; // ISO datetime string
  commandSequence: number; // Order in session
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isDangerous: boolean; // Flag for potentially dangerous commands
  commandType: string; // e.g., "file_operation", "system", "network", etc.
  username: string; // SSH username used
  sessionRecording: TerminalSessionRecording;
}

export interface TerminalCommandAuditDTO {
  sessionId: string;
  assetId: number;
  userId: number;
  username: string;
  rawInput: string;
  parsedCommand: string;
  commandOutput: string;
  executionTimeMs?: number;
  clientIp?: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CommandType = 'file_operation' | 'process_management' | 'network' | 'security' | 'system_admin' | 'text_processing' | 'editor' | 'other';
