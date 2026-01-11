import { IsNotEmpty, IsString } from 'class-validator';

export class ContinueDto {
  /**
   * 会话ID
   */
  @IsNotEmpty({ message: '会话ID不能为空' })
  @IsString({ message: '会话ID必须是字符串' })
  sessionId: string;
  /**
   * 消息内容
   */
  @IsNotEmpty({ message: '消息内容不能为空' })
  @IsString({ message: '消息内容必须是字符串' })
  message: string;
}

export class AnalyzeResumeDto {
  /**
   * 简历内容
   */
  @IsNotEmpty({ message: '简历内容不能为空' })
  @IsString({ message: '简历内容必须是字符串' })
  resumeContent: string;
  /**
   * 岗位描述
   */
  @IsNotEmpty({ message: '岗位描述不能为空' })
  @IsString({ message: '岗位描述必须是字符串' })
  jobDescription: string;
  /**
   * 岗位名称
   */
  @IsNotEmpty({ message: '岗位名称不能为空' })
  @IsString({ message: '岗位名称必须是字符串' })
  position: string;
}
