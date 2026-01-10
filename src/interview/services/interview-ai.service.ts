import { ChatDeepSeek } from '@langchain/deepseek';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 面试 AI 服务
 * 封装 LangChain + DeepSeek 的调用
 */
@Injectable()
export class InterviewAIService {
  private readonly logger = new Logger(InterviewAIService.name);
  constructor(private readonly configService: ConfigService) {
    this.configService = configService;
  }
  /**
   * 初始化模型方法
   */
  private initModel(temperature: number) {
    // 初始化模型逻辑
    const apiKey = this.configService.get('DEEPSEEK_API_KEY');
    // const maxTokens = this.configService.get('MAX_TOKENS') || 4000;
    const modelName =
      this.configService.get('DEEPSEEK_MODEL') || 'deepseek-chat';
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY 未配置');
    }
    // 初始化模型
    const model = new ChatDeepSeek({
      apiKey,
      model: modelName,
      temperature,
      maxTokens: 4000,
    });
    return model;
  }

  /**
   * 开启聊天
   */
  async startChat() {
    const model = this.initModel(0.7);
    const stream = await model.stream('你好');
    for await (const chunk of stream) {
      this.logger.log(chunk);
    }
  }
}
