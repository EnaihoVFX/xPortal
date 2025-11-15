import { NewsAgent } from './agents/newsAgent.js'
import { DataAgent } from './agents/dataAgent.js'
import { SentimentAgent } from './agents/sentimentAgent.js'
import { fetchNews } from './dataSources/newsFetcher.js'
import { fetchSentiment } from './dataSources/sentimentFetcher.js'
import { fetchMarketData } from './dataSources/dataFetcher.js'

/**
 * Coordinates multiple agents to make collaborative trading decisions
 * Now supports OpenRouter API with configurable models per agent
 */
export class AgentCoordinator {
  constructor(openRouterApiKey, agentModels = {}) {
    const trimmedKey = openRouterApiKey?.trim()
    if (!trimmedKey || trimmedKey.length === 0) {
      console.error('AgentCoordinator: Invalid or empty API key provided')
      throw new Error('OpenRouter API key is required and cannot be empty')
    }
    this.openRouterApiKey = trimmedKey
    this.agents = []
    this.coordinationHistory = []
    this.agentModels = agentModels // { newsAgent: ['model1', 'model2'], dataAgent: ['model3'], ... }
    this.initializeAgents()
  }

  /**
   * Set model configurations for agents
   * @param {Object} agentModels - Object mapping agent types to model arrays
   * Example: { newsAgent: ['openai/gpt-4', 'anthropic/claude-3'], dataAgent: ['google/gemini-pro'] }
   */
  setAgentModels(agentModels) {
    this.agentModels = agentModels
    this.initializeAgents()
  }

  /**
   * Get current model configurations
   */
  getAgentModels() {
    return this.agentModels
  }

  initializeAgents() {
    // Validate API key before creating agents
    const apiKey = this.openRouterApiKey?.trim()
    if (!apiKey || apiKey.length === 0) {
      console.error('AgentCoordinator.initializeAgents: No valid API key available')
      this.agents = []
      return
    }

    // Default models if none specified
    const defaultModels = {
      newsAgent: ['openai/gpt-4o-mini'],
      dataAgent: ['openai/gpt-4o-mini'],
      sentimentAgent: ['openai/gpt-4o-mini']
    }

    // Merge with provided configurations
    const models = {
      newsAgent: this.agentModels.newsAgent || defaultModels.newsAgent,
      dataAgent: this.agentModels.dataAgent || defaultModels.dataAgent,
      sentimentAgent: this.agentModels.sentimentAgent || defaultModels.sentimentAgent
    }

    // Create specialized agents with their configured models
    this.agents = [
      new NewsAgent('NewsAgent-1', apiKey, models.newsAgent),
      new DataAgent('DataAgent-1', apiKey, models.dataAgent),
      new SentimentAgent('SentimentAgent-1', apiKey, models.sentimentAgent)
    ]
    
    console.log('AgentCoordinator: Initialized', this.agents.length, 'agents with API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING')
  }

  /**
   * Gather information from all sources
   */
  async gatherInformation(marketContext) {
    const topic = marketContext.question || marketContext.topic || 'market'
    
    const [news, sentiment, marketData] = await Promise.all([
      fetchNews(topic),
      fetchSentiment(topic),
      fetchMarketData(marketContext.marketId, marketContext)
    ])

    return {
      news,
      sentiment,
      marketData,
      all: [...news, ...sentiment, ...marketData]
    }
  }

  /**
   * Have all agents analyze and make decisions
   */
  async getAgentDecisions(information, marketContext) {
    const decisions = await Promise.all(
      this.agents.map(agent => {
        // Each agent gets relevant information
        const relevantInfo = this.getRelevantInformation(agent, information)
        return agent.analyzeAndDecide(relevantInfo, marketContext)
      })
    )

    return decisions.map((decision, idx) => ({
      agent: this.agents[idx],
      decision,
      agentName: this.agents[idx].name,
      agentRole: this.agents[idx].role
    }))
  }

  /**
   * Get information relevant to a specific agent type
   */
  getRelevantInformation(agent, information) {
    if (agent instanceof NewsAgent) {
      return information.news || []
    } else if (agent instanceof DataAgent) {
      return information.marketData || []
    } else if (agent instanceof SentimentAgent) {
      return information.sentiment || []
    }
    return information.all || []
  }

  /**
   * Synthesize decisions from multiple agents into a final recommendation
   */
  synthesizeDecisions(agentDecisions, marketContext) {
    // Weight decisions by confidence
    const weightedActions = {
      BUY_YES: 0,
      BUY_NO: 0,
      SELL_YES: 0,
      SELL_NO: 0,
      HOLD: 0
    }

    let totalWeight = 0

    agentDecisions.forEach(({ decision }) => {
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
    const avgConfidence = agentDecisions.reduce(
      (sum, { decision }) => sum + decision.confidence, 
      0
    ) / agentDecisions.length

    // Aggregate reasoning
    const aggregatedReasoning = agentDecisions
      .map(({ agentName, decision }) => `${agentName}: ${decision.reasoning}`)
      .join('\n\n')

    // Determine consensus strength
    const consensusStrength = this.calculateConsensus(agentDecisions)

    return {
      recommendedAction: bestAction,
      confidence: avgConfidence,
      consensusStrength,
      weightedScores: weightedActions,
      agentDecisions,
      reasoning: aggregatedReasoning,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Calculate how much agents agree with each other
   */
  calculateConsensus(agentDecisions) {
    const actions = agentDecisions.map(({ decision }) => decision.action)
    const uniqueActions = new Set(actions)
    
    if (uniqueActions.size === 1) {
      return 'strong' // All agree
    } else if (uniqueActions.size === 2) {
      // Check if actions are similar (both buying, both selling, etc)
      const actionGroups = {
        buying: ['BUY_YES', 'BUY_NO'],
        selling: ['SELL_YES', 'SELL_NO'],
        holding: ['HOLD']
      }
      
      let foundGroup = null
      for (const [group, groupActions] of Object.entries(actionGroups)) {
        if (actions.every(action => groupActions.includes(action))) {
          foundGroup = group
          break
        }
      }
      
      return foundGroup ? 'moderate' : 'weak'
    } else {
      return 'weak' // High disagreement
    }
  }

  /**
   * Main coordination method - orchestrates the entire process
   */
  async coordinateTradeDecision(marketContext) {
    try {
      // Step 1: Gather information
      const information = await this.gatherInformation(marketContext)

      // Step 2: Get decisions from all agents
      const agentDecisions = await this.getAgentDecisions(information, marketContext)

      // Step 3: Synthesize into final recommendation
      const finalDecision = this.synthesizeDecisions(agentDecisions, marketContext)

      // Step 4: Record in history
      const coordinationRecord = {
        marketContext,
        information,
        agentDecisions,
        finalDecision,
        timestamp: new Date().toISOString()
      }

      this.coordinationHistory.push(coordinationRecord)

      return {
        success: true,
        ...coordinationRecord
      }
    } catch (error) {
      console.error('Error in agent coordination:', error)
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Get coordination history
   */
  getHistory() {
    return this.coordinationHistory
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.coordinationHistory = []
    this.agents.forEach(agent => agent.clearHistory())
  }

  /**
   * Get agents
   */
  getAgents() {
    return this.agents
  }
}

