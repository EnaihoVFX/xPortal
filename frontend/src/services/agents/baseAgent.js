/**
 * Base Agent class for market trading agents
 * All specialized agents extend this base class
 */
export class BaseAgent {
  constructor(name, role, geminiApiKey) {
    this.name = name
    this.role = role
    this.geminiApiKey = geminiApiKey
    this.model = null
    this.decisionHistory = []
    this.initModel()
  }

  async initModel() {
    if (!this.geminiApiKey) {
      console.warn(`No Gemini API key provided for agent ${this.name}`)
      return
    }
    
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(this.geminiApiKey)
      // Try gemini-1.5-flash first (free, fast), fallback to gemini-pro
      try {
        this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      } catch (e) {
        this.model = genAI.getGenerativeModel({ model: 'gemini-pro' })
      }
    } catch (error) {
      console.error(`Error initializing Gemini model for ${this.name}:`, error)
    }
  }

  /**
   * Analyze information sources and make a trading decision
   * @param {Array} informationSources - Array of information from various sources
   * @param {Object} marketContext - Current market context
   * @returns {Promise<Object>} Trading decision
   */
  async analyzeAndDecide(informationSources, marketContext) {
    if (!this.model) {
      // Fallback decision if model not initialized
      return this.getFallbackDecision(marketContext)
    }

    try {
      const prompt = this.buildAnalysisPrompt(informationSources, marketContext)
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      const decision = this.parseDecision(text, marketContext)
      decision.rawResponse = text
      decision.timestamp = new Date().toISOString()
      decision.agentName = this.name
      
      this.decisionHistory.push(decision)
      return decision
    } catch (error) {
      console.error(`Error in agent ${this.name} analysis:`, error)
      return this.getFallbackDecision(marketContext)
    }
  }

  /**
   * Build the analysis prompt for the LLM
   * Override in subclasses for specialized prompts
   */
  buildAnalysisPrompt(informationSources, marketContext) {
    const sourcesSummary = informationSources
      .map((source, idx) => `Source ${idx + 1} (${source.type}): ${source.content}`)
      .join('\n\n')

    return `
You are a ${this.role} trading agent analyzing market information.

Market Context:
- Market Question: ${marketContext.question || 'N/A'}
- Current Yes Price: ${marketContext.yesPrice || 'N/A'}
- Current No Price: ${marketContext.noPrice || 'N/A'}
- Market Volume: ${marketContext.volume || 'N/A'}

Information Sources:
${sourcesSummary}

Based on the above information, provide a trading decision in the following JSON format:
{
  "action": "BUY_YES" | "BUY_NO" | "SELL_YES" | "SELL_NO" | "HOLD",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of the decision",
  "stake": "suggested stake amount (relative: LOW, MEDIUM, HIGH)"
}

Be concise and data-driven in your analysis.
`
  }

  /**
   * Parse the LLM response into a structured decision
   */
  parseDecision(responseText, marketContext) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          action: parsed.action || 'HOLD',
          confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
          reasoning: parsed.reasoning || 'No reasoning provided',
          stake: parsed.stake || 'MEDIUM'
        }
      }
    } catch (error) {
      console.error('Error parsing decision:', error)
    }

    // Fallback parsing
    const actionMatch = responseText.match(/(BUY_YES|BUY_NO|SELL_YES|SELL_NO|HOLD)/i)
    const confidenceMatch = responseText.match(/confidence[:\s]+([0-9.]+)/i)
    const stakeMatch = responseText.match(/stake[:\s]+(LOW|MEDIUM|HIGH)/i)

    return {
      action: actionMatch ? actionMatch[1].toUpperCase() : 'HOLD',
      confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5,
      reasoning: responseText.substring(0, 200),
      stake: stakeMatch ? stakeMatch[1].toUpperCase() : 'MEDIUM'
    }
  }

  /**
   * Fallback decision when model is unavailable
   */
  getFallbackDecision(marketContext) {
    return {
      action: 'HOLD',
      confidence: 0.3,
      reasoning: 'Agent model not initialized - defaulting to HOLD',
      stake: 'LOW',
      timestamp: new Date().toISOString(),
      agentName: this.name,
      isFallback: true
    }
  }

  /**
   * Get decision history
   */
  getDecisionHistory() {
    return this.decisionHistory
  }

  /**
   * Clear decision history
   */
  clearHistory() {
    this.decisionHistory = []
  }
}
