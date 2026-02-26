import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIModelFactory } from 'src/ai/services/ai-model.factory';
import { ConversationHistory, InterviewQuestionContext } from '../type';
import { buildMockInterviewPrompt } from '../prompts/mock.interview.prompt';
import { PromptTemplate } from '@langchain/core/prompts';

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

  async *generateInterviewQuestionStream(content: InterviewQuestionContext) {
    const {
      type,
      elapsedMinutes,
      targetDuration,
      resumeContent,
      company,
      positionName,
      jd,
      conversationHistory,
    } = content;
    let fullContent = '';
    const prompt = buildMockInterviewPrompt({
      interviewType: type,
      elapsedMinutes,
      targetDuration,
    });
    const promptTemplate = PromptTemplate.fromTemplate(prompt);
    const model = this.aiModelFactory.createDefaultModel();
    const chain = promptTemplate.pipe(model);
    const stream = await chain.stream({
      interviewType: type,
      elapsedMinutes,
      targetDuration,
      resumeContent,
      company,
      positionName,
      jd,
      conversationHistory: this.formatConversationHistory(conversationHistory),
    });
    for await (const chunk of stream) {
      this.logger.log(chunk, 'generateInterviewQuestionStream');
      fullContent += chunk.content;
      yield chunk.content;
    }
    this.logger.log(fullContent, 'generateInterviewQuestionStream fullContent');
    return this.parseInterviewQuestion(fullContent, {
      elapsedMinutes,
      targetDuration,
    });
  }

  formatConversationHistory(history?: ConversationHistory[]) {
    if (!history || history.length === 0) {
      return '(对话刚开始,这是候选人的自我介绍)';
    }
    return history
      .map((item, index) => {
        return `${index + 1}. ${item.role === 'interviewer' ? '面试官' : '候选人'}: ${item.content}`;
      })
      .join('\n\n');
  }

  parseInterviewQuestion(
    content: string,
    context: {
      elapsedMinutes: number;
      targetDuration: number;
    },
  ) {
    //如果包含了[END_INTERVIEW]，则认为面试结束
    const shouldEnd = content.includes('[END_INTERVIEW]');
    //截取[STANDARD_ANSWER]与[END_STANDARD_ANSWER]之间的内容
    const standardAnswer = content.match(
      /\[STANDARD_ANSWER\](.*?)\[END_STANDARD_ANSWER\]/s,
    );
    //标准答案
    let standardAnswerContent = '';
    //问题
    let questionContent = '';
    if (standardAnswer) {
      standardAnswerContent = standardAnswer[1].trim();
      questionContent = content.split('[STANDARD_ANSWER]')[0].trim();
    }
    return {
      question: questionContent,
      shouldEnd,
      standardAnswer: standardAnswerContent,
      reasoning: shouldEnd
        ? `面试已达到目标时长（${context.elapsedMinutes}/${context.targetDuration}分钟）`
        : '',
    };
  }
  /**
   * 开场白生成
   * @param candidateName 候选人姓名
   * @param interviewName 面试官名称
   * @param positionName 岗位名称
   */
  async generateOpeningQuestionStream({
    candidateName,
    interviewName,
    positionName,
  }) {
    let fullContent = '';
    fullContent += `${candidateName ? candidateName : '候选人'}, 你好。`;
    fullContent += '我是你今天的面试官,';
    fullContent += `${interviewName} 老师 \n\n`;
    if (positionName) {
      fullContent += `我看你申请的是${positionName}岗位 \n\n`;
    }
    fullContent +=
      `让我们开始今天的面试吧。\n\n` +
      '首先，请你简单介绍一下自己。自我介绍可以说明你的学历以及专业背景、工作经历以及取得的成绩等。';

    return fullContent;
  }
}
