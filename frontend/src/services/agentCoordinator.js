import { NewsAgent } from './agents/newsAgent.js'
import { DataAgent } from './agents/dataAgent.js'
import { SentimentAgent } from './agents/sentimentAgent.js'
import { fetchNews } from './dataSources/newsFetcher.js'
import { fetchSentiment } from './dataSources/sentimentFetcher.js'
import { fetchMarketData } from './dataSources/dataFetcher.js'

/**
 * Coordinates multiple agents to make collaborative trading decisions
 */
export class AgentCoordinator {
  constructor(geminiApiKey) {
    this.geminiApiKey = geminiApiKey
    this.agents = []
    this.coordinationHistory = []
    this.initializeAgents()
  }

  initializeAgents() {
    // Create specialized agents
    this.agents = [
      new NewsAgent('NewsAgent-1', this.geminiApiKey),
      new DataAgent('DataAgent-1', this.geminiApiKey),
      new SentimentAgent('SentimentAgent-1', this.geminiApiKey)
    ]
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
