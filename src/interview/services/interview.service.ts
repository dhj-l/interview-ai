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
      //先检查是否已经存在对应的消费记录
      const { requestId } = dto;
      const res = await this.consumptionRecordModel.findOne({
        userId,
        requestId: requestId,
        status: {
          $in: [ConsumptionStatus.PENDING, ConsumptionStatus.SUCCESS],
        },
      });
      //如果存在就返回
      if (res) {
        //如果状态为PENDING,说明任务正在进行中,需要等待
        if (res.status === ConsumptionStatus.PENDING) {
          throw new Error('面试分析任务正在进行中,请稍等');
        }
        //如果状态为SUCCESS,就根据userId和requestId查询对应的结果
        const resume = await this.resumeQuizResultModel
          .findOne({
            userId,
            requestId,
          })
          .exec();
        if (!resume) {
          throw new Error('简历分析内容,请重新提交');
        }
        //获取剩余次数
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
      //用户扣费
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
      this.logger.log(user);
      if (!user) {
        throw new Error('用户余额不足,请充值');
      }
      //创建消费记录
      consumptionRecord = await this.consumptionRecordModel.create({
        userId,
        user: new Types.ObjectId(userId),
        recordId,
        requestId: dto.requestId,
        type: ConsumptionType.RESUME_QUIZ,
        status: ConsumptionStatus.PENDING,
        consumedCount: 1,
        description: `简历押题: ${dto.company} ${dto.position}`,
        inputData: {
          company: dto.company,
          positionName: dto.position,
          jd: dto.jd,
          resume: dto.resumeContent,
          minSalary: dto.minSalary,
          maxSalary: dto.maxSalary,
        },
        resultId,
        startedAt: new Date(),
      });
      this.logger.log('创建消费记录:%s', consumptionRecord);
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
          // 最后一次发送事件，包含最终结果
          result.then(async (res) => {
            //将结果保存到数据库(TODO)
            //更新消费记录状态为成功
            await this.consumptionRecordModel.findOneAndUpdate(
              {
                _id: consumptionRecord._id,
              },
              {
                status: ConsumptionStatus.SUCCESS,
              },
            );
            this.emitProgressEvent(subject, 1, '生成完成', 'done', res);
          });
          clearInterval(timer);
        }
      }, 1000);
    } catch (error) {
      //回退用户余额
      await this.refundCount({
        userId,
        type: 'resume',
      });
      //将消费记录状态设置为失败
      await this.consumptionRecordModel.findOneAndUpdate(
        {
          _id: consumptionRecord._id,
        },
        {
          status: ConsumptionStatus.FAILED,
          errorMessage: error.message,
          errors: error.errors,
          errorStack: error.stack,
          //是否已退款
          isRefunded: true,
          failedAt: new Date(),
          refundedAt: new Date(),
        },
        {
          new: false,
        },
      );
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
}
