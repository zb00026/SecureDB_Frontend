import { Asset } from "./assets/Asset";
import { User } from "./User";

export interface TerminalSessionRecording {
  id: number;
  sessionId: string;
  asset: Asset;
  user: User;
  username: string; // SSH username used
  hostAddress: string;
  portNumber: number;
  sessionStart: string; // ISO datetime string
  sessionEnd?: string; // ISO datetime string
  durationSeconds?: number;
  fullSessionLog?: string; // Complete session transcript
  commandCount: number;
  isActive: boolean;
  clientIp?: string;
  userAgent?: string;
  terminalSize?: string; // Format: "80x24"
  createdAt: string; // ISO datetime string
  updatedAt?: string; // ISO datetime string
}

export interface TerminalSessionRecordingDTO {
  sessionId: string;
  assetId: number;
  userId: number;
  username: string;
  hostAddress: string;
  portNumber: number;
  clientIp?: string;
  userAgent?: string;
  terminalSize?: string;
}
