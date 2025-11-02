export interface AIAnalysis {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  speakerInsights?: Record<string, {
    role?: string;
    mainTopics?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
  }>;
}

