import { BaseAgent } from './baseAgent.js'

/**
 * Data-focused agent that specializes in analyzing quantitative data and trends
 */
export class DataAgent extends BaseAgent {
  constructor(name, openRouterApiKey, models = []) {
    super(name, 'Data & Trend Analyst', openRouterApiKey, models)
  }

  buildAnalysisPrompt(informationSources, marketContext) {
    const dataPoints = informationSources
      .filter(source => source.type === 'data' || source.type === 'statistics')
      .map((source, idx) => {
        return `Data ${idx + 1}:
Type: ${source.dataType || 'General'}
Values: ${JSON.stringify(source.values || {})}
Trend: ${source.trend || 'N/A'}
Timestamp: ${source.timestamp || 'N/A'}
`
      })
      .join('\n\n')

    return `
You are a specialized data and trend analyst agent for prediction markets.

Your role is to analyze quantitative data, statistics, and trends to make data-driven trading decisions.

Market Question: ${marketContext.question || 'N/A'}
Current Market State:
- Yes Price: ${marketContext.yesPrice || 'N/A'}
- No Price: ${marketContext.noPrice || 'N/A'}
- Volume: ${marketContext.volume || 'N/A'}
- Historical Prices: ${JSON.stringify(marketContext.historicalPrices || [])}

Available Data:
${dataPoints || 'No quantitative data available'}

Instructions:
1. Analyze trends in the quantitative data
2. Identify statistical patterns and correlations
3. Compare current market prices with data-driven predictions
4. Assess the strength of data signals

Provide a trading decision in JSON format:
{
  "action": "BUY_YES" | "BUY_NO" | "SELL_YES" | "SELL_NO" | "HOLD",
  "confidence": 0.0-1.0,
  "reasoning": "Detailed explanation based on data analysis",
  "stake": "LOW" | "MEDIUM" | "HIGH",
  "dataSignals": ["list of 2-3 key data signals"]
}

Focus on objective, quantifiable evidence and trends.
`
  }
}

