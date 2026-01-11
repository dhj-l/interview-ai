export type Message = {
  /**
   * 消息角色
   * - user: 用户消息
   * - assistant: 助手消息
   * - system: 系统消息
   */
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export interface SessionData {
  sessionId: string;
  userId: string;
  position: string;
  messages: Message[];
  createAt: Date;
  lastActiveAt: Date;
}
