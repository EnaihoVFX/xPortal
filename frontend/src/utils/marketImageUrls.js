// Image URL mappings for markets and outcomes
// Uses Unsplash and other public image APIs

const PROFILE_SIZE = 32
const FLAG_SIZE = 24
const LOGO_SIZE = 32

// Unsplash API - using source.unsplash.com for random images by keyword
// For production, you can use the Unsplash API with a free API key
const getUnsplashImage = (keyword, width = 400, height = 400) => {
  // Using Unsplash Source API (no key required for basic use)
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(keyword)}`
}

// Profile picture mappings - using Unsplash with specific keywords
const profileImages = {
  'islam makhachev': getUnsplashImage('ufc fighter mma', 400, 400),
  'jack della': getUnsplashImage('ufc fighter mma', 400, 400),
  'jannik sinner': getUnsplashImage('tennis player', 400, 400),
  'alex de minaur': getUnsplashImage('tennis player australia', 400, 400),
  'trump': getUnsplashImage('donald trump', 400, 400),
  'biden': getUnsplashImage('joe biden', 400, 400),
  'elon musk': getUnsplashImage('elon musk', 400, 400),
  'musk': getUnsplashImage('elon musk', 400, 400),
  'xi jinping': getUnsplashImage('xi jinping', 400, 400),
  'maduro': getUnsplashImage('nicolas maduro', 400, 400),
  'oprah': getUnsplashImage('oprah winfrey', 400, 400),
  'jose antonio kast': getUnsplashImage('chile politician', 400, 400),
  'jeannette jara': getUnsplashImage('chile politician woman', 400, 400),
}

// Country flag image URLs - using flag emoji API or actual flag images
const flagImages = {
  'chile': 'https://flagcdn.com/w40/ch.png',
  'kazakhstan': 'https://flagcdn.com/w40/kz.png',
  'belgium': 'https://flagcdn.com/w40/be.png',
  'spain': 'https://flagcdn.com/w40/es.png',
  'georgia': 'https://flagcdn.com/w40/ge.png',
  'venezuela': 'https://flagcdn.com/w40/ve.png',
  'ukraine': 'https://flagcdn.com/w40/ua.png',
  'china': 'https://flagcdn.com/w40/cn.png',
  'italy': 'https://flagcdn.com/w40/it.png',
  'australia': 'https://flagcdn.com/w40/au.png',
}

// Company/Logo image URLs - using Unsplash or public logo APIs
const logoImages = {
  'google': 'https://logo.clearbit.com/google.com',
  'openai': 'https://logo.clearbit.com/openai.com',
  'gemini': 'https://logo.clearbit.com/google.com',
  'uniswap': 'https://logo.clearbit.com/uniswap.org',
  'zksync': getUnsplashImage('blockchain ethereum', 200, 200),
  'ens': getUnsplashImage('ethereum domain', 200, 200),
}

// Category/Event icons - using Unsplash
const categoryImages = {
  'ufc': getUnsplashImage('ufc mma fighting', 400, 400),
  'tennis': getUnsplashImage('tennis court racket', 400, 400),
  'football': getUnsplashImage('american football nfl', 400, 400),
  'soccer': getUnsplashImage('soccer football field', 400, 400),
  'politics': getUnsplashImage('politics government', 400, 400),
  'crypto': getUnsplashImage('cryptocurrency bitcoin', 400, 400),
  'economics': getUnsplashImage('economics finance', 400, 400),
  'technology': getUnsplashImage('technology computer', 400, 400),
}

export const getProfileImageUrl = (name) => {
  const key = name.toLowerCase()
  for (const [profileName, url] of Object.entries(profileImages)) {
    if (key.includes(profileName)) {
      return url
    }
  }
  // Fallback to Unsplash with name as keyword
  return getUnsplashImage(name, 400, 400)
}

export const getFlagImageUrl = (country) => {
  const key = country.toLowerCase()
  for (const [countryName, url] of Object.entries(flagImages)) {
    if (key.includes(countryName)) {
      return url
    }
  }
  return null
}

export const getLogoImageUrl = (company) => {
  const key = company.toLowerCase()
  for (const [companyName, url] of Object.entries(logoImages)) {
    if (key.includes(companyName)) {
      return url
    }
  }
  return null
}

export const getCategoryImageUrl = (category) => {
  const key = category.toLowerCase()
  for (const [catName, url] of Object.entries(categoryImages)) {
    if (key.includes(catName)) {
      return url
    }
  }
  return null
}

// Main function to get image URL for an outcome
export const getOutcomeImageUrl = (outcome) => {
  const o = outcome.toLowerCase()
  
  // Try flag image first (most specific)
  const flagUrl = getFlagImageUrl(outcome)
  if (flagUrl) {
    return { type: 'flag', url: flagUrl, size: FLAG_SIZE }
  }
  
  // Try logo image
  const logoUrl = getLogoImageUrl(outcome)
  if (logoUrl) {
    return { type: 'logo', url: logoUrl, size: LOGO_SIZE }
  }
  
  // Try profile image (check if it's in our specific list)
  const key = outcome.toLowerCase()
  let isSpecificProfile = false
  for (const profileName of Object.keys(profileImages)) {
    if (key.includes(profileName)) {
      isSpecificProfile = true
      break
    }
  }
  
  if (isSpecificProfile) {
    const profileUrl = getProfileImageUrl(outcome)
    return { type: 'profile', url: profileUrl, size: PROFILE_SIZE }
  }
  
  // Return Unsplash image as fallback
  return { 
    type: 'profile', 
    url: getUnsplashImage(outcome, 400, 400), 
    size: PROFILE_SIZE 
  }
}

// Get image URL for market header
export const getMarketImageUrl = (question, category) => {
  const q = question.toLowerCase()
  
  // Check for specific people/entities in question
  const profileUrl = getProfileImageUrl(question)
  if (profileUrl) {
    return { type: 'profile', url: profileUrl, size: PROFILE_SIZE }
  }
  
  // Check for countries
  const flagUrl = getFlagImageUrl(question)
  if (flagUrl) {
    return { type: 'flag', url: flagUrl, size: FLAG_SIZE }
  }
  
  // Check for companies
  const logoUrl = getLogoImageUrl(question)
  if (logoUrl) {
    return { type: 'logo', url: logoUrl, size: LOGO_SIZE }
  }
  
  // Check for categories
  const eventCategoryUrl = getCategoryImageUrl(question)
  if (eventCategoryUrl) {
    return { type: 'category', url: eventCategoryUrl, size: LOGO_SIZE }
  }
  
  // Default Unsplash image based on category
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
  const catName = categoryNames[category] || 'Market'
  const defaultCategoryUrl = categoryImages[catName.toLowerCase()] || getUnsplashImage(catName, 400, 400)
  return { 
    type: 'category', 
    url: defaultCategoryUrl, 
    size: LOGO_SIZE 
  }
}

