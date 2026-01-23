import { Module } from '@nestjs/common';
import { InterviewController } from './interview.controller';
import { InterviewService } from './services/interview.service';
import { InterviewAIService } from './services/interview-ai.service';
import { DocumentParserService } from './services/document-parser.service';
import { AIModule } from 'src/ai/ai.moudule';
import { ResumeAnalysisService } from './services/resume-analysis.service';
import { ConversationContinuationService } from './services/conversation-continuation.service';
import {
  ConsumptionRecord,
  ConsumptionRecordSchema,
} from './schemas/consumption-record.schema';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ResumeQuizResult,
  ResumeQuizResultSchema,
} from './schemas/interview-quit-result.schema';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import {
  AIInterviewResult,
  AIInterviewResultSchema,
} from './schemas/ai-interview-result.schema';

@Module({
  imports: [
    // ConfigModule,
    MongooseModule.forFeature([
      {
        name: ConsumptionRecord.name,
        schema: ConsumptionRecordSchema,
      },
      {
        name: ResumeQuizResult.name,
        schema: ResumeQuizResultSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: AIInterviewResult.name,
        schema: AIInterviewResultSchema,
      },
    ]),
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
