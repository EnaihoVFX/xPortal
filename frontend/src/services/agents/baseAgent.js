/**
 * Base Agent class for market trading agents
 * All specialized agents extend this base class
 * Now supports OpenRouter API with multiple models per agent
 */
export class BaseAgent {
  constructor(name, role, openRouterApiKey, models = []) {
    this.name = name
    this.role = role
    this.openRouterApiKey = openRouterApiKey
    this.models = Array.isArray(models) ? models : (models ? [models] : [])
    this.decisionHistory = []
    
    if (this.models.length === 0) {
      console.warn(`No models configured for agent ${this.name}`)
    }
  }

  /**
   * Set models for this agent
   * @param {string|string[]} models - Model identifier(s) from OpenRouter
   */
  setModels(models) {
    this.models = Array.isArray(models) ? models : (models ? [models] : [])
  }

  /**
   * Get configured models for this agent
   */
  getModels() {
    return this.models
  }

  /**
   * Call OpenRouter API with a specific model
   * @param {string} model - Model identifier
   * @param {string} prompt - The prompt to send
   * @returns {Promise<string>} Response text
   */
  async callOpenRouter(model, prompt) {
    const apiKey = this.openRouterApiKey?.trim()
    if (!apiKey || apiKey.length === 0) {
      console.error(`Agent ${this.name}: API key is missing or empty. Key value:`, this.openRouterApiKey ? 'present but empty/whitespace' : 'undefined/null')
      throw new Error('OpenRouter API key not provided or is empty')
    }

    console.log(`Agent ${this.name}: Making API call with key: ${apiKey.substring(0, 10)}...`)

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Prediction Market Trading Agent'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || ''
    } catch (error) {
      console.error(`Error calling OpenRouter API with model ${model}:`, error)
      throw error
    }
  }

  /**
   * Analyze information sources and make a trading decision
   * If multiple models are configured, queries all and aggregates results
   * @param {Array} informationSources - Array of information from various sources
   * @param {Object} marketContext - Current market context
   * @returns {Promise<Object>} Trading decision
   */
  async analyzeAndDecide(informationSources, marketContext) {
    const apiKey = this.openRouterApiKey?.trim()
    if (this.models.length === 0 || !apiKey || apiKey.length === 0) {
      // Fallback decision if no models configured or no API key
      return this.getFallbackDecision(marketContext)
    }

    try {
      const prompt = this.buildAnalysisPrompt(informationSources, marketContext)
      
      // If multiple models, query all and aggregate
      if (this.models.length > 1) {
        return await this.analyzeWithMultipleModels(prompt, marketContext)
      } else {
        // Single model - simple query
        return await this.analyzeWithSingleModel(this.models[0], prompt, marketContext)
      }
    } catch (error) {
      console.error(`Error in agent ${this.name} analysis:`, error)
      return this.getFallbackDecision(marketContext)
    }
  }

  /**
   * Analyze with a single model
   */
  async analyzeWithSingleModel(model, prompt, marketContext) {
    const text = await this.callOpenRouter(model, prompt)
    const decision = this.parseDecision(text, marketContext)
    decision.rawResponse = text
    decision.model = model
    decision.timestamp = new Date().toISOString()
    decision.agentName = this.name
    
    this.decisionHistory.push(decision)
    return decision
  }

  /**
   * Analyze with multiple models and aggregate results
   */
  async analyzeWithMultipleModels(prompt, marketContext) {
    // Query all models in parallel
    const modelQueries = this.models.map(model => 
      this.callOpenRouter(model, prompt)
        .then(text => ({ model, text, success: true }))
        .catch(error => ({ model, error: error.message, success: false }))
    )

    const results = await Promise.all(modelQueries)
    
    // Parse decisions from successful queries
    const decisions = results
      .filter(r => r.success)
      .map(({ model, text }) => {
        const decision = this.parseDecision(text, marketContext)
        decision.model = model
        decision.rawResponse = text
        return decision
      })

    if (decisions.length === 0) {
      // All models failed
      return this.getFallbackDecision(marketContext)
    }

    // Aggregate decisions from multiple models
    const aggregatedDecision = this.aggregateDecisions(decisions, marketContext)
    aggregatedDecision.timestamp = new Date().toISOString()
    aggregatedDecision.agentName = this.name
    aggregatedDecision.modelsUsed = this.models
    aggregatedDecision.individualDecisions = decisions
    aggregatedDecision.failedModels = results.filter(r => !r.success).map(r => r.model)
    
    this.decisionHistory.push(aggregatedDecision)
    return aggregatedDecision
  }

  /**
   * Aggregate decisions from multiple models
   */
  aggregateDecisions(decisions, marketContext) {
    // Weight decisions by confidence
    const weightedActions = {
      BUY_YES: 0,
      BUY_NO: 0,
      SELL_YES: 0,
      SELL_NO: 0,
      HOLD: 0
    }

    let totalWeight = 0

    decisions.forEach(decision => {
      const weight = decision.confidence
      weightedActions[decision.action] += weight
      totalWeight += weight
    })

    // Normalize
    Object.keys(weightedActions).forEach(action => {
      weightedActions[action] = totalWeight > 0 
        ? weightedActions[action] / totalWeight 
        : 0
    })

    // Find the action with highest weighted score
    const bestAction = Object.keys(weightedActions).reduce((a, b) =>
      weightedActions[a] > weightedActions[b] ? a : b
    )

    // Calculate average confidence
    const avgConfidence = decisions.reduce(
      (sum, decision) => sum + decision.confidence, 
      0
    ) / decisions.length

    // Aggregate reasoning
    const aggregatedReasoning = decisions
      .map((decision, idx) => `Model ${idx + 1} (${decision.model || 'unknown'}): ${decision.reasoning}`)
      .join('\n\n')

    // Determine consensus strength
    const uniqueActions = new Set(decisions.map(d => d.action))
    let consensusStrength = 'strong'
    if (uniqueActions.size > 1) {
      const actionGroups = {
        buying: ['BUY_YES', 'BUY_NO'],
        selling: ['SELL_YES', 'SELL_NO'],
        holding: ['HOLD']
      }
      
      let foundGroup = null
      for (const [group, groupActions] of Object.entries(actionGroups)) {
        if (decisions.every(d => groupActions.includes(d.action))) {
          foundGroup = group
          break
        }
      }
      
      consensusStrength = foundGroup ? 'moderate' : 'weak'
    }

    return {
      action: bestAction,
      confidence: avgConfidence,
      reasoning: aggregatedReasoning,
      stake: this.aggregateStake(decisions),
      consensusStrength,
      weightedScores: weightedActions,
      modelCount: decisions.length
    }
  }

  /**
   * Aggregate stake recommendations
   */
  aggregateStake(decisions) {
    const stakeValues = { LOW: 1, MEDIUM: 2, HIGH: 3 }
    const avgStakeValue = decisions.reduce(
      (sum, d) => sum + (stakeValues[d.stake] || 2), 
      0
    ) / decisions.length

    if (avgStakeValue <= 1.5) return 'LOW'
    if (avgStakeValue <= 2.5) return 'MEDIUM'
    return 'HIGH'
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
