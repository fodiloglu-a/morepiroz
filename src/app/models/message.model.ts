// src/app/models/message.model.ts

import {Reply} from './reply.model';

export interface Message {
  id: number;
  content: string;
  senderToken: string;
  receiverToken?: string;
  sentAt: Date;
  status: MessageStatus;
  hasReply: boolean;
  reply?: Reply;
}

export interface MessageRequest {
  content: string;
  senderToken: string;
}

export interface MessageResponse {
  success: boolean;
  message: string;
  data?: Message;
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  REPLIED = 'REPLIED'
}
