import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaType, SchemaTypes, Types } from 'mongoose';

/**
 * 面试类型
 */
export enum AIInterviewType {
  /**
   * 专项面试
   */
  SPECIAL = 'special',
  /**
   * 综合面试
   */
  BEHAVIOR = 'behavior',
}

/**
 * STAR模型评分
 */
@Schema({
  _id: false,
})
export class STARScore {
  /**
   * 情景描述得分
   */
  @Prop({ required: true })
  situation?: number;
  /**
   * 任务说明得分
   */
  @Prop({ required: true })
  task?: number;
  /**
   * 行动措施得分
   */
  @Prop({ required: true })
  action?: number;
  /**
   * 结果呈现得分
   */
  @Prop({ required: true })
  result?: number;
  /**
   * 整体得分
   */
  @Prop({ required: true })
  overallScore?: number;
  /**
   * 反馈建议
   */
  @Prop({ required: true })
  feedback?: string;
}
export const STARScoreSchema = SchemaFactory.createForClass(STARScore);
/**
 * 单个问答记录
 */
@Schema({
  _id: false,
})
export class InterviewQuestionAnswer {
  /**
   * 问题
   */
  @Prop({ required: true })
  question: string;
  /**
   * 回答
   */
  @Prop({ required: true })
  answer: string;
  /**
   * 参考答案
   */
  @Prop({ required: true })
  referenceAnswer: string;
  /**
   * 回答时长
   */
  @Prop({ required: true })
  duration?: number;
  /**
   * 分数
   */
  @Prop({ required: true, type: Number, min: 0, max: 100 })
  score?: number;
  /**
   * star模型评分
   */
  @Prop({ required: true, type: STARScoreSchema })
  starScore?: STARScore;
  /**
   * ai点评
   */
  @Prop({ required: true })
  aiFeedback?: string;
  /**
   * 亮点
   */
  @Prop({ required: true, type: [String], default: [] })
  highlight?: string[];
  /**
   * 需要改进的点
   */
  @Prop({ required: true, type: [String], default: [] })
  improvement?: string[];
  /**
   * 问题生成时间
   */
  @Prop()
  createdAt?: Date;
  /**
   * 回答时间
   */
  @Prop()
  answeredAt?: Date;
  /**
   * 保存时间
   */
  @Prop()
  savedAt?: Date;
}
export const InterviewQuestionAnswerSchema = SchemaFactory.createForClass(
  InterviewQuestionAnswer,
);

/**
 * 雷达图维度数据
 */
@Schema({
  _id: false,
})
export class RadarChartData {
  /**
   * 维度名称
   */
  @Prop({ required: true })
  name: string;
  /**
   * 维度值
   */
  @Prop({ required: true, type: Number, min: 0, max: 100 })
  value: number;
  /**
   * 描述
   */
  @Prop({ required: true })
  description: string;
}
export const RadarChartDataSchema =
  SchemaFactory.createForClass(RadarChartData);

/**
 * 改进建议
 */
@Schema({
  _id: false,
})
export class ImprovementSuggestion {
  /**
   * 类别
   */
  @Prop({ required: true })
  category: string;
  /**
   * 具体建议
   */
  @Prop({ required: true })
  suggestion: string;
  /**
   * 优先级
   */
  @Prop({ enum: ['low', 'medium', 'high'], default: 'medium' })
  priority: string;
}
export const ImprovementSuggestionSchema = SchemaFactory.createForClass(
  ImprovementSuggestion,
);

@Schema({
  timestamps: true,
})
export class AIInterviewResult {
  @Prop({ required: true, unique: true })
  resultId: string;
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;
  @Prop({ required: true })
  userId: string;
  /**
   * 面试类型
   */
  @Prop({ required: true, enum: AIInterviewType })
  interviewType: AIInterviewType;

  /**
   * 公司
   */
  @Prop()
  company?: string;
  /**
   * 目的岗位
   */
  @Prop()
  position?: string;
  /**
   * 薪资范围,例如20k-30k
   */
  @Prop()
  salaryRange?: string;
  /**
   * 职位描述
   */
  @Prop()
  jdDescription?: string;
  /**
   * 面试时长
   */
  @Prop()
  interviewDuration?: number;

