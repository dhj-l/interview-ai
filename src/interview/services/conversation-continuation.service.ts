import { PromptTemplate } from '@langchain/core/prompts';
import { Injectable, Logger } from '@nestjs/common';
import { Message } from 'src/ai/interface/message.interface';
import { AIModelFactory } from 'src/ai/services/ai-model.factory';
import { SessionManagerService } from 'src/ai/services/session.manager.service';
import { CONVERSATION_CONTINUATION_PROMPT } from '../prompts/resume_quiz.prompts';

/**
 * 对话继续服务(通用功能代码)
 */
@Injectable()
export class ConversationContinuationService {
  private readonly logger = new Logger(ConversationContinuationService.name);
  constructor(
    private readonly sessionManagerService: SessionManagerService,
    private readonly aiModelFactory: AIModelFactory,
  ) {}
  /**
   * 继续对话
   * @param history 对话历史
   * @returns 继续后的对话
   */
  async continueConversation(history: Message[]) {
    const prompt = PromptTemplate.fromTemplate(
      CONVERSATION_CONTINUATION_PROMPT,
    );
    const model = this.aiModelFactory.createDefaultModel();
    const chain = prompt.pipe(model);
    try {
      const result = await chain.invoke({
        history: history
          .map((item) => `${item.role}: ${item.content}`)
          .join('\n\n'),
      });
      this.logger.log('对话继续结果', result);
      return result.content;
    } catch (error) {
      this.logger.error('对话继续失败', error);
      return null;
    }
  }
}
