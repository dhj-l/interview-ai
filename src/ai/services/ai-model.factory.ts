import { ChatDeepSeek } from '@langchain/deepseek';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateAIDto } from '../dto/create.dto';
/**
 * AI模型工厂(通用功能代码)
 */
@Injectable()
export class AIModelFactory {
  private readonly logger = new Logger(AIModelFactory.name);
  constructor(private readonly configService: ConfigService) {}
  /**
   * 创建默认ai模型
   * @param aiDto 创建ai模型参数
   * @returns 模型实例
   */
  createDefaultModel(aiDto: CreateAIDto = {}) {
    const { modelType, temperature, maxTokens, timeout } = aiDto;
    // 初始化模型逻辑
    const apiKey = this.configService.get('DEEPSEEK_API_KEY');

    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY 未配置');
    }
    // 初始化模型
    const envTemperature = this.configService.get<string>(
      'DEEPSEEK_TEMPERATURE',
    );
    const resolvedTemperature =
      typeof temperature === 'number'
        ? temperature
        : envTemperature !== undefined
          ? Number(envTemperature)
          : undefined;

    const model = new ChatDeepSeek({
      apiKey,
      model:
        modelType ||
        this.configService.get('DEEPSEEK_MODEL') ||
        'deepseek-chat',
      temperature: resolvedTemperature ?? 0.7,
      maxTokens: maxTokens ?? 4000,
      timeout: timeout ?? 60000,
    });
    return model;
  }

  /**
   * 创建稳定类型ai
   */
  createStableModel() {
    return this.createDefaultModel({
      temperature: 0.3,
    });
  }
  /**
   * 创建活泼类型ai
   */
  createCreativeModel() {
    return this.createDefaultModel({
      temperature: 0.8,
    });
  }
}
