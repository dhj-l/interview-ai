export interface ProgressEvent {
  type: 'progress' | 'complete' | 'error' | 'timeout';
  step?: number;
  label?: string;
  progress: number; // 0-100
  message?: string;
  data?: any;
  error?: string;
  stage?: 'prepare' | 'generating' | 'saving' | 'done'; // 当前阶段
}
export type ConversationHistory = {
  role: 'interviewer' | 'candidate';
  content: string;
};

export interface InterviewQuestionContext {
  type: 'special' | 'comprehensive';
  resumeContent: string;
  company?: string;
  positionName?: string;
  jd?: string;
  conversationHistory?: ConversationHistory[];
  elapsedMinutes: number;
  targetDuration: number;
}

export const progressMessage = [
  {
    progress: 0.05,
    message: '🤖 AI正在深度理解你的内容,请稍等...',
  },
  {
    progress: 0.1,
    message: '📊 AI正在分析你的技术栈和项目经验,请稍等...',
  },
  {
    progress: 0.15,
    message: '🔍 AI正在识别你的核心竞争力,请稍等...',
  },
  {
    progress: 0.2,
    message: '📋 AI正在对比岗位要求与您的背景,请稍等...',
  },

  {
    progress: 0.25,
    message: '💡 AI 正在设计针对性的技术问题,请稍等...',
  },
  {
    progress: 0.3,
    message: '🎯 AI 正在挖掘您简历中的项目亮点,请稍等...',
  },
  {
    progress: 0.35,
    message: '🧠 AI 正在构思场景化的面试问题,请稍等...',
  },
  {
    progress: 0.4,
    message: '⚡ AI 正在设计不同难度的问题组合,请稍等...',
  },
  {
    progress: 0.45,
    message: '🔬 AI 正在分析您的技术深度和广度,请稍等...',
  },
  {
    progress: 0.5,
    message: '📝 AI 正在生成基于 STAR 法则的答案,请稍等...',
  },
  {
    progress: 0.55,
    message: '✨ AI 正在优化问题的表达方式,请稍等...',
  },
  {
    progress: 0.6,
    message: '🎨 AI 正在为您准备回答要点和技巧,请稍等...',
  },
  {
    progress: 0.65,
    message: '💎 AI 正在提炼您的项目成果和亮点,请稍等...',
  },
  {
    progress: 0.7,
    message: '🔧 AI 正在调整问题难度分布,请稍等...',
  },
  {
    progress: 0.75,
    message: '📚 AI 正在补充技术关键词和考察点  ,请稍等...',
  },
  {
    progress: 0.8,
    message: '🎓 AI 正在完善综合评估建议,请稍等...',
  },
  {
    progress: 0.85,
    message: '🚀 AI 正在做最后的质量检查,请稍等...',
  },
  {
    progress: 0.9,
    message: '✅ AI 即将完成问题生成...',
  },
];
