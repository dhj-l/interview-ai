import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIModelFactory } from 'src/ai/services/ai-model.factory';
import { PromptTemplate } from '@langchain/core/prompts';
import { RESUME_QUIZ_PROMPT } from '../prompts/resume_quiz.prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
/**
 * 面试服务
 */
@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly aiModelFactory: AIModelFactory,
  ) {}
  /**
   * 分析简历并生成报告
   * @param resumeContent 简历内容
   * @param jobDescription 岗位要求
   * @returns 分析报告
   */
  async analyzeResumeAndGenerateReport(
    resumeContent: string,
    jobDescription: string,
  ) {
    const model = this.aiModelFactory.createCreativeModel();
    const prompt = PromptTemplate.fromTemplate(RESUME_QUIZ_PROMPT);
    //创建解析器
    const parser = new JsonOutputParser();
    //创建链
    const chain = prompt.pipe(model).pipe(parser);
    try {
      this.logger.log('分析简历并生成报告');
      const result = await chain.invoke({
        resume_content: resumeContent,
        job_description: jobDescription,
      });
      this.logger.log('分析简历并生成报告成功', result);
      return result;
    } catch (error) {
      this.logger.error('分析简历并生成报告失败', error);
      throw error;
    }
  }
}
