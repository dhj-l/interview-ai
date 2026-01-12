import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

/**
 * 面试难度枚举
 */
export enum InterviewDifficultyEnum {
  /**
   * 简单
   */
  EASY = 'easy',
  /**
   * 中等
   */
  MEDIUM = 'medium',
  /**
   * 困难
   */
  HARD = 'hard',
}

/**
 * 面试问题类别
 */
export enum InterviewQuestionCategoryEnum {
  /**
   * 技术问题
   */
  TECHNICAL = 'technical',
  /**
   * 项目问题
   */
  PROJECT = 'project',

  /**
   * 问题解决
   */
  PROBLEM_SOLVING = 'problem-solving',
  /**
   * 软技能
   */
  SOFT_SKILL = 'soft-skill',
  /**
   * 场景问题
   */
  SCENARIO = 'scenario',
  /**
   * 行为
   */
  BEHAVIORAL = 'behavioral',
}
/**
 * 单个面试问题
 */
@Schema({
  _id: false,
})
export class InterviewQuestion {
  /**
   * 问题内容
   */
  @Prop({ required: true })
  question: string;
  /**
   * 参考答案
   */
  @Prop({ required: true })
  answer: string;
  /**
   * 问题类别
   */
  @Prop({ required: true, enum: InterviewQuestionCategoryEnum })
  category: InterviewQuestionCategoryEnum;
  /**
   * 问题难度
   */
  @Prop({ required: true, enum: InterviewDifficultyEnum })
  difficulty: InterviewDifficultyEnum;
  /**
   * 回答提示
   */
  @Prop()
  tip?: string;
  /**
   * 关键词
   */
  @Prop({ type: [String], default: [] })
  keywords?: string[];
  /**
   * 出题理由
   */
  @Prop()
  reasoning?: string;
  /**
   * 是否收藏
   */
  @Prop({ default: false })
  isFavorite?: boolean;
  /**
   * 是否已练习
   */
  @Prop({ default: false })
  isPracticed?: boolean;
  /**
   * 练习时间
   */
  @Prop({ type: Date })
  practicedAt?: Date;
  /**
   * 用户笔记
   */
  @Prop()
  userNote?: string;
}

export const InterviewQuestionSchema =
  SchemaFactory.createForClass(InterviewQuestion);

/**
 * 技能匹配项
 */
@Schema({
  _id: false,
})
export class SkillMatch {
  /**
   * 技能名称
   */
  @Prop({ required: true })
  skill: string;
  /**
   * 是否匹配
   */
  @Prop({ required: true, type: Boolean, default: false })
  matched: boolean;
  /**
   * 熟练度描述
   */
  @Prop()
  proficiency?: string;
}

export const SkillMatchSchema = SchemaFactory.createForClass(SkillMatch);

/**
 * 学习优先级
 */
@Schema({
  _id: false,
})
export class LearningPriority {
  /**
   * 主题
   */
  @Prop({ required: true })
  topic: string;
  /**
   * 优先级
   */
  @Prop({ required: true, enum: ['high', 'medium', 'low'] })
  priority: string;
  /**
   * 原因
   */
  @Prop({ required: true })
  reason: string;
}
export const LearningPrioritySchema =
  SchemaFactory.createForClass(LearningPriority);

/**
 * 雷达图
 */
@Schema({
  _id: false,
})
export class RadarChart {
  /**
   * 维度
   */
  @Prop({ required: true })
  dimension: string;
  /**
   * 评分
   */
  @Prop({ required: true })
  score: number;
  /**
   * 描述
   */
  @Prop()
  description?: string;
}

export const RadarChartSchema = SchemaFactory.createForClass(RadarChart);

/**
 * 简历押题结果
 */
