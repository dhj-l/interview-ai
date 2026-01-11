import { Module } from '@nestjs/common';
import { InterviewController } from './interview.controller';
import { InterviewService } from './services/interview.service';
import { InterviewAIService } from './services/interview-ai.service';
import { DocumentParserService } from './services/document-parser.service';
import { ConfigModule } from '@nestjs/config';
import { AIModule } from 'src/ai/ai.moudule';
import { ResumeAnalysisService } from './services/resume-analysis.service';
import { ConversationContinuationService } from './services/conversation-continuation.service';

@Module({
  imports: [
    // ConfigModule,
    // MongooseModule.forFeature([...]),
    AIModule,
  ],
  controllers: [InterviewController],
  providers: [
    InterviewService,
    InterviewAIService,
    DocumentParserService,
    ResumeAnalysisService,
    ConversationContinuationService,
  ],
  exports: [
    InterviewService,
    InterviewAIService,
    DocumentParserService,
    ResumeAnalysisService,
    ConversationContinuationService,
  ],
})
export class InterviewModule {}
