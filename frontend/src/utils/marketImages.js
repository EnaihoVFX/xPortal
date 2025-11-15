// Utility function to get relevant images for markets based on question and category

export const getOutcomeImage = (outcome) => {
  const o = outcome.toLowerCase()
  
  // Countries/Flags
  const countryFlags = {
    'chile': '🇨🇱',
    'kazakhstan': '🇰🇿',
    'belgium': '🇧🇪',
    'spain': '🇪🇸',
    'georgia': '🇬🇪',
    'venezuela': '🇻🇪',
    'ukraine': '🇺🇦',
    'china': '🇨🇳',
    'chinese': '🇨🇳',
    'italy': '🇮🇹',
    'italian': '🇮🇹',
    'australia': '🇦🇺',
    'australian': '🇦🇺',
    'kansas city': '🏈',
    'philadelphia': '🏈',
    'jannik sinner': '🇮🇹',
    'alex de minaur': '🇦🇺',
    'islam makhachev': '🥊',
    'jack della': '🥊',
    'jose antonio kast': '🇨🇱',
    'jeannette jara': '🇨🇱',
  }
  
  // Check if this is a person name that should have a profile picture
  const personNames = [
    'islam makhachev', 'jack della', 'jannik sinner', 'alex de minaur',
    'trump', 'biden', 'elon', 'musk', 'xi jinping', 'maduro', 'oprah',
    'jose antonio kast', 'jeannette jara'
  ]
  
  for (const name of personNames) {
    if (o.includes(name)) {
      return { type: 'profile', emoji: '👤', name: outcome }
    }
  }
  
  for (const [key, flag] of Object.entries(countryFlags)) {
    if (o.includes(key)) {
      return { type: 'flag', emoji: flag, name: key }
    }
  }
  
  // Companies
  if (o.includes('google')) return { type: 'company', emoji: '🔍', name: 'Google' }
  if (o.includes('openai')) return { type: 'company', emoji: '🤖', name: 'OpenAI' }
  if (o.includes('gemini')) return { type: 'company', emoji: '🤖', name: 'Gemini' }
  if (o.includes('uniswap')) return { type: 'company', emoji: '🦄', name: 'Uniswap' }
  if (o.includes('zksync') || o.includes('zk')) return { type: 'company', emoji: '⚡', name: 'ZKsync' }
  if (o.includes('ens')) return { type: 'company', emoji: '🌐', name: 'ENS' }
  
  return null
}

