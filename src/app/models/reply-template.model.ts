// src/app/models/reply-template.model.ts

export interface ReplyTemplate {
  id: number;
  category: ReplyCategory;
  text: string;
  emoji: string;
  language: string;
}

export interface ReplyTemplateResponse {
  success: boolean;
  message: string;
  data?: ReplyTemplate[];
}

export enum ReplyCategory {
  SUPPORT = 'SUPPORT',
  EMPATHY = 'EMPATHY',
  ENCOURAGEMENT = 'ENCOURAGEMENT',
  MOTIVATION = 'MOTIVATION',
  UNDERSTANDING = 'UNDERSTANDING'
}