  /**
   * 面试内容
   */
  @Prop({ required: true, type: [InterviewQuestionAnswerSchema] })
  interviewContent?: InterviewQuestionAnswer[];
  /**
   * 问题数量
   */
  @Prop()
  totalQuestions?: number;
  /**
   * 已回答数量
   */
  @Prop()
  answeredQuestions?: number;
  /**
   * 综合评分
   */
  @Prop({ type: Number, min: 0, max: 100 })
  overallScore?: number;
  /**
   * 综合水平(优秀/良好/中等/需提升)
   */
  @Prop()
  overallLevel?: string;
  /**
   * 雷达图数据
   */
  @Prop({ type: [RadarChartDataSchema], default: [] })
  radarChartData?: RadarChartData[];
  /**
   * 改进建议
   */
  @Prop({ type: [ImprovementSuggestionSchema], default: [] })
  improvementSuggestions?: ImprovementSuggestion[];
  /**
   * 优秀表现
   */
  @Prop({ type: [String], default: [] })
  excellentPerformance?: string[];
  /**
   * 薄弱环节
   */
  @Prop({ type: [String], default: [] })
  weakAreas?: string[];

  /**
   * 平均回答时长
   */
  @Prop()
  averageAnswerDuration?: number;
  /**
   * 最长回答时长
   */
  @Prop()
  longestAnswerDuration?: number;
  /**
   * 最短回答时长
   */
  @Prop()
  shortestAnswerDuration?: number;
  /**
   * 表达流畅度(0-100)
   */
  @Prop()
  expressiveness?: number;
  /**
   * 逻辑性
   */
  @Prop()
  logicality?: number;
  /**
   * 专业性
   */
  @Prop()
  professionalism?: number;

  /**
   * 用户查看次数
   */
  @Prop()
  viewCount?: number;
  /**
   * 最后查看时间
   */
  @Prop()
  lastViewedAt?: Date;
  /**
   * 用户评分
   */
  @Prop({ type: Number, min: 1, max: 5 })
  userRating?: number;
  /**
   * 用户反馈
   */
  @Prop()
  userFeedback?: string;
  /**
   * 评分时间
   */
  @Prop()
  ratingAt?: Date;

  @Prop({
    required: true,
    enum: ['in_progress', 'paused', 'completed', 'abandoned'],
    default: 'in_progress',
    index: true,
  })
  status: string;
  /**
   * 暂停时间
   */
  @Prop()
  pausedAt?: Date;
  /**
   * 恢复时间
   */
  @Prop()
  resumedAt?: Date;
  /**
   * 完成时间
   */
  @Prop()
  completedAt?: Date;
  /**
   * 会话状态 Mixed的功能: 存储会话过程中的状态信息，如暂停时间、恢复时间、完成时间等
   */
  @Prop({ type: SchemaTypes.Mixed })
  sessionStatus?: any;
  /**
   * 评估报告生成状态
   */
  @Prop({
    required: true,
    enum: ['pending', 'generated', 'completed', 'failed'],
    default: 'pending',
  })
  evaluationStatus: string;
  /**
   * 评估报告生成时间
   */
  @Prop()
  evaluationGeneratedAt?: Date;
  /**
   * 报告生成失败原因
   */
  @Prop()
  evaluationFailedReason?: string;
  /**
   * 是否归档
   */
  @Prop({ default: false })
  isArchived?: boolean;
  /**
   * 是否分享
   */
  @Prop({ default: false })
  isShared?: boolean;
  /**
   * 分享链接
   */
  @Prop()
  shareLink?: string;
  /**
   * 关联消费记录
   */
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'ConsumptionRecord',
  })
  consumptionRecord?: Types.ObjectId;
  @Prop()
  aiModel?: string;
}

export const AIInterviewResultSchema =
  SchemaFactory.createForClass(AIInterviewResult);
