import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AgentCoordinator } from '../services/agentCoordinator'
import { MarketDbService } from '../services/marketDb'
import Header from '../components/Header'
import './AgenticTrading.css'

// Popular OpenRouter models for quick selection
const POPULAR_MODELS = [
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
  'openai/gpt-4-turbo',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3-opus',
  'google/gemini-pro-1.5',
  'google/gemini-2.0-flash-exp',
  'meta-llama/llama-3.1-70b-instruct',
  'mistralai/mistral-large',
  'perplexity/llama-3.1-sonar-large-128k-online'
]

function AgenticTrading() {
  const navigate = useNavigate()
  const [coordinator, setCoordinator] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [openRouterApiKey, setOpenRouterApiKey] = useState('')
  const [agentModels, setAgentModels] = useState({
    newsAgent: ['openai/gpt-4o-mini'],
    dataAgent: ['openai/gpt-4o-mini'],
    sentimentAgent: ['openai/gpt-4o-mini']
  })
  const [marketContext, setMarketContext] = useState({
    question: 'Will the stock market close higher this week?',
    yesPrice: '0.55',
    noPrice: '0.45',
    volume: '125000',
    marketId: '1'
  })
  const [information, setInformation] = useState(null)
  const [availableMarkets, setAvailableMarkets] = useState([])
  const [loadingMarkets, setLoadingMarkets] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    // Load API key and model configs from localStorage if available (only on mount)
    const savedKey = localStorage.getItem('openrouter_api_key')
    if (savedKey) {
      const trimmedKey = savedKey.trim()
      if (trimmedKey && trimmedKey.length > 0) {
        console.log('Loading API key from localStorage:', trimmedKey.substring(0, 10) + '...')
        setOpenRouterApiKey(trimmedKey)
      } else {
        console.warn('Saved API key in localStorage is empty or whitespace')
        localStorage.removeItem('openrouter_api_key')
      }
    } else {
      console.log('No API key found in localStorage')
    }

    const savedModels = localStorage.getItem('agent_models')
    if (savedModels) {
      try {
        const parsed = JSON.parse(savedModels)
        setAgentModels(prev => {
          // Only update if different to avoid loops
          if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
            return parsed
          }
          return prev
        })
      } catch (e) {
        console.error('Error parsing saved models:', e)
      }
    }
  }, []) // Only run on mount

  const initializeCoordinator = React.useCallback(() => {
    const trimmedKey = openRouterApiKey?.trim()
    if (trimmedKey && trimmedKey.length > 0) {
      console.log('Initializing coordinator with API key:', trimmedKey.substring(0, 10) + '...')
      try {
        const coord = new AgentCoordinator(trimmedKey, agentModels)
        setCoordinator(coord)
        console.log('Coordinator initialized successfully')
      } catch (error) {
        console.error('Error initializing coordinator:', error)
        setCoordinator(null)
      }
    } else {
      console.log('Cannot initialize coordinator: API key is empty or missing')
      setCoordinator(null)
    }
  }, [openRouterApiKey, agentModels])

  useEffect(() => {
    // Initialize coordinator when API key or models change
    initializeCoordinator()
  }, [initializeCoordinator])

  useEffect(() => {
    scrollToBottom()
  }, [history])

  // Load available markets from database
  useEffect(() => {
    const loadMarkets = async () => {
      setLoadingMarkets(true)
      try {
        const markets = await MarketDbService.getMarkets({ 
          status: 0, // Only active markets
          limit: 50 
        })
        setAvailableMarkets(markets)
      } catch (error) {
        console.warn('Error loading markets from database:', error)
      } finally {
        setLoadingMarkets(false)
      }
    }
    loadMarkets()
  }, [])

  // Load market from database when marketId changes
  const loadMarketFromDb = async (marketId) => {
    if (!marketId) return
    
    try {
      const market = await MarketDbService.getMarket(parseInt(marketId))
      if (market) {
        // Database returns snake_case, convert to camelCase for context
        setMarketContext({
          question: market.question || market.question,
          yesPrice: market.yes_price || '0.5',
          noPrice: market.no_price || '0.5',
          volume: market.total_volume || market.totalVolume || '0',
          marketId: (market.market_id || market.marketId || marketId).toString()
        })
      }
    } catch (error) {
      console.warn('Error loading market from database:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleApiKeySave = () => {
    const trimmedKey = openRouterApiKey?.trim()
    if (trimmedKey && trimmedKey.length > 0) {
      localStorage.setItem('openrouter_api_key', trimmedKey)
      localStorage.setItem('agent_models', JSON.stringify(agentModels))
      setOpenRouterApiKey(trimmedKey) // Update state with trimmed value
      initializeCoordinator()
      alert('API key and model configurations saved!')
    } else {
      alert('Please enter a valid API key')
    }
  }

  const handleAddModel = (agentType) => {
    setAgentModels(prev => ({
      ...prev,
      [agentType]: [...(prev[agentType] || []), 'openai/gpt-4o-mini']
    }))
  }

  const handleRemoveModel = (agentType, index) => {
    setAgentModels(prev => ({
      ...prev,
      [agentType]: prev[agentType].filter((_, i) => i !== index)
    }))
  }

  const handleModelChange = (agentType, index, newModel) => {
    setAgentModels(prev => ({
      ...prev,
      [agentType]: prev[agentType].map((model, i) => i === index ? newModel : model)
    }))
  }

  const handleAnalyze = async () => {
    const trimmedKey = openRouterApiKey?.trim()
    if (!coordinator || !trimmedKey || trimmedKey.length === 0) {
      alert('Please set your OpenRouter API key first. Enter your key in the Configuration section and click "Save Key".')
      return
    }

    setIsAnalyzing(true)
    setResult(null)
    
    // Add starting message to history
    const startMessage = {
      type: 'system',
      message: 'Starting multi-agent analysis...',
      timestamp: new Date().toISOString()
    }
    setHistory(prev => [...prev, startMessage])

    try {
      const analysisResult = await coordinator.coordinateTradeDecision(marketContext)
      
      if (analysisResult.success) {
        setResult(analysisResult)
        setInformation(analysisResult.information)
        
        // Sync market to database if marketId is provided
        if (marketContext.marketId) {
          try {
            await MarketDbService.syncMarket({
              id: parseInt(marketContext.marketId),
              marketId: parseInt(marketContext.marketId),
              creator: 'agent_system',
              question: marketContext.question,
              description: marketContext.question,
              outcomes: ['Yes', 'No'],
              endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
              status: 0,
              category: 7,
              totalLiquidity: '0',
              totalVolume: marketContext.volume || '0',
              totalFees: '0',
              creationTime: Math.floor(Date.now() / 1000)
            })

            // Record market history snapshot
            await MarketDbService.addMarketHistory(parseInt(marketContext.marketId), {
              timestamp: Math.floor(Date.now() / 1000),
              yesPrice: marketContext.yesPrice,
              noPrice: marketContext.noPrice,
              probabilities: [
                (parseFloat(marketContext.yesPrice) * 100).toString(),
                (parseFloat(marketContext.noPrice) * 100).toString()
              ],
              totalVolume: marketContext.volume || '0',
              totalLiquidity: '0'
            })

            // Record analysis event
            await MarketDbService.addMarketEvent(parseInt(marketContext.marketId), {
              eventType: 'AGENT_ANALYSIS',
              eventData: {
                finalDecision: analysisResult.finalDecision,
                agentDecisions: analysisResult.agentDecisions.map(({ agentName, agentRole, decision }) => ({
                  agentName,
                  agentRole,
                  action: decision.action,
                  confidence: decision.confidence
                }))
              },
              userAddress: null,
              transactionHash: null
            })
          } catch (dbError) {
            console.warn('Error syncing to database:', dbError)
            // Continue even if DB sync fails
          }
        }
        
        // Add agent decisions to history
        analysisResult.agentDecisions.forEach(({ agentName, agentRole, decision }) => {
          setHistory(prev => [...prev, {
            type: 'agent',
            agentName,
            agentRole,
            decision,
            timestamp: decision.timestamp
          }])
        })

        // Add final decision to history
        setHistory(prev => [...prev, {
          type: 'final',
          decision: analysisResult.finalDecision,
          timestamp: analysisResult.finalDecision.timestamp
        }])
      } else {
        throw new Error(analysisResult.error || 'Analysis failed')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      setHistory(prev => [...prev, {
        type: 'error',
        message: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      }])
      alert('Analysis failed. Please check your API key and try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'BUY_YES':
        return '#10b981' // green
      case 'BUY_NO':
        return '#10b981' // green
      case 'SELL_YES':
        return '#ef4444' // red
      case 'SELL_NO':
        return '#ef4444' // red
      case 'HOLD':
        return '#f59e0b' // amber
      default:
        return '#6b7280' // gray
    }
  }

  const formatAction = (action) => {
    return action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const clearHistory = () => {
    if (coordinator) {
      coordinator.clearHistory()
      setHistory([])
      setResult(null)
      setInformation(null)
    }
  }

  return (
    <div className="agentic-trading-page">
      <Header />
      <div className="agentic-page-header">
        <div>
          <h1>🤖 Agentic Trading System</h1>
          <p className="subtitle">Multi-agent market analysis powered by AI</p>
        </div>
      </div>

      <div className="agentic-content">
        <div className="agentic-sidebar">
          <div className="config-section">
            <h3>Configuration</h3>
            <div className="input-group">
              <label>OpenRouter API Key</label>
              <input
                type="password"
                value={openRouterApiKey}
                onChange={(e) => setOpenRouterApiKey(e.target.value)}
                placeholder="Enter your OpenRouter API key"
                className="input-field"
              />
              <button 
                onClick={handleApiKeySave}
                className="btn-primary btn-small"
                disabled={!openRouterApiKey}
              >
                Save Key
              </button>
              <small className="help-text">
                Get your API key from{' '}
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">
                  OpenRouter
                </a>
              </small>
            </div>
          </div>

          <div className="models-config-section">
            <h3>Agent Models</h3>
            <p className="section-description">Configure models for each agent. Agents can use multiple models for better decisions.</p>
            
            {['newsAgent', 'dataAgent', 'sentimentAgent'].map(agentType => {
              const agentLabel = {
                newsAgent: 'News Agent',
                dataAgent: 'Data Agent',
                sentimentAgent: 'Sentiment Agent'
              }[agentType]

              return (
                <div key={agentType} className="agent-model-config">
                  <div className="agent-model-header">
                    <label>{agentLabel}</label>
                    <button
                      onClick={() => handleAddModel(agentType)}
                      className="btn-add-model"
                      title="Add another model"
                    >
                      + Add Model
                    </button>
                  </div>
                  {(agentModels[agentType] || []).map((model, index) => (
                    <div key={index} className="model-selector-row">
                      <select
                        value={model}
                        onChange={(e) => handleModelChange(agentType, index, e.target.value)}
                        className="model-select"
                      >
                        {POPULAR_MODELS.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => handleModelChange(agentType, index, e.target.value)}
                        placeholder="Or enter custom model ID"
                        className="model-input"
                      />
                      {(agentModels[agentType] || []).length > 1 && (
                        <button
                          onClick={() => handleRemoveModel(agentType, index)}
                          className="btn-remove-model"
                          title="Remove this model"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {(!agentModels[agentType] || agentModels[agentType].length === 0) && (
                    <button
                      onClick={() => handleAddModel(agentType)}
                      className="btn-add-first-model"
                    >
                      + Add Model
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <div className="market-config-section">
            <h3>Market Context</h3>
            {availableMarkets.length > 0 && (
              <div className="input-group">
                <label>Load Market from Database</label>
                <select
                  onChange={(e) => {
                    const marketId = e.target.value
                    if (marketId) {
                      loadMarketFromDb(marketId)
                    }
                  }}
                  className="input-field"
                  defaultValue=""
                >
                  <option value="">Select a market...</option>
                  {availableMarkets.map(market => (
                    <option key={market.market_id} value={market.market_id}>
                      {market.question} (ID: {market.market_id})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="input-group">
              <label>Market ID</label>
              <input
                type="text"
                value={marketContext.marketId}
                onChange={(e) => setMarketContext({...marketContext, marketId: e.target.value})}
                placeholder="Enter market ID"
                className="input-field"
              />
              <button
                onClick={() => loadMarketFromDb(marketContext.marketId)}
                className="btn-primary btn-small"
                disabled={!marketContext.marketId}
              >
                Load from DB
              </button>
            </div>
            <div className="input-group">
              <label>Market Question</label>
              <textarea
                value={marketContext.question}
                onChange={(e) => setMarketContext({...marketContext, question: e.target.value})}
                className="input-field"
                rows="3"
              />
            </div>
            <div className="input-row">
              <div className="input-group">
                <label>Yes Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={marketContext.yesPrice}
                  onChange={(e) => setMarketContext({...marketContext, yesPrice: e.target.value})}
                  className="input-field"
                />
              </div>
              <div className="input-group">
                <label>No Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={marketContext.noPrice}
                  onChange={(e) => setMarketContext({...marketContext, noPrice: e.target.value})}
                  className="input-field"
                />
              </div>
            </div>
            <div className="input-group">
              <label>Volume</label>
              <input
                type="text"
                value={marketContext.volume}
                onChange={(e) => setMarketContext({...marketContext, volume: e.target.value})}
                className="input-field"
              />
            </div>
          </div>

          <div className="actions-section">
            <button
              onClick={handleAnalyze}
              className="btn-primary btn-large"
              disabled={!coordinator || isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : '🚀 Start Analysis'}
            </button>
            <button
              onClick={clearHistory}
              className="btn-secondary btn-large"
              disabled={history.length === 0}
            >
              Clear History
            </button>
          </div>

          {coordinator && (
            <div className="agents-info">
              <h3>Active Agents</h3>
              {coordinator.getAgents().map(agent => (
                <div key={agent.name} className="agent-badge">
                  <span className="agent-name">{agent.name}</span>
                  <span className="agent-role">{agent.role}</span>
                  <div className="agent-models">
                    <small>Models: {agent.getModels().join(', ')}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="agentic-main">
          <div className="analysis-results">
            {result && result.success && (
              <div className="final-decision-card">
                <h2>Final Decision</h2>
                <div className="decision-content">
                  <div 
                    className="action-badge-large"
                    style={{ backgroundColor: getActionColor(result.finalDecision.recommendedAction) }}
                  >
                    {formatAction(result.finalDecision.recommendedAction)}
                  </div>
                  <div className="confidence-meter">
                    <label>Confidence: {(result.finalDecision.confidence * 100).toFixed(1)}%</label>
                    <div className="meter-bar">
                      <div 
                        className="meter-fill"
                        style={{ 
                          width: `${result.finalDecision.confidence * 100}%`,
                          backgroundColor: result.finalDecision.confidence > 0.7 ? '#10b981' : 
                                          result.finalDecision.confidence > 0.4 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                  </div>
                  <div className="consensus-badge">
                    Consensus: <strong>{result.finalDecision.consensusStrength}</strong>
                  </div>
                  <div className="reasoning-box">
                    <strong>Reasoning:</strong>
                    <p>{result.finalDecision.reasoning}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="agent-decisions-section">
              <h3>Agent Decisions</h3>
              {result && result.agentDecisions && result.agentDecisions.map(({ agent, decision, agentName, agentRole }, idx) => (
                <div key={idx} className="agent-decision-card">
                  <div className="agent-header">
                    <span className="agent-name">{agentName}</span>
                    <span className="agent-role">{agentRole}</span>
                  </div>
                  {decision.modelsUsed && decision.modelsUsed.length > 1 && (
                    <div className="models-used-badge">
                      <small>Using {decision.modelsUsed.length} models: {decision.modelsUsed.join(', ')}</small>
                    </div>
                  )}
                  {decision.model && !decision.modelsUsed && (
                    <div className="models-used-badge">
                      <small>Model: {decision.model}</small>
                    </div>
                  )}
                  <div className="decision-details">
                    <div 
                      className="action-badge"
                      style={{ backgroundColor: getActionColor(decision.action) }}
                    >
                      {formatAction(decision.action)}
                    </div>
                    <div className="confidence-value">
                      Confidence: {(decision.confidence * 100).toFixed(1)}%
                    </div>
                    <div className="stake-badge">
                      Stake: {decision.stake}
                    </div>
                  </div>
                  <div className="decision-reasoning">
                    {decision.reasoning}
                  </div>
                  {decision.individualDecisions && decision.individualDecisions.length > 1 && (
                    <div className="individual-models-section">
                      <strong>Individual Model Decisions:</strong>
                      {decision.individualDecisions.map((indDecision, i) => (
                        <div key={i} className="individual-model-decision">
                          <span className="model-name">{indDecision.model || `Model ${i + 1}`}:</span>
                          <span className="model-action" style={{ color: getActionColor(indDecision.action) }}>
                            {formatAction(indDecision.action)} ({(indDecision.confidence * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {decision.keyNewsPoints && (
                    <div className="key-points">
                      <strong>Key Points:</strong>
                      <ul>
                        {decision.keyNewsPoints.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {information && (
              <div className="information-sources">
                <h3>Information Sources</h3>
                <div className="source-tabs">
                  <div className="source-section">
                    <h4>📰 News Articles ({information.news?.length || 0})</h4>
                    {information.news?.map((article, idx) => (
                      <div key={idx} className="source-item">
                        <div className="source-title">{article.title}</div>
                        <div className="source-meta">
                          {article.source} • {article.sentiment || 'neutral'}
                        </div>
                        <div className="source-content">{article.content}</div>
                      </div>
                    ))}
                  </div>
                  <div className="source-section">
                    <h4>💬 Sentiment Data ({information.sentiment?.length || 0})</h4>
                    {information.sentiment?.map((sentiment, idx) => (
                      <div key={idx} className="source-item">
                        <div className="source-title">{sentiment.platform}</div>
                        <div className="source-meta">
                          Score: {sentiment.sentimentScore} • 
                          Positive: {sentiment.positive}% • 
                          Negative: {sentiment.negative}%
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="source-section">
                    <h4>📊 Market Data ({information.marketData?.length || 0})</h4>
                    {information.marketData?.map((data, idx) => (
                      <div key={idx} className="source-item">
                        <div className="source-title">{data.dataType}</div>
                        <div className="source-meta">Trend: {data.trend}</div>
                        <div className="source-content">
                          <pre>{JSON.stringify(data.values, null, 2)}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="analysis-history">
            <h3>Analysis History</h3>
            <div className="history-messages">
              {history.length === 0 ? (
                <div className="empty-state">
                  No analysis history yet. Start an analysis to see agent decisions.
                </div>
              ) : (
                history.map((item, idx) => (
                  <div key={idx} className={`history-message ${item.type}`}>
                    {item.type === 'system' && (
                      <div className="message-content">
                        <span className="message-icon">⚙️</span>
                        <span>{item.message}</span>
                      </div>
                    )}
                    {item.type === 'agent' && (
                      <div className="message-content">
                        <span className="message-icon">🤖</span>
                        <div>
                          <strong>{item.agentName}</strong> ({item.agentRole})
                          <div className="agent-action">
                            Decision: <span style={{ color: getActionColor(item.decision.action) }}>
                              {formatAction(item.decision.action)}
                            </span> 
                            ({(item.decision.confidence * 100).toFixed(1)}% confidence)
                          </div>
                        </div>
                      </div>
                    )}
                    {item.type === 'final' && (
                      <div className="message-content">
                        <span className="message-icon">✅</span>
                        <div>
                          <strong>Final Decision:</strong> 
                          <span 
                            className="final-action"
                            style={{ color: getActionColor(item.decision.recommendedAction) }}
                          >
                            {formatAction(item.decision.recommendedAction)}
                          </span>
                          ({(item.decision.confidence * 100).toFixed(1)}% confidence, {item.decision.consensusStrength} consensus)
                        </div>
                      </div>
                    )}
                    {item.type === 'error' && (
                      <div className="message-content error">
                        <span className="message-icon">❌</span>
                        <span>{item.message}</span>
                      </div>
                    )}
                    <div className="message-timestamp">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgenticTrading
