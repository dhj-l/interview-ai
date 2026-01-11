import {
  Controller,
  Post,
  UseGuards,
  Body,
  Request,
  Res,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InterviewAIService } from './services/interview-ai.service';
import { InterviewService } from './services/interview.service';
import { AnalyzeResumeDto, ContinueDto } from './dto/session.dto';

@Controller('interview')
@UseGuards(JwtAuthGuard)
export class InterviewController {
  constructor(
    private readonly interviewAiService: InterviewAIService,
    private readonly interviewService: InterviewService,
  ) {}
  /**
   * 开始分析简历
   */
  @Post('/analyze-resume')
  async analyzeResume(
    @Body()
    dto: AnalyzeResumeDto,
    @Request() req,
  ) {
    const { resumeContent, jobDescription, position } = dto;
    const result = await this.interviewService.analyzeResumeAndGenerateReport(
      req.user.userId,
      position,
      resumeContent,
      jobDescription,
    );
    return result;
  }
  /**
   * 继续对话
   */
  @Post('/continue')
  async continueConversation(
    @Body()
    dto: ContinueDto,
    @Request() req,
  ) {
    const { sessionId, message } = dto;
    const result = await this.interviewService.continueConversation(
      sessionId,
      message,
    );
    return result;
  }
}
