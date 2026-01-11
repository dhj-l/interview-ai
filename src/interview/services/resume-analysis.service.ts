import { Injectable, Logger } from '@nestjs/common';
import { AIModelFactory } from 'src/ai/services/ai-model.factory';
import { PromptTemplate } from '@langchain/core/prompts';
import { RESUME_QUIZ_PROMPT } from '../prompts/resume_quiz.prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
@Injectable()
export class ResumeAnalysisService {
  /**
   * 分析简历(通用功能代码)
   *
   */
  private readonly logger = new Logger(ResumeAnalysisService.name);
  constructor(private readonly aiModelFactory: AIModelFactory) {}
  /**
   * 分析简历
   * @param resume 简历内容
   * @param jobDescription 岗位描述
   * @returns 分析结果
   */
  async analyzeResume(resume: string, jobDescription: string) {
    // 初始化模型
    const model = this.aiModelFactory.createDefaultModel();
    // 初始化提示模板
    const prompt = PromptTemplate.fromTemplate(RESUME_QUIZ_PROMPT);
    // 初始化输出解析器
    const parser = new JsonOutputParser();
    // 初始化链
    const chain = prompt.pipe(model).pipe(parser);
    try {
      this.logger.log('开始分析简历');
      // 调用链分析简历
      const result = await chain.invoke({
        resume_content: resume,
        job_description: jobDescription,
      });
      this.logger.log('分析简历成功');
      return result;
    } catch (error) {
      this.logger.error('分析简历失败', error);
      throw error;
    }
  }
}
