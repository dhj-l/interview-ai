import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResumeAnalysisService } from './resume-analysis.service';

import { SessionManagerService } from 'src/ai/services/session.manager.service';
import { RESUME_ANALYSIS_SYSTEM_MESSAGE } from '../prompts/resume_quiz.prompts';
import { ConversationContinuationService } from './conversation-continuation.service';
import { AnalyzeResumeDto } from '../dto/session.dto';
import { Subject } from 'rxjs';
import { ProgressEvent } from '../type';
import { ResumeQuizDto } from '../dto/resume.dto';
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

  private async executeResumeQuiz(
    userId: string,
    dto: ResumeQuizDto,
    subject?: Subject<ProgressEvent>,
  ): Promise<any> {
    try {
      const progressMessage = [
        {
          progress: 0.05,
          message: '🤖 AI正在深度理解你的内容,请稍等...',
        },
        {
          progress: 0.1,
          message: '📊 AI正在分析你的技术栈和项目经验,请稍等...',
        },
        {
          progress: 0.15,
          message: '🔍 AI正在识别你的核心竞争力,请稍等...',
        },
        {
          progress: 0.2,
          message: '📋 AI正在对比岗位要求与您的背景,请稍等...',
        },

        {
          progress: 0.25,
          message: '💡 AI 正在设计针对性的技术问题,请稍等...',
        },
        {
          progress: 0.3,
          message: '🎯 AI 正在挖掘您简历中的项目亮点,请稍等...',
        },
        {
          progress: 0.35,
          message: '🧠 AI 正在构思场景化的面试问题,请稍等...',
        },
        {
          progress: 0.4,
          message: '⚡ AI 正在设计不同难度的问题组合,请稍等...',
        },
        {
          progress: 0.45,
          message: '🔬 AI 正在分析您的技术深度和广度,请稍等...',
        },
        {
          progress: 0.5,
          message: '📝 AI 正在生成基于 STAR 法则的答案,请稍等...',
        },
        {
          progress: 0.55,
          message: '✨ AI 正在优化问题的表达方式,请稍等...',
        },
        {
          progress: 0.6,
          message: '🎨 AI 正在为您准备回答要点和技巧,请稍等...',
        },
        {
          progress: 0.65,
          message: '💎 AI 正在提炼您的项目成果和亮点,请稍等...',
        },
        {
          progress: 0.7,
          message: '🔧 AI 正在调整问题难度分布,请稍等...',
        },
        {
          progress: 0.75,
          message: '📚 AI 正在补充技术关键词和考察点  ,请稍等...',
        },
        {
          progress: 0.8,
          message: '🎓 AI 正在完善综合评估建议,请稍等...',
        },
        {
          progress: 0.85,
          message: '🚀 AI 正在做最后的质量检查,请稍等...',
        },
        {
          progress: 0.9,
          message: '✅ AI 即将完成问题生成...',
        },
      ];
      const result = this.resumeAnalysisService.resumeQuiz(dto);
      let index = 0;
      let currentMessage = progressMessage[index];
      let timer = setInterval(() => {
        index++;
        currentMessage = progressMessage[index];
        const { progress, message } = currentMessage;
        //发送事件
        this.emitProgressEvent(subject, progress, message, 'generating');
        if (index === progressMessage.length - 1) {
          result.then((res) => {
            this.emitProgressEvent(subject, 1, '生成完成', 'done', res);
          });
          clearInterval(timer);
        }
      }, 1000);
    } catch (error) {
      if (subject && !subject.closed) {
        subject.next({
          type: 'error',
          progress: 0,
          label: '生成失败',
          message: error.message,
        });
        subject.complete();
      }
      throw error;
    }
  }
  private emitProgressEvent(
    subject: Subject<ProgressEvent> | undefined,
    progress: number,
    label: string,
    stage?: 'prepare' | 'generating' | 'saving' | 'done',
    data?: any,
  ) {
    if (subject && !subject.closed) {
      subject.next({
        type: 'progress',
        progress,
        label,
        stage,
        data,
      });
    }
  }
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
      const result =
        await this.resumeAnalysisService.analyzeResume(resumeContent);
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

  /**
   * 根据岗位名称和简历内容生成押题
   * @param userId 用户id
   * @param dto 包含岗位名称和简历内容的对象
   * @returns 押题结果
   */
  generateResumeQuizWithProgress(
    userId: string,
    dto: ResumeQuizDto,
  ): Subject<ProgressEvent> {
    const subject = new Subject<ProgressEvent>();
    this.executeResumeQuiz(userId, dto, subject).catch((error) => {
      subject.error(error);
    });
    return subject;
  }
}
