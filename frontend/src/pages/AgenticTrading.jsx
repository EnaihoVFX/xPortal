import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AgentCoordinator } from '../services/agentCoordinator'
import Header from '../components/Header'
import './AgenticTrading.css'

function AgenticTrading() {
  const navigate = useNavigate()
  const [coordinator, setCoordinator] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [marketContext, setMarketContext] = useState({
    question: 'Will the stock market close higher this week?',
    yesPrice: '0.55',
    noPrice: '0.45',
    volume: '125000',
    marketId: '1'
  })
  const [information, setInformation] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    // Load API key from localStorage if available
    const savedKey = localStorage.getItem('gemini_api_key')
    if (savedKey) {
      setGeminiApiKey(savedKey)
    }

    // Initialize coordinator when API key is available
    if (geminiApiKey) {
      const coord = new AgentCoordinator(geminiApiKey)
      setCoordinator(coord)
    }
  }, [geminiApiKey])

  useEffect(() => {
    scrollToBottom()
  }, [history])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleApiKeySave = () => {
    if (geminiApiKey) {
      localStorage.setItem('gemini_api_key', geminiApiKey)
      const coord = new AgentCoordinator(geminiApiKey)
      setCoordinator(coord)
      alert('API key saved and coordinator initialized!')
    }
  }

  const handleAnalyze = async () => {
    if (!coordinator) {
      alert('Please set your Gemini API key first')
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
              <label>Gemini API Key</label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="input-field"
              />
              <button 
                onClick={handleApiKeySave}
                className="btn-primary btn-small"
                disabled={!geminiApiKey}
              >
                Save Key
              </button>
              <small className="help-text">
                Get your free API key from{' '}
                <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                  Google AI Studio
                </a>
              </small>
            </div>
          </div>

          <div className="market-config-section">
            <h3>Market Context</h3>
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
