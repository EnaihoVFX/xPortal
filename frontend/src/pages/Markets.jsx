import React, { useState, useEffect } from 'react'
import { useAuth, useEmbeddedWallet } from '../hooks/useAuth'
import { useMarkets } from '../hooks/useMarkets'
import { useMarketsDemo } from '../hooks/useMarketsDemo'
import { formatAddress, formatUSDC } from '../utils/web3'
import getMarketImage, { getOutcomeImage } from '../utils/marketImages'
import { getMarketImageUrl, getOutcomeImageUrl } from '../utils/marketImageUrls'
import Header from '../components/Header'
import './Markets.css'

const CATEGORIES = ['All', 'Politics', 'Sports', 'Crypto', 'Economics', 'Technology', 'Entertainment', 'Weather', 'Other']
const CATEGORY_MAP = {
  'All': -1,
  'Politics': 0,
  'Sports': 1,
  'Crypto': 2,
  'Economics': 3,
  'Technology': 4,
  'Entertainment': 5,
  'Weather': 6,
  'Other': 7
}

const TOP_NAV_ITEMS = ['Trending', 'Breaking', 'New', 'Politics', 'Sports', 'Finance', 'Crypto', 'Geopolitics', 'Earnings', 'Tech', 'Culture', 'World', 'Economy', 'Elections', 'Mentions', 'More']
const FILTER_TAGS = ['All', 'Trump', 'Chile Election', 'Epstein', 'Venezuela', 'Ukraine', 'Best of 2025', 'Mamdani', 'Gemini 3', 'China', 'Google Search']

