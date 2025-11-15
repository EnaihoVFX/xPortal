import { BaseAgent } from './baseAgent.js'

/**
 * Sentiment-focused agent that specializes in analyzing social sentiment and public opinion
 */
export class SentimentAgent extends BaseAgent {
  constructor(name, geminiApiKey) {
    super(name, 'Sentiment & Opinion Analyst', geminiApiKey)
  }

  buildAnalysisPrompt(informationSources, marketContext) {
    const sentimentData = informationSources
      .filter(source => source.type === 'sentiment' || source.type === 'social')
      .map((source, idx) => {
        return `Sentiment Source ${idx + 1}:
Platform: ${source.platform || 'Unknown'}
Sentiment Score: ${source.sentimentScore || 'N/A'}
Positive: ${source.positive || 0}%
Negative: ${source.negative || 0}%
Neutral: ${source.neutral || 0}%
Sample Comments: ${source.sampleComments || 'N/A'}
Volume: ${source.volume || 'N/A'}
`
      })
      .join('\n\n')

    return `
You are a specialized sentiment and public opinion analyst agent for prediction markets.

Your role is to analyze public sentiment, social media trends, and crowd opinions to predict market movements.

Market Question: ${marketContext.question || 'N/A'}
Current Market Prices:
- Yes: ${marketContext.yesPrice || 'N/A'}
- No: ${marketContext.noPrice || 'N/A'}

Sentiment Data:
${sentimentData || 'No sentiment data available'}

Instructions:
1. Analyze overall sentiment trends across platforms
2. Identify shifts in public opinion
3. Assess the alignment between sentiment and current market prices
4. Consider the volume and credibility of sentiment sources
5. Watch for sentiment momentum and viral trends

Provide a trading decision in JSON format:
{
  "action": "BUY_YES" | "BUY_NO" | "SELL_YES" | "SELL_NO" | "HOLD",
  "confidence": 0.0-1.0,
  "reasoning": "Detailed explanation based on sentiment analysis",
  "stake": "LOW" | "MEDIUM" | "HIGH",
  "sentimentTrend": "description of the sentiment trend"
}

Remember that sentiment can be volatile and may not always correlate with outcomes.
`
  }
}
