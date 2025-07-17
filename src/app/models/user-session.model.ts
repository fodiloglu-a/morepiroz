// src/app/models/user-session.model.ts

export interface UserSession {
  token: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  messageCount: number;
  replyCount: number;
}

export interface SessionRequest {
  deviceId?: string;
  language: string;
}

export interface SessionResponse {
  success: boolean;
  message: string;
  data?: UserSession;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
