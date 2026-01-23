import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResumeAnalysisService } from './resume-analysis.service';

import { SessionManagerService } from 'src/ai/services/session.manager.service';
import { RESUME_ANALYSIS_SYSTEM_MESSAGE } from '../prompts/resume_quiz.prompts';
import { ConversationContinuationService } from './conversation-continuation.service';
import { Subject } from 'rxjs';
import { ProgressEvent, progressMessage } from '../type';
import { ResumeQuizDto } from '../dto/resume.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  ConsumptionRecord,
  ConsumptionRecordDocument,
  ConsumptionStatus,
  ConsumptionType,
} from '../schemas/consumption-record.schema';
import { Model, Types } from 'mongoose';
import { ResumeQuizResult } from '../schemas/interview-quit-result.schema';
import { ResumeQuizResultDocument } from '../schemas/interview-quit-result.schema';
import { User } from 'src/user/schemas/user.schema';
import { v4 } from 'uuid';
import { DocumentParserService } from './document-parser.service';
import { MockInterviewDto } from '../dto/mock.dto';
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
    private readonly documentParserService: DocumentParserService,
    @InjectModel(ConsumptionRecord.name)
    private readonly consumptionRecordModel: Model<ConsumptionRecordDocument>,
    @InjectModel(ResumeQuizResult.name)
    private readonly resumeQuizResultModel: Model<ResumeQuizResultDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  private async executeResumeQuiz(
    userId: string,
    dto: ResumeQuizDto,
    subject?: Subject<ProgressEvent>,
  ): Promise<any> {
    const recordId = v4();
    const resultId = v4();
    let consumptionRecord;
    try {
      // 1. 检查是否存在已有记录
      const existingResult = await this.checkExistingRecord(
        userId,
        dto.requestId,
      );
      if (existingResult) {
        this.emitProgressEvent(subject, 1, '已生成', 'done', existingResult);
        if (subject && !subject.closed) {
          subject.complete();
        }
        return existingResult;
      }

      // 2. 创建消费记录
      consumptionRecord = await this.createPendingConsumptionRecord(
        userId,
        recordId,
        resultId,
        dto,
      );

      // 3. 扣除余额
      await this.deductUserBalance(userId);

      // 4. 执行核心业务逻辑（解析简历、押题、分析匹配度）
      const { result, matchResult, content } = await this.processResumeQuiz(
        dto,
        subject,
      );

      // 5. 更新消费记录状态
      await this.updateConsumptionRecordStatus(
        consumptionRecord._id,
        ConsumptionStatus.SUCCESS,
      );

      // 6. 保存最终结果
      this.emitProgressEvent(subject, 0.95, '保存分析结果和押题', 'done');
      await this.saveResumeQuizResult(
        userId,
        dto,
        content,
        result,
        matchResult,
      );

      this.emitProgressEvent(subject, 1, '分析结果和押题保存完成', 'done', {
        result,
        matchResult,
      });

      if (subject && !subject.closed) {
        subject.complete();
      }

      return {
        result,
        matchResult,
      };
    } catch (error) {
      await this.handleResumeQuizError(
        userId,
        error,
        consumptionRecord,
        subject,
      );
      throw error;
    }
  }

  /**
   * 检查是否已经存在对应的消费记录
   */
  private async checkExistingRecord(userId: string, requestId: string) {
    const res = await this.consumptionRecordModel.findOne({
      userId,
      requestId,
      status: {
        $in: [ConsumptionStatus.PENDING, ConsumptionStatus.SUCCESS],
      },
    });

    if (!res) {
      return null;
    }

    if (res.status === ConsumptionStatus.PENDING) {
      throw new Error('面试分析任务正在进行中,请稍等');
    }

    const resume = await this.resumeQuizResultModel
      .findOne({
        userId,
        requestId,
      })
      .exec();

    if (!resume) {
      throw new Error('简历分析内容不存在,请重新提交');
    }

    const remainingCount = await this.getRemainingCount({
      userId,
      type: 'resume',
    });

    return {
      requestId,
      questions: resume.questions,
      summary: resume.summary,
      remainingCount,
      conversationRecordId: res.recordId,
      isFormCache: true,
    };
  }

  /**
   * 创建待处理的消费记录
   */
  private async createPendingConsumptionRecord(
    userId: string,
    recordId: string,
    resultId: string,
    dto: ResumeQuizDto,
  ) {
    const {
      requestId,
      company,
      position: positionName,
      jd,
      resumeContent = '',
      minSalary,
      maxSalary,
    } = dto;

    return await this.createConsumptionRecord({
      userId,
      user: new Types.ObjectId(userId),
      recordId,
      requestId,
      type: ConsumptionType.RESUME_QUIZ,
      status: ConsumptionStatus.PENDING,
      consumedCount: 1,
      description: `简历押题: ${dto.company} ${dto.position}`,
      inputData: {
        company,
        positionName,
        jd,
        resume: resumeContent,
        minSalary,
        maxSalary,
      },
      resultId,
      startedAt: new Date(),
      createdAt: new Date(),
      isRefunded: false,
    });
  }

  /**
   * 处理简历解析、押题、匹配度分析的核心流程
   */
  private async processResumeQuiz(
    dto: ResumeQuizDto,
    subject?: Subject<ProgressEvent>,
  ) {
    this.logger.log('开始分析简历');
    this.emitProgressEvent(subject, 0.1, '开始分析简历', 'prepare');

    const content = await this.documentParserService.parserDocument(
      dto.resumeUrl,
    );
    dto.resumeContent = content;
    this.emitProgressEvent(subject, 0.3, '简历分析完成', 'done', content);

    this.logger.log('开始简历押题');
    this.emitProgressEvent(subject, 0.4, '开始简历押题', 'prepare');
    const result = await this.resumeAnalysisService.resumeQuiz(dto);

    this.emitProgressEvent(
      subject,
      0.7,
      '简历押题完成,开始分析匹配度',
      'done',
      result,
    );
    this.logger.log('问题', result.questions.length);

    this.emitProgressEvent(subject, 0.8, '开始分析匹配度', 'prepare');
    const matchResult = await this.resumeAnalysisService.analyzeMatchScore(dto);

    this.emitProgressEvent(subject, 0.9, '匹配度分析完成', 'done', matchResult);

    return { result, matchResult, content };
  }

  /**
   * 更新消费记录状态
   */
  private async updateConsumptionRecordStatus(
    id: any,
    status: ConsumptionStatus,
    error?: any,
  ) {
    const updateData: any = {
      status,
      completedAt: new Date(),
    };

    if (status === ConsumptionStatus.FAILED && error) {
      updateData.errorMessage = error.message;
      updateData.errors = error.errors;
      updateData.errorStack = error.stack;
      updateData.isRefunded = true;
      updateData.failedAt = new Date();
      updateData.refundedAt = new Date();
    }

    return await this.consumptionRecordModel.findOneAndUpdate(
      { _id: id },
      updateData,
      { new: false },
    );
  }

  /**
   * 保存简历押题结果
   */
  private async saveResumeQuizResult(
    userId: string,
    dto: ResumeQuizDto,
    resumeSnapshot: string,
    result: any,
    matchResult: any,
  ) {
    const {
      requestId,
      company,
      position: positionName,
      jd,
      minSalary,
      maxSalary,
    } = dto;

    await this.resumeQuizResultModel.create({
      requestId,
      user: new Types.ObjectId(userId),
      userId,
      company,
      position: positionName,
      salaryRange: `${minSalary}-${maxSalary}`,
      jobDescription: jd,
      resumeSnapshot,
      questions: result.questions,
      summary: result.summary,
      matchScore: matchResult.matchScore,
      totalQuestions: result.questions.length,
      matchLevel: matchResult.matchLevel,
      skillMatches: matchResult.matchedSkills,
      missingSkills: matchResult.missingSkills,
      knowledgeGaps: matchResult.knowledgeGaps,
      learningPriorities: matchResult.learningPriorities,
      radarChart: matchResult.radarData,
      strengths: matchResult.strengths,
      weaknesses: matchResult.weaknesses,
      interviewTips: matchResult.interviewTips,
    });
  }

  /**
   * 统一错误处理
   */
  private async handleResumeQuizError(
    userId: string,
    error: any,
    consumptionRecord: any,
    subject?: Subject<ProgressEvent>,
  ) {
    // 回退余额
    await this.refundCount({
      userId,
      type: 'resume',
    });

    // 更新消费记录状态为失败
    if (consumptionRecord) {
      await this.updateConsumptionRecordStatus(
        consumptionRecord._id,
        ConsumptionStatus.FAILED,
        error,
      );
    }

    // 发送错误事件
    if (subject && !subject.closed) {
      subject.next({
        type: 'error',
        progress: 0,
        label: '生成失败',
        message: error.message,
      });
      subject.complete();
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

  /**
   * 获取对应用户的面试类型剩余次数
   */
  async getRemainingCount(data: {
    userId: string;
    type: 'resume' | 'special' | 'behavior';
  }) {
    const { userId, type } = data;
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    const {
      resumeRemainingCount,
      specialRemainingCount,
      behaviorRemainingCount,
    } = user;
    switch (type) {
      case 'resume':
        return resumeRemainingCount;
      case 'special':
        return specialRemainingCount;
      case 'behavior':
        return behaviorRemainingCount;
    }
  }
  /**
   * 退还用户余额
   */
  async refundCount(data: {
    userId: string;
    type: 'resume' | 'special' | 'behavior';
  }) {
    const { userId, type } = data;
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    switch (type) {
      case 'resume':
        user.resumeRemainingCount += 1;
        break;
      case 'special':
        user.specialRemainingCount += 1;
        break;
      case 'behavior':
        user.behaviorRemainingCount += 1;
        break;
    }
    return await user.save();
  }
  /**
   * 创建消费记录
   */
  async createConsumptionRecord(data: ConsumptionRecord) {
    return await this.consumptionRecordModel.create(data);
  }
  /**
   * 扣除用户余额(原子扣除)
   */
  async deductUserBalance(userId: string) {
    const user = await this.userModel.findOneAndUpdate(
      {
        _id: userId,
        resumeRemainingCount: {
          $gt: 0,
        },
      },
      {
        $inc: {
          resumeRemainingCount: -1,
        },
      },
      {
        new: false,
      },
    );
    if (!user) {
      throw new Error('用户不存在或余额不足');
    }
    return user;
  }
  /**
   * 开始模拟面试
   */
  async startMockInterview(data: MockInterviewDto, userId: string) {
    const subject = new Subject<MockInterviewDto>();

    return subject;
  }
}
