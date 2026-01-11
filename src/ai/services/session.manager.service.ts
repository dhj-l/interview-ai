import { Injectable } from '@nestjs/common';
import { SessionData } from '../interface/message.interface';
import { v4 as uuidv4 } from 'uuid';
/**
 * 会话管理器服务(通用功能代码)
 */
@Injectable()
export class SessionManagerService {
  private readonly sessionMap = new Map<string, SessionData>();
  constructor() {}
  /**
   * 创建会话
   * @param userId 用户ID
   * @param position 岗位
   * @param systemMessage 系统消息
   * @returns 会话ID
   */
  createSession(userId: string, position: string, systemMessage: string) {
    const sessionId = uuidv4();
    const sessionData: SessionData = {
      sessionId,
      userId,
      position,
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
      ],
      createAt: new Date(),
      lastActiveAt: new Date(),
    };
    this.sessionMap.set(sessionId, sessionData);
    return sessionId;
  }

  /**
   * 获取会话
   * @param sessionId 会话ID
   * @returns 会话数据
   */
  getSession(sessionId: string) {
    return this.sessionMap.get(sessionId)?.messages;
  }
  /**
   * 添加消息
   * @param sessionId 会话ID
   * @param message 消息
   * @param role 消息角色 user | assistant
   */
  addMessage(sessionId: string, message: string, role: 'user' | 'assistant') {
    const sessionData = this.sessionMap.get(sessionId);
    if (!sessionData) {
      throw new Error('会话不存在');
    }
    sessionData.messages.push({
      role,
      content: message,
    });
    sessionData.lastActiveAt = new Date();
  }
  /**
   * 删除会话，将长时间未活动的会话删除
   */
  deleteSession() {
    const now = new Date();
    const inactiveThreshold = 1000 * 60 * 60;
    for (const [sessionId, sessionData] of this.sessionMap.entries()) {
      if (
        now.getTime() - sessionData.lastActiveAt.getTime() >
        inactiveThreshold
      ) {
        this.sessionMap.delete(sessionId);
      }
    }
  }
  /**
   * 结束对话
   * @param sessionId 会话ID
   */
  endSession(sessionId: string) {
    if (this.sessionMap.has(sessionId)) {
      this.sessionMap.delete(sessionId);
    }
  }
}