function Markets() {
  const { user, logout } = useAuth()
  const { signer, address, isConnected } = useEmbeddedWallet()
  
  // Check if this is a demo account
  const isDemoAccount = user?.email?.includes('demo') || user?.email?.includes('@demo.com')
  
  // Use demo mode for demo accounts, real mode otherwise
  const realMarkets = useMarkets(signer)
  const demoMarkets = useMarketsDemo(signer, 'arcTestnet', user?.email)
  const marketsHook = isDemoAccount ? demoMarkets : realMarkets
  
  const { 
    contracts,
    usdcBalance, 
    loading, 
    loadUSDCBalance, 
    loadMarketCount,
    marketCount,
    buyShares,
    sellShares,
    getMarket,
    getOutcomeProbability,
    getAllProbabilities,
    getUserShares,
    getMarketsByCategory
  } = marketsHook

  const [markets, setMarkets] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedTopNav, setSelectedTopNav] = useState('Trending')
  const [selectedFilterTag, setSelectedFilterTag] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMarket, setSelectedMarket] = useState(null)
  const [buyAmount, setBuyAmount] = useState('')
  const [sellSharesAmount, setSellSharesAmount] = useState('')
  const [selectedOutcome, setSelectedOutcome] = useState(0)
  const [probabilities, setProbabilities] = useState({})
  const [userShares, setUserShares] = useState({})
  const [tradeMode, setTradeMode] = useState('buy')
  const [marketsLoading, setMarketsLoading] = useState(false)

  useEffect(() => {
    if (isDemoAccount) {
      // Demo mode - data is already loaded, just ensure balance is set
      console.log('🎮 Demo mode: Using mock data')
      if (demoMarkets.loadUSDCBalance) {
        demoMarkets.loadUSDCBalance(address)
      }
      return
    }
    
    if (isConnected && address) {
      console.log('Markets page: Wallet connected, loading data...')
      console.log('Contracts available:', { 
        marketplace: !!contracts?.marketplace,
        usdc: !!contracts?.usdc 
      })
      if (contracts?.usdc) {
        loadUSDCBalance(address)
      }
      if (contracts?.marketplace) {
        loadMarketCount().then((count) => {
          console.log('Market count loaded:', count)
        })
      } else {
        console.warn('MarketPlace contract not available yet')
      }
    }
  }, [isConnected, address, contracts?.marketplace, contracts?.usdc, isDemoAccount, loadUSDCBalance, loadMarketCount, demoMarkets])

  useEffect(() => {
    if (isDemoAccount || !isConnected) {
      // In demo mode or when not connected, load markets directly
      loadMarkets()
      return
    }
    
    console.log('Market count changed:', marketCount)
    if (isConnected && address && marketCount > 0 && contracts?.marketplace) {
      loadMarkets()
    }
  }, [marketCount, isConnected, address, contracts?.marketplace, isDemoAccount, selectedCategory])

  // Watch for market updates in demo mode
  useEffect(() => {
    if (isDemoAccount && demoMarkets.markets) {
      const categoryId = CATEGORY_MAP[selectedCategory]
      let filtered = demoMarkets.markets
      if (categoryId !== -1) {
        filtered = filtered.filter(m => m.category === categoryId)
      }
      setMarkets(filtered)
    }
  }, [isDemoAccount, demoMarkets.markets, selectedCategory])

  const loadMarkets = async () => {
    if (isDemoAccount) {
      // In demo mode, filter markets by category
      const categoryId = CATEGORY_MAP[selectedCategory]
      let filtered = demoMarkets.markets || []
      
      if (categoryId !== -1) {
        filtered = filtered.filter(m => m.category === categoryId)
      }
      
      setMarkets(filtered)
      return
    }
    
    if (!marketCount || marketCount === 0) {
      console.log('No markets to load, marketCount:', marketCount)
      setMarkets([])
      return
    }
    
    setMarketsLoading(true)
    try {
      const categoryId = CATEGORY_MAP[selectedCategory]
      let marketIds = []
      
      if (categoryId === -1) {
        // Load all markets
        console.log(`Loading all ${marketCount} markets...`)
        for (let i = 1; i <= marketCount; i++) {
          marketIds.push(i)
        }
      } else {
        console.log(`Loading markets for category ${selectedCategory} (${categoryId})...`)
        marketIds = await getMarketsByCategory(categoryId)
        console.log(`Found ${marketIds.length} markets in category`)
      }

      console.log(`Fetching data for ${marketIds.length} markets...`)
      const marketsData = await Promise.all(
        marketIds.map(async (id) => {
          try {
            const market = await getMarket(id)
            if (market) {
              const probs = await getAllProbabilities(id)
              const shares = {}
              for (let i = 0; i < market.outcomes.length; i++) {
                shares[i] = await getUserShares(id, address, i)
              }
              return { ...market, probabilities: probs, userShares: shares }
            }
          } catch (error) {
            console.error(`Error loading market ${id}:`, error)
          }
          return null
        })
      )

      const validMarkets = marketsData.filter(m => m !== null)
      console.log(`Successfully loaded ${validMarkets.length} markets`)
      setMarkets(validMarkets)
    } catch (error) {
      console.error('Error loading markets:', error)
      setMarkets([])
    } finally {
      setMarketsLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected && address) {
      loadMarkets()
    }
  }, [selectedCategory, marketCount, isConnected, address])

  const handleBuyShares = async () => {
    if (!buyAmount || Number(buyAmount) <= 0) return
    
    try {
      await buyShares(selectedMarket, selectedOutcome, buyAmount)
      setBuyAmount('')
      setSelectedMarket(null)
      
      if (isDemoAccount) {
        // In demo mode, reload markets from hook to get updated state
        if (demoMarkets.markets) {
          const categoryId = CATEGORY_MAP[selectedCategory]
          let filtered = demoMarkets.markets
          if (categoryId !== -1) {
            filtered = filtered.filter(m => m.category === categoryId)
          }
          setMarkets(filtered)
        }
        // Balance is automatically updated in demo mode
      } else {
        await loadMarkets()
        await loadUSDCBalance(address)
      }
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleSellShares = async () => {
    if (!sellSharesAmount || Number(sellSharesAmount) <= 0) return
    
    try {
      await sellShares(selectedMarket, selectedOutcome, sellSharesAmount)
      setSellSharesAmount('')
      setSelectedMarket(null)
      
      if (isDemoAccount) {
        // In demo mode, reload markets from hook to get updated state
        if (demoMarkets.markets) {
          const categoryId = CATEGORY_MAP[selectedCategory]
          let filtered = demoMarkets.markets
          if (categoryId !== -1) {
            filtered = filtered.filter(m => m.category === categoryId)
          }
          setMarkets(filtered)
        }
        // Balance is automatically updated in demo mode
      } else {
        await loadMarkets()
        await loadUSDCBalance(address)
      }
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  const getProbability = (market, outcomeIndex) => {
    // In demo mode, get probability from market object
    if (isDemoAccount && market.probabilities && market.probabilities[outcomeIndex] !== undefined) {
      return Math.round(market.probabilities[outcomeIndex])
    }
    // For real mode, use probabilities state if available
    if (probabilities[market.id] && probabilities[market.id][outcomeIndex] !== undefined) {
      return Math.round(probabilities[market.id][outcomeIndex])
    }
    // Default fallback
    if (market.probabilities && market.probabilities[outcomeIndex] !== undefined) {
      return Math.round(market.probabilities[outcomeIndex])
    }
    return 50
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(Number(timestamp) * 1000)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    const displayMinutes = minutes.toString().padStart(2, '0')
    return `${displayHours}:${displayMinutes} ${ampm}`
  }

  const getCategoryName = (category) => {
    const categoryNames = {
      0: 'Politics',
      1: 'Sports',
      2: 'Crypto',
      3: 'Economics',
      4: 'Technology',
      5: 'Entertainment',
      6: 'Weather',
      7: 'Other'
    }
    return categoryNames[category] || 'Other'
  }

  const getProbabilityColorClass = (probability) => {
    if (probability >= 70) return 'prob-high'
    if (probability >= 40) return 'prob-medium'
    return 'prob-low'
  }

  const isPersonMatch = (question) => {
    const q = question.toLowerCase()
    return q.includes('islam') || q.includes('makhachev') || q.includes('jack della') ||
           q.includes('jannik') || q.includes('sinner') || q.includes('maduro')
  }

  const filteredMarkets = markets.filter(market => {
    const matchesCategory = selectedCategory === 'All' || market.category === selectedCategory
    const matchesSearch = market.question.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (!isConnected) {
    return (
      <div className="markets-page">
        <div className="loading">Loading your wallet...</div>
      </div>
    )
  }

  // Debug info (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Markets page state:', {
      marketCount,
      marketsLoaded: markets.length,
      contractsReady: !!contracts?.marketplace,
      isConnected,
      address
    })
  }

  return (
    <div className="markets-page">
      <Header />

      {/* Top Navigation Bar */}
      <div className="top-nav-bar">
        <div className="top-nav-content">
          {TOP_NAV_ITEMS.map(item => (
            <button
              key={item}
              onClick={() => setSelectedTopNav(item)}
              className={`top-nav-item ${selectedTopNav === item ? 'active' : ''}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="markets-content">
        {/* Search and Filter Bar */}
        <div className="search-filter-section">
          <div className="search-bar-wrapper">
          <div className="search-bar">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            </div>
            <div className="filter-icons">
              <button className="filter-icon-btn">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 5H17M5 10H15M7 15H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <button className="filter-icon-btn">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6L10 11L17 6M3 14L10 19L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Secondary Filter Bar */}
          <div className="filter-tags-bar">
            {FILTER_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedFilterTag(tag)}
                className={`filter-tag ${selectedFilterTag === tag ? 'active' : ''}`}
              >
                {tag}
              </button>
            ))}
            <button className="filter-tag-more">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Markets Grid */}
        <div className="markets-grid">
          {marketsLoading ? (
            <div className="empty-state">
              <p>Loading markets...</p>
            </div>
          ) : filteredMarkets.length === 0 ? (
            <div className="empty-state">
              <p>No markets found</p>
              <p style={{ fontSize: '0.875rem', color: '#666' }}>
                {marketCount > 0 ? `Found ${marketCount} markets but none match your filters` : 'Create a market to get started'}
              </p>
            </div>
          ) : (
            filteredMarkets.map(market => {
              const probability = getProbability(market, 0)
              const isBinary = market.outcomes.length === 2
              const marketImage = getMarketImage(market.question, market.category)
              const marketImageUrl = getMarketImageUrl(market.question, market.category)
              const hasPersonNames = isPersonMatch(market.question) || 
                (market.outcomes.length === 2 && 
                 (getOutcomeImage(market.outcomes[0])?.type === 'profile' || 
                  getOutcomeImage(market.outcomes[1])?.type === 'profile'))
              const hasDrawOption = market.outcomes.length === 3 && market.outcomes.some(o => o.toLowerCase().includes('draw'))
              
              return (
                <div key={market.id} className="market-card-compact">
                  {isBinary && hasPersonNames ? (
                    <>
                      <div className="market-card-header">
                        <h3 className="market-question">{market.question}</h3>
                      </div>
                      {market.outcomes.map((outcome, idx) => {
                        const prob = getProbability(market, idx)
                        const outcomeImage = getOutcomeImage(outcome)
                        const outcomeImageUrl = getOutcomeImageUrl(outcome)
                        const isProfile = outcomeImage?.type === 'profile' || outcomeImageUrl?.type === 'profile'
                        return (
                          <div key={idx} className="market-person-row">
                            {isProfile && (
                              <div className="profile-picture">
                                <img 
                                  src={outcomeImageUrl.url} 
                                  alt={outcome}
                                  className="profile-img"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    if (e.target.nextSibling) {
                                      e.target.nextSibling.style.display = 'block'
                                    }
                                  }}
                                />
                                <span className="profile-emoji" style={{ display: 'none' }}>
                                  {outcomeImage?.emoji || ''}
                                </span>
                              </div>
                            )}
                            <div className="person-info">
                              <span className="person-name">{outcome}</span>
                              <span className={`person-percent ${getProbabilityColorClass(prob)}`}>{prob}%</span>
                            </div>
                </div>
                        )
                      })}
                      <div className="market-buttons-row">
                  {market.outcomes.map((outcome, idx) => {
                          const shortName = outcome.split(' ')[0] + (outcome.split(' ').length > 1 ? ' ' + outcome.split(' ')[1] : '')
                    return (
                            <button
                              key={idx}
                              onClick={() => {
                                setSelectedMarket(market.id)
                                setSelectedOutcome(idx)
                                setTradeMode('buy')
                              }}
                              className={`market-btn person-btn ${idx === 0 ? 'selected' : ''}`}
                            >
                              {shortName}
                            </button>
                          )
                        })}
                      </div>
                    </>
                  ) : isBinary ? (
                    <>
                      <div className="market-card-header">
                        <div className="market-header-left">
                          <div className="market-image">
                            <img 
                              src={marketImageUrl.url} 
                              alt={marketImage.name}
                              className="market-image-img"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'block'
                              }}
                            />
                            <span className="market-image-icon" title={marketImage.name} style={{ display: 'none' }}>
                              {marketImage.value}
                            </span>
                          </div>
                          <h3 className="market-question">{market.question}</h3>
                        </div>
                        <div className="market-probability-display">
                          <div className="semi-circle-progress">
                            <svg className="semi-circle-svg" viewBox="0 0 120 80">
                              {/* Background semi-circle */}
                              <path
                                d="M 10 60 A 50 50 0 0 1 110 60"
                                fill="none"
                                stroke="#1f1f1f"
                                strokeWidth="8"
                                strokeLinecap="round"
                              />
                              {/* Progress semi-circle */}
                              <path
                                d="M 10 60 A 50 50 0 0 1 110 60"
                                fill="none"
                                stroke={
                                  probability >= 70 ? '#10b981' : 
                                  probability >= 40 ? '#f59e0b' : 
                                  '#ef4444'
                                }
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${157.08 * (probability / 100)} 157.08`}
                                strokeDashoffset="0"
                                className="semi-circle-progress-path"
                              />
                            </svg>
                            <div className="semi-circle-text">
                              <span className={`large-probability ${getProbabilityColorClass(probability)}`}>{probability}%</span>
                              <span className="chance-label">chance</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="market-buttons-row">
                        <button
                          onClick={() => {
                            setSelectedMarket(market.id)
                            setSelectedOutcome(0)
                            setTradeMode('buy')
                          }}
                          className="market-btn yes-btn"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMarket(market.id)
                            setSelectedOutcome(1)
                            setTradeMode('buy')
                          }}
                          className="market-btn no-btn"
                        >
                          No
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="market-card-header">
                        <div className="market-header-left">
                          <div className="market-image">
                            <img 
                              src={marketImageUrl.url} 
                              alt={marketImage.name}
                              className="market-image-img"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'block'
                              }}
                            />
                            <span className="market-image-icon" title={marketImage.name} style={{ display: 'none' }}>
                              {marketImage.value}
                            </span>
                          </div>
                          <h3 className="market-question">{market.question}</h3>
                        </div>
                      </div>
                      {market.outcomes.slice(0, hasDrawOption ? 3 : 2).map((outcome, idx) => {
                        const prob = getProbability(market, idx)
                        const outcomeImage = getOutcomeImage(outcome)
                        const outcomeImageUrl = getOutcomeImageUrl(outcome)
                        const isDraw = outcome.toLowerCase().includes('draw')
                        return (
                          <div key={idx} className="market-outcome-row">
                            <div className="outcome-info">
                              {outcomeImageUrl && (
                                <img 
                                  src={outcomeImageUrl.url} 
                                  alt={outcome}
                                  className={`outcome-image-img ${outcomeImageUrl.type === 'profile' ? 'profile-icon' : ''}`}
                                  style={{ width: `${outcomeImageUrl.size}px`, height: `${outcomeImageUrl.size}px` }}
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    if (e.target.nextSibling) {
                                      e.target.nextSibling.style.display = 'inline-block'
                                    }
                                  }}
                                />
                              )}
                              {outcomeImage && (
                                <span className={`outcome-image-icon ${outcomeImage?.type === 'profile' ? 'profile-icon' : ''}`} style={{ display: 'none' }}>
                                  {outcomeImage?.value || ''}
                                </span>
                              )}
                              <span className="outcome-label">{outcome}</span>
                              <span className={`outcome-percent ${getProbabilityColorClass(prob)}`}>{prob}%</span>
                            </div>
                            {!hasDrawOption && (
                              <div className="outcome-buttons">
                                <button
                                  onClick={() => {
                                    setSelectedMarket(market.id)
                                    setSelectedOutcome(idx)
                                    setTradeMode('buy')
                                  }}
                                  className="outcome-btn yes-btn-small"
                                >
                                  Yes
                                </button>
                          <button
                            onClick={() => {
                              setSelectedMarket(market.id)
                              setSelectedOutcome(idx)
                              setTradeMode('buy')
                            }}
                                  className="outcome-btn no-btn-small"
                          >
                                  No
                          </button>
                        </div>
                            )}
                      </div>
                    )
                  })}
                      {hasDrawOption && (
                        <div className="market-buttons-row three-buttons">
                    {market.outcomes.map((outcome, idx) => {
                            const isDraw = outcome.toLowerCase().includes('draw')
                        return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setSelectedMarket(market.id)
                                  setSelectedOutcome(idx)
                                  setTradeMode('buy')
                                }}
                                className={`market-btn ${isDraw ? 'draw-btn' : 'team-btn'}`}
                              >
                                {isDraw ? 'DRAW' : outcome.split(' ')[0]}
                              </button>
                            )
                    })}
                  </div>
                )}
                    </>
                  )}

                  <div className="market-volume">
                    <span className="volume-text">
                      {(() => {
                        const volume = parseFloat(formatUSDC(market.totalVolume))
                        let volumeText = ''
                        if (volume >= 1000000) {
                          volumeText = `$${(volume / 1000000).toFixed(0)}m Vol.`
                        } else if (volume >= 1000) {
                          volumeText = `$${(volume / 1000).toFixed(0)}k Vol.`
                        } else {
                          volumeText = `$${volume.toFixed(0)} Vol.`
                        }
                        const categoryName = getCategoryName(market.category)
                        const timeText = market.endTime ? formatTime(market.endTime) : ''
                        if (categoryName && timeText) {
                          return `${volumeText} • ${categoryName} • ${timeText}`
                        } else if (categoryName) {
                          return `${volumeText} • ${categoryName}`
                        }
                        return volumeText
                      })()}
                    </span>
                    <div className="market-actions">
                      <button className="icon-btn">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 1.5L11.3175 6.6825L16.5 9L11.3175 11.3175L9 16.5L6.6825 11.3175L1.5 9L6.6825 6.6825L9 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button className="icon-btn">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6.75H15M7.5 3V6.75M10.5 3V6.75M3.75 6.75L4.5 15C4.5 15.4142 4.83579 15.75 5.25 15.75H12.75C13.1642 15.75 13.5 15.4142 13.5 15L14.25 6.75H3.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
              </div>
              )
            })
          )}
        </div>
      </div>

      {selectedMarket && (
        <div className="trade-modal">
          <div className="modal-content">
            <button 
              onClick={() => setSelectedMarket(null)}
              className="close-btn"
            >
              ×
            </button>
            <h2>
              {tradeMode === 'buy' ? 'Buy' : 'Sell'} {selectedMarket && markets.find(m => m.id === selectedMarket)?.outcomes[selectedOutcome]}
            </h2>
            
            <div className="trade-tabs">
              <button 
                className={`tab ${tradeMode === 'buy' ? 'active' : ''}`}
                onClick={() => setTradeMode('buy')}
              >
                Buy
              </button>
              <button 
                className={`tab ${tradeMode === 'sell' ? 'active' : ''}`}
                onClick={() => setTradeMode('sell')}
              >
                Sell
              </button>
            </div>

            <div className="trade-form">
              <div className="form-group">
                <label>Outcome</label>
                <select 
                  value={selectedOutcome}
                  onChange={(e) => setSelectedOutcome(Number(e.target.value))}
                  className="trade-select"
                >
                  {markets.find(m => m.id === selectedMarket)?.outcomes.map((outcome, idx) => (
                    <option key={idx} value={idx}>{outcome}</option>
                  ))}
                </select>
              </div>

              {tradeMode === 'buy' ? (
                <>
                  <div className="form-group">
                    <label>Amount (USDC)</label>
                    <input
                      type="number"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="trade-input"
                    />
                  </div>
                  <button
                    onClick={handleBuyShares}
                    disabled={loading || !buyAmount}
                    className="trade-submit-btn"
                  >
                    {loading ? 'Processing...' : 'Buy Shares'}
                  </button>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Your Shares</label>
                    <div className="shares-info">
                      {markets.find(m => m.id === selectedMarket)?.userShares?.[selectedOutcome] || '0'} shares
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Shares to Sell</label>
                    <input
                      type="number"
                      value={sellSharesAmount}
                      onChange={(e) => setSellSharesAmount(e.target.value)}
                      placeholder="0"
                      min="0"
                      step="1"
                      className="trade-input"
                    />
                  </div>
                  <button
                    onClick={handleSellShares}
                    disabled={loading || !sellSharesAmount}
                    className="trade-submit-btn"
                  >
                    {loading ? 'Processing...' : 'Sell Shares'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Markets

