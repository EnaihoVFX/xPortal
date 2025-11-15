/**
 * Fetches news articles from various sources
 * For demo purposes, uses mock data but can be extended with real APIs
 */

// Mock news data for demonstration
const MOCK_NEWS = [
  {
    title: "Major Policy Announcement Expected This Week",
    content: "Government officials have hinted at a significant policy announcement that could impact market conditions. Analysts are closely watching for developments.",
    source: "Financial Times",
    date: new Date().toISOString(),
    sentiment: "neutral",
    type: "news"
  },
  {
    title: "Industry Report Shows Strong Growth Trends",
    content: "A recent industry report indicates positive growth trends with key metrics exceeding expectations. Market participants are optimistic about future prospects.",
    source: "Reuters",
    date: new Date(Date.now() - 86400000).toISOString(),
    sentiment: "positive",
    type: "news"
  },
  {
    title: "Expert Panel Discusses Market Implications",
    content: "Leading experts gathered to discuss current market dynamics and potential future scenarios. The discussion covered multiple perspectives on recent developments.",
    source: "Bloomberg",
    date: new Date(Date.now() - 172800000).toISOString(),
    sentiment: "neutral",
    type: "article"
  }
]

/**
 * Fetch news articles related to a topic
 * @param {string} topic - The topic to search for
 * @param {number} limit - Maximum number of articles to return
 * @returns {Promise<Array>} Array of news articles
 */
export async function fetchNews(topic, limit = 10) {
  // In a real implementation, this would call actual news APIs like:
  // - NewsAPI.org
  // - Google News RSS
  // - Custom news aggregators
  
  // For now, return filtered mock data
  const filteredNews = MOCK_NEWS
    .filter(article => 
      article.title.toLowerCase().includes(topic.toLowerCase()) ||
      article.content.toLowerCase().includes(topic.toLowerCase())
    )
    .slice(0, limit)

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300))

  return filteredNews.length > 0 
    ? filteredNews 
    : MOCK_NEWS.slice(0, Math.min(limit, MOCK_NEWS.length))
}

/**
 * Fetch real news using NewsAPI (requires API key)
 * Uncomment and configure if you have a NewsAPI key
 */
export async function fetchRealNews(topic, apiKey, limit = 10) {
  if (!apiKey) {
    return fetchNews(topic, limit) // Fallback to mock
  }

  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&sortBy=publishedAt&pageSize=${limit}&apiKey=${apiKey}`
    )
    const data = await response.json()
    
    if (data.articles) {
      return data.articles.map(article => ({
        title: article.title,
        content: article.description || article.content,
        source: article.source.name,
        date: article.publishedAt,
        url: article.url,
        sentiment: 'neutral', // Could add sentiment analysis here
        type: 'news'
      }))
    }
  } catch (error) {
    console.error('Error fetching real news:', error)
    return fetchNews(topic, limit) // Fallback to mock
  }

  return []
}