@Schema({
  timestamps: true,
})
export class ResumeQuizResult {
  @Prop({ required: true, unique: true })
  requestId: string;
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;
  /**
   * 用户ID
   */
  @Prop({ required: true })
  userId: string;
  /**
   * 相关简历ID
   */
  @Prop()
  resumeId?: string;
  /**
   * 公司名称
   */
  @Prop({ required: true })
  company: string;
  /**
   * 岗位名称
   */
  @Prop({ required: true })
  position: string;
  /**
   * 薪资范围,例如20k-30k
   */
  @Prop({ required: true })
  salaryRange: string;
  /**
   * 职位描述(jd)
   */
  @Prop({ required: true })
  jobDescription: string;
  /**
   * 简历快照(脱敏后的文字)
   */
  @Prop({ required: true })
  resumeSnapshot: string;
  /**
   * 面试问题列表
   */
  @Prop({ type: [InterviewQuestionSchema], default: [] })
  questions?: InterviewQuestion[];
  /**
   * 问题总数
   */
  @Prop({ required: true })
  totalQuestions: number;
  /**
   * 总结
   */
  @Prop({ required: true })
  summary: string;

  /**
   * 岗位匹配度分数
   */
  @Prop({ min: 0, max: 100 })
  matchScore?: number;
  /**
   * 匹配等级 （优秀/良好/中等/较差）
   */
  @Prop()
  matchLevel: string;
  /**
   * 匹配技能
   */
  @Prop({ type: [SkillMatchSchema], default: [] })
  skillMatches?: SkillMatch[];

  /**
   * 缺失的技能
   */
  @Prop({ type: [String], default: [] })
  missingSkills?: string[];
  /**
   * 需要补充的知识点
   */
  @Prop({ type: [String], default: [] })
  knowledgeGaps?: string[];
  /**
   * 学习优先级建议
   */
  @Prop({ type: [LearningPrioritySchema], default: [] })
  learningPriorities?: LearningPriority[];
  /**
   * 雷达图维度数据
   */
  @Prop({ type: [RadarChartSchema], default: [] })
  radarChart?: RadarChart[];
  /**
   * 优势
   */
  @Prop({ type: [String], default: [] })
  strengths?: string[];
  /**
   * 薄弱环节
   */
  @Prop({ type: [String], default: [] })
  weaknesses?: string[];
  /**
   * 面试准备建议
   */
  @Prop({ type: [String], default: [] })
  interviewTips?: string[];
  /**
   * 问题类别分布
   */
  @Prop({ type: SchemaTypes.Mixed })
  questionCategories?: Record<string, number>;

  /**
   *查看次数
   */
  @Prop({ default: 0 })
  viewCount?: number;
  /**
   * 最后查看时间
   */
  @Prop({ type: Date })
  lastViewedAt?: Date;
  /**
   * 用户评分 1-5星
   */
  @Prop({ min: 1, max: 5 })
  rating?: number;
  /**
   * 用户反馈
   */
  @Prop()
  feedback?: string;
  /**
   * 评分时间
   */
  @Prop({ type: Date })
  ratedAt?: Date;

  /**
   * 是否归档
   */
  @Prop({ default: false })
  isArchived?: boolean;
  /**
   * 归档时间
   */
  @Prop({ type: Date })
  archivedAt?: Date;
  /**
   * 是否分享
   */
  @Prop({ default: false })
  isShared?: boolean;
  /**
   * 分享时间
   */
  @Prop({ type: Date })
  sharedAt?: Date;
  /**
   * 分享链接
   */
  @Prop()
  shareUrl?: string;
  /**
   * 关联消费记录
   */
  @Prop({ type: String })
  consumptionRecordId?: string;
  /**
   * 元数据
   */
  @Prop({ type: SchemaTypes.Mixed })
  metadata?: Record<string, any>;
  /**
   * 使用的ai模型
   */
  @Prop({ type: String })
  aiModel?: string;
  /**
   * prompt版本
   */
  @Prop({ type: String })
  promptVersion?: string;
}

export const ResumeQuizResultSchema =
  SchemaFactory.createForClass(ResumeQuizResult);

export type ResumeQuizResultDocument = ResumeQuizResult & Document;
//创建索引
ResumeQuizResultSchema.index({ userId: 1, createdAt: -1 });
ResumeQuizResultSchema.index({ userId: 1, isArchived: 1 });
ResumeQuizResultSchema.index({ userId: 1, company: 1 });
