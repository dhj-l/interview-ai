import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AIInterviewType } from '../schemas/ai-interview-result.schema';

export class MockInterviewDto {
  /**
   * 面试类型
   */
  @IsEnum(AIInterviewType)
  @IsNotEmpty({ message: '面试类型不能为空' })
  type: AIInterviewType;
  /**
   * 候选人姓名
   */
  @IsNotEmpty({ message: '候选人姓名不能为空' })
  candidateName: string;
  /**
   * 公司名称
   */
  @IsNotEmpty({ message: '公司名称不能为空' })
  @IsString()
  companyName: string;
  /**
   * 岗位名称
   */
  @IsNotEmpty({ message: '岗位名称不能为空' })
  @IsString()
  positionName: string;
  /**
   * 最低薪资
   */
  @IsNotEmpty({ message: '最低薪资不能为空' })
  @IsNumber({}, { message: '最低薪资必须是数字' })
  @Min(0, { message: '最低薪资必须大于等于0' })
  @Max(100000, { message: '最低薪资必须小于等于100000' })
  minSalary: number;
  /**
   * 最高薪资
   */
  @IsNotEmpty({ message: '最高薪资不能为空' })
  @IsNumber({}, { message: '最高薪资必须是数字' })
  @Min(0, { message: '最高薪资必须大于等于0' })
  @Max(100000, { message: '最高薪资必须小于等于100000' })
  maxSalary: number;
  /**
   * 岗位描述
   */
  @IsNotEmpty({ message: '岗位描述不能为空' })
  @IsString()
  jd: string;
  /**
   * 简历url
   */
  @IsNotEmpty({ message: '简历url不能为空' })
  @IsString()
  resumeUrl: string;
  /**
   * 简历内容
   */
  @IsNotEmpty({ message: '简历内容不能为空' })
  @IsString()
  resumeContent: string;
}
/**
 * 候选人回答dto
 */
export class AnswerMockInterviewDto {
  /**
   * 面试会话id
   */
  @IsNotEmpty({ message: '面试会话id不能为空' })
  @IsString()
  sessionId: string;
  /**
   * 回答内容
   */
  @IsNotEmpty({ message: '回答内容不能为空' })
  @IsString()
  answer: string;
}
/**
 * 模拟面试事件类型
 */
export enum MockInterviewEventType {
  /**
   * 面试开始
   */
  START = 'start',
  /**
   * 面试官提问
   */
  QUESTION = 'question',
  /**
   * 等待候选人回答
   */
  WAITING = 'waiting',
  /**
   * 参考答案
   */
  REFERENCE = 'reference',
  /**
   * ai思考中
   */
  THINKING = 'thinking',
  /**
   * 面试结束
   */
  END = 'end',
  /**
   * 发生错误
   */
  ERROR = 'error',
}

/**
 * 模拟面试SSE事件DTO
 */
export class MockInterviewSseDto {
  /**
   * 事件类型
   */
  @IsEnum(MockInterviewEventType)
  @IsNotEmpty({ message: '事件类型不能为空' })
  type: MockInterviewEventType;
  /**
   * 会话id
   */
  @IsNotEmpty({ message: '会话id不能为空' })
  @IsString()
  sessionId: string;
  /**
   * 面试官姓名
   */
  @IsNotEmpty({ message: '面试官姓名不能为空' })
  @IsString()
  interviewerName: string;
  /**
   * 内容
   */
  @IsNotEmpty({ message: '内容不能为空' })
  @IsString()
  content: string;
  /**
   * 当前问题序号
   */
  @IsNotEmpty({ message: '当前问题序号不能为空' })
  @IsNumber({}, { message: '当前问题序号必须是数字' })
  @Min(0, { message: '当前问题序号必须大于等于0' })
  questionIndex: number;
  /**
   * 问题总数
   */
  @IsNotEmpty({ message: '问题总数不能为空' })
  @IsNumber({}, { message: '问题总数必须是数字' })
  @Min(0, { message: '问题总数必须大于等于0' })
  totalQuestions: number;
  /**
   * 已用时间
   */
  @IsNotEmpty({ message: '已用时间不能为空' })
  @IsNumber({}, { message: '已用时间必须是数字' })
  @Min(0, { message: '已用时间必须大于等于0' })
  usedTime: number;
  /**
   * 错误信息
   */
  @IsString()
  @IsOptional()
  errorMessage?: string;
  /**
   * 结果Id
   */
  @IsNotEmpty({ message: '结果Id不能为空' })
  @IsString()
  resultId: string;
  /**
   * 是否流式传输
   */
  @IsNotEmpty({ message: '是否流式传输不能为空' })
  @IsBoolean()
  isStreaming: boolean;
}
