import { BaseAgent } from './baseAgent.js'

/**
 * News-focused agent that specializes in analyzing news articles and media
 */
export class NewsAgent extends BaseAgent {
  constructor(name, geminiApiKey) {
    super(name, 'News & Media Analyst', geminiApiKey)
  }

  buildAnalysisPrompt(informationSources, marketContext) {
    const newsItems = informationSources
      .filter(source => source.type === 'news' || source.type === 'article')
      .map((source, idx) => {
        return `News ${idx + 1}:
Title: ${source.title || 'N/A'}
Content: ${source.content}
Source: ${source.source || 'Unknown'}
Date: ${source.date || 'Unknown'}
Sentiment: ${source.sentiment || 'Neutral'}
`
      })
      .join('\n\n')

    return `
You are a specialized news and media analyst agent for prediction markets.

Your role is to analyze news articles, media reports, and current events to predict market outcomes.

Market Question: ${marketContext.question || 'N/A'}
Current Market Prices:
- Yes: ${marketContext.yesPrice || 'N/A'}
- No: ${marketContext.noPrice || 'N/A'}

Recent News Articles:
${newsItems || 'No news articles available'}

Instructions:
1. Analyze the sentiment and relevance of each news article to the market question
2. Identify key facts, trends, and signals in the news
3. Assess how recent news might affect market probabilities
4. Consider the credibility and recency of sources

Provide a trading decision in JSON format:
{
  "action": "BUY_YES" | "BUY_NO" | "SELL_YES" | "SELL_NO" | "HOLD",
  "confidence": 0.0-1.0,
  "reasoning": "Detailed explanation based on news analysis",
  "stake": "LOW" | "MEDIUM" | "HIGH",
  "keyNewsPoints": ["list of 2-3 most relevant news points"]
}

Focus on recent, relevant news that directly impacts the market question.
`
  }
}

