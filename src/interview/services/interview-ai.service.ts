import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIModelFactory } from 'src/ai/services/ai-model.factory';

/**
 * 面试 AI 服务
 * 封装 LangChain + DeepSeek 的调用
 */
@Injectable()
export class InterviewAIService {
  private readonly logger = new Logger(InterviewAIService.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly aiModelFactory: AIModelFactory,
  ) {}

  /**
   * 开启聊天
   */
  async startChat() {
    const model = this.aiModelFactory.createCreativeModel();
    const stream = await model.stream('你好');
    for await (const chunk of stream) {
      this.logger.log(chunk);
    }
  }
}
