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
import { ResumeQuizDto } from './dto/resume.dto';

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
    const { resumeContent, position } = dto;
    const result = await this.interviewService.analyzeResumeAndGenerateReport(
      req.user.userId,
      position,
      resumeContent,
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

  /**
   * 简历押题接口
   */
  @Post('/resume/quiz/stream')
  async resumeQuizStream(
    @Body()
    dto: ResumeQuizDto,
    @Request() req,
    @Res() res,
  ) {
    const userId = req.user.userId;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    const subject = this.interviewService
      .generateResumeQuizWithProgress(userId, dto)
      .subscribe({
        next(event) {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        },
        error(err) {
          res.write(
            `data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`,
          );
        },
        complete() {
          res.end();
        },
      });
    //客户端主动关闭连接时，取消订阅
    res.on('close', () => {
      subject.unsubscribe();
    });
    return subject;
  }
}
