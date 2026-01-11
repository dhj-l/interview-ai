import { Module } from '@nestjs/common';
import { AIModelFactory } from './services/ai-model.factory';
import { SessionManagerService } from './services/session.manager.service';

@Module({
  providers: [AIModelFactory, SessionManagerService],
  exports: [AIModelFactory, SessionManagerService],
})
export class AIModule {}
