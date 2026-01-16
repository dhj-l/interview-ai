import { Injectable, Logger } from '@nestjs/common';
import { AIModelFactory } from 'src/ai/services/ai-model.factory';
import { PromptTemplate } from '@langchain/core/prompts';
import {
  RESUME_QUIZ_PROMPT,
  RESUME_QUIZ_PROMPT_ANALYSIS_ONLY,
  RESUME_QUIZ_PROMPT_QUESTION_ONLY,
} from '../prompts/resume_quiz.prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { ResumeQuizDto } from '../dto/resume.dto';
import { DocumentParserService } from './document-parser.service';
import {
  FORMAT_INSTRUCTIONS_ANALYSIS_ONLY,
  FORMAT_INSTRUCTIONS_QUESTIONS_ONLY,
} from '../prompts/format.prompt';
@Injectable()
export class ResumeAnalysisService {
  /**
   * 分析简历(通用功能代码)
   *
   */
  private readonly logger = new Logger(ResumeAnalysisService.name);
  constructor(
    private readonly aiModelFactory: AIModelFactory,
    private readonly documentParserService: DocumentParserService,
  ) {}
  /**
   * 分析简历
   * @param resume 简历内容
   * @returns 分析结果
   */
  async analyzeResume(resume: string) {
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
        resumeText: resume,
      });
      this.logger.log('分析简历成功');
      return result;
    } catch (error) {
      this.logger.error('分析简历失败', error);
      throw error;
    }
  }

  /**
   * 简历押题
   */
  async resumeQuiz(dto: ResumeQuizDto) {
    const {
      resumeContent = '',
      jd,
      minSalary,
      maxSalary,
      position,
      company,
    } = dto;

    const prompt = PromptTemplate.fromTemplate(
      RESUME_QUIZ_PROMPT_QUESTION_ONLY,
    );
    const parser = new JsonOutputParser();
    const model = this.aiModelFactory.createDefaultModel();
    const chain = prompt.pipe(model).pipe(parser);
    try {
      this.logger.log('开始押题');
      // 调用链押题
      const result = await chain.invoke({
        company,
        positionName: position,
        jd,
        salaryRange: `${minSalary}-${maxSalary}`,
        resumecontent: resumeContent,
        format_instructions: FORMAT_INSTRUCTIONS_QUESTIONS_ONLY,
      });
      this.logger.log('押题成功', result.questions);
      return result;
    } catch (error) {
      this.logger.error('押题失败', error);
      throw error;
    }
  }

  /**
   * 分析匹配度
   */
  async analyzeMatchScore(dto: ResumeQuizDto) {
    const {
      company,
      position,
      jd,
      minSalary,
      maxSalary,
      resumeContent = '',
    } = dto;
    const prompt = PromptTemplate.fromTemplate(
      RESUME_QUIZ_PROMPT_ANALYSIS_ONLY,
    );
    const parser = new JsonOutputParser();
    const model = this.aiModelFactory.createDefaultModel();
    const chain = prompt.pipe(model).pipe(parser);
    try {
      this.logger.log('开始分析匹配度');
      // 调用链分析匹配度
      const result = await chain.invoke({
        company,
        positionName: position,
        jd,
        salaryRange: `${minSalary}-${maxSalary}`,
        resumecontent: resumeContent,
        format_instructions: FORMAT_INSTRUCTIONS_ANALYSIS_ONLY,
      });
      this.logger.log('分析匹配度成功');
      return result;
    } catch (error) {
      this.logger.error('分析匹配度失败', error);
      throw error;
    }
  }
}
