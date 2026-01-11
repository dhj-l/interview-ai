import { Module } from '@nestjs/common';
import { AIModelFactory } from './services/ai-model.factory';

@Module({
  providers: [AIModelFactory],
  exports: [AIModelFactory],
})
export class AIModule {}
