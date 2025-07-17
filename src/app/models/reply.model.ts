// src/app/models/reply.model.ts

import {ReplyTemplate} from './reply-template.model';

export interface Reply {
  id: number;
  messageId: number;
  templateId: number;
  customText?: string;
  repliedAt: Date;
  template?: ReplyTemplate;
}

export interface ReplyRequest {
  messageId: number;
  templateId: number;
  receiverToken: string;
}

export interface ReplyResponse {
  success: boolean;
  message: string;
  data?: Reply;
}
