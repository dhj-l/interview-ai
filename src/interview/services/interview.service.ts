import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResumeAnalysisService } from './resume-analysis.service';

import { SessionManagerService } from 'src/ai/services/session.manager.service';
import { RESUME_ANALYSIS_SYSTEM_MESSAGE } from '../prompts/resume_quiz.prompts';
import { ConversationContinuationService } from './conversation-continuation.service';
/**
 * 面试服务（业务代码）
 */
@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly resumeAnalysisService: ResumeAnalysisService,
    private readonly sessionManagerService: SessionManagerService,
    private readonly conversationContinueService: ConversationContinuationService,
  ) {}
  /**
   * 分析简历并生成报告(首轮)
   * @param userId 用户id
   * @param position 岗位名称
   * @param resumeContent 简历内容
   * @param jobDescription 岗位要求
   * @returns 分析报告
   */
  async analyzeResumeAndGenerateReport(
    userId: string,
    position: string,
    resumeContent: string,
    jobDescription: string,
  ) {
    this.logger.log(userId);
    try {
      //获取对应提示词
      const sysMessage = RESUME_ANALYSIS_SYSTEM_MESSAGE(position);
      //创建对话
      const sessionId = this.sessionManagerService.createSession(
        userId,
        position,
        sysMessage,
      );
      // 分析简历
      const result = await this.resumeAnalysisService.analyzeResume(
        resumeContent,
        jobDescription,
      );
      //保存用户对话
      this.sessionManagerService.addMessage(
        sessionId,
        `简历内容:${resumeContent}`,
        'user',
      );
      //保存助手对话
      this.sessionManagerService.addMessage(
        sessionId,
        `分析结果:${result}`,
        'assistant',
      );
      return {
        sessionId,
        result,
      };
    } catch (error) {
      this.logger.error('分析简历并生成报告失败', error);
      throw error;
    }
  }

  /**
   * 继续对话
   * @param sessionId 会话id
   * @param userMessage 用户消息
   */
  async continueConversation(sessionId: string, userMessage: string) {
    try {
      // 继续对话
      this.sessionManagerService.addMessage(sessionId, userMessage, 'user');
      const history = this.sessionManagerService.getSession(sessionId) || [];
      //调用继续会话
      const reslut =
        (await this.conversationContinueService.continueConversation(
          history,
        )) || '';
      //保存助手对话
      this.sessionManagerService.addMessage(
        sessionId,
        reslut as string,
        'assistant',
      );
      return reslut;
    } catch (error) {
      this.logger.error('继续对话失败', error);
      throw error;
    }
  }
}
