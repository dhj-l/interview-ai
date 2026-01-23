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
import { DocumentParserService } from './services/document-parser.service';
import { MockInterviewDto } from './dto/mock.dto';

@Controller('interview')
@UseGuards(JwtAuthGuard)
export class InterviewController {
  constructor(
    private readonly interviewAiService: InterviewAIService,
    private readonly interviewService: InterviewService,
    private readonly documentParserService: DocumentParserService,
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

    const subscription = this.interviewService
      .generateResumeQuizWithProgress(userId, dto)
      .subscribe({
        next(event) {
          if (res.writable) {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
          }
        },
        error(err) {
          if (res.writable) {
            res.write(
              `data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`,
            );
            res.end();
          }
        },
        complete() {
          if (res.writable) {
            res.end();
          }
        },
      });

    //客户端主动关闭连接时，取消订阅
    res.on('close', () => {
      subscription.unsubscribe();
    });

    // SSE接口不需要返回值，连接由res.write()和res.end()管理
  }
  /**
   * 开始模拟面试
   */
  @Post('/mockInterview')
  async mockInterview(
    @Body() data: MockInterviewDto,
    @Request() req,
    @Res() res,
  ) {
    const userId = req.user.userId;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    const subject = await this.interviewService.startMockInterview(
      data,
      userId,
    );
    res.write(`data: connected\n\n`);
    subject.subscribe({
      next(event) {
        //TODO
      },
      error(err) {
        res.write(
          `data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`,
        );
        res.end();
      },
      complete() {
        res.end();
      },
    });
  }
}