const getMarketImage = (question, category) => {
  const q = question.toLowerCase()
  
  // People/Personalities
  if (q.includes('trump') || q.includes('donald')) {
    return {
      type: 'emoji',
      value: '👤',
      name: 'Trump'
    }
  }
  if (q.includes('biden') || q.includes('joe biden')) {
    return {
      type: 'emoji',
      value: '👤',
      name: 'Biden'
    }
  }
  if (q.includes('elon') || q.includes('musk')) {
    return {
      type: 'emoji',
      value: '👤',
      name: 'Elon Musk'
    }
  }
  if (q.includes('xi jinping') || q.includes('xi')) {
    return {
      type: 'emoji',
      value: '👤',
      name: 'Xi Jinping'
    }
  }
  if (q.includes('madhuro') || q.includes('venezuela')) {
    return {
      type: 'emoji',
      value: '👤',
      name: 'Maduro'
    }
  }
  if (q.includes('oprah')) {
    return {
      type: 'emoji',
      value: '👤',
      name: 'Oprah'
    }
  }
  if (q.includes('epstein')) {
    return {
      type: 'emoji',
      value: '👤',
      name: 'Epstein'
    }
  }
  
  // Countries/Flags
  if (q.includes('chile')) {
    return {
      type: 'flag',
      value: '🇨🇱',
      name: 'Chile'
    }
  }
  if (q.includes('kazakhstan')) {
    return {
      type: 'flag',
      value: '🇰🇿',
      name: 'Kazakhstan'
    }
  }
  if (q.includes('belgium')) {
    return {
      type: 'flag',
      value: '🇧🇪',
      name: 'Belgium'
    }
  }
  if (q.includes('spain')) {
    return {
      type: 'flag',
      value: '🇪🇸',
      name: 'Spain'
    }
  }
  if (q.includes('georgia') && !q.includes('state')) {
    return {
      type: 'flag',
      value: '🇬🇪',
      name: 'Georgia'
    }
  }
  if (q.includes('venezuela')) {
    return {
      type: 'flag',
      value: '🇻🇪',
      name: 'Venezuela'
    }
  }
  if (q.includes('ukraine')) {
    return {
      type: 'flag',
      value: '🇺🇦',
      name: 'Ukraine'
    }
  }
  if (q.includes('china') || q.includes('chinese')) {
    return {
      type: 'flag',
      value: '🇨🇳',
      name: 'China'
    }
  }
  if (q.includes('italy') || q.includes('italian')) {
    return {
      type: 'flag',
      value: '🇮🇹',
      name: 'Italy'
    }
  }
  if (q.includes('australia') || q.includes('australian')) {
    return {
      type: 'flag',
      value: '🇦🇺',
      name: 'Australia'
    }
  }
  
  // Sports
  if (q.includes('super bowl') || q.includes('nfl') || q.includes('football')) {
    return {
      type: 'sport',
      value: '🏈',
      name: 'Football'
    }
  }
  if (q.includes('ufc') || q.includes('mma') || q.includes('makhachev') || q.includes('maddalena')) {
    return {
      type: 'sport',
      value: '🥊',
      name: 'UFC'
    }
  }
  if (q.includes('tennis') || q.includes('atp') || q.includes('sinner') || q.includes('de minaur')) {
    return {
      type: 'sport',
      value: '🎾',
      name: 'Tennis'
    }
  }
  if (q.includes('uef') || q.includes('qualifiers') || q.includes('soccer') || q.includes('football match')) {
    return {
      type: 'sport',
      value: '⚽',
      name: 'Soccer'
    }
  }
  
  // Companies/Tech
  if (q.includes('google')) {
    return {
      type: 'company',
      value: '🔍',
      name: 'Google'
    }
  }
  if (q.includes('gemini')) {
    return {
      type: 'company',
      value: '🤖',
      name: 'Gemini'
    }
  }
  if (q.includes('openai') || q.includes('chatgpt')) {
    return {
      type: 'company',
      value: '🤖',
      name: 'OpenAI'
    }
  }
  if (q.includes('uniswap')) {
    return {
      type: 'company',
      value: '🦄',
      name: 'Uniswap'
    }
  }
  if (q.includes('zk') || q.includes('zksync')) {
    return {
      type: 'company',
      value: '⚡',
      name: 'ZKsync'
    }
  }
  if (q.includes('ens')) {
    return {
      type: 'company',
      value: '🌐',
      name: 'ENS'
    }
  }
  if (q.includes('time') && q.includes('magazine')) {
    return {
      type: 'company',
      value: '📰',
      name: 'TIME'
    }
  }
  
  // Government/Institutions
  if (q.includes('fed') || q.includes('federal reserve')) {
    return {
      type: 'institution',
      value: '🏛️',
      name: 'Federal Reserve'
    }
  }
  if (q.includes('supreme court')) {
    return {
      type: 'institution',
      value: '⚖️',
      name: 'Supreme Court'
    }
  }
  if (q.includes('house') && (q.includes('passes') || q.includes('bill'))) {
    return {
      type: 'institution',
      value: '🏛️',
      name: 'House'
    }
  }
  if (q.includes('government shutdown') || q.includes('capitol')) {
    return {
      type: 'institution',
      value: '🏛️',
      name: 'Government'
    }
  }
  
  // Category-based defaults
  const categoryMap = {
    0: { value: '🗳️', name: 'Politics' }, // Politics
    1: { value: '⚽', name: 'Sports' }, // Sports
    2: { value: '₿', name: 'Crypto' }, // Crypto
    3: { value: '📈', name: 'Economics' }, // Economics
    4: { value: '💻', name: 'Technology' }, // Technology
    5: { value: '🎬', name: 'Entertainment' }, // Entertainment
    6: { value: '🌤️', name: 'Weather' }, // Weather
    7: { value: '📊', name: 'Other' } // Other
  }
  
  const categoryInfo = categoryMap[category] || categoryMap[7]
  
  return {
    type: 'category',
    value: categoryInfo.value,
    name: categoryInfo.name
  }
}

export default getMarketImage

