// Utility to test market loading
// Run this in browser console to debug market loading

export const testMarketLoading = async (contracts, address) => {
  console.log('=== Testing Market Loading ===')
  
  if (!contracts?.marketplace) {
    console.error('❌ MarketPlace contract not initialized')
    return
  }
  
  try {
    console.log('1. Testing getMarketCount...')
    const count = await contracts.marketplace.getMarketCount()
    console.log('✅ Market count:', Number(count))
    
    if (Number(count) === 0) {
      console.warn('⚠️ No markets found on contract')
      return
    }
    
    console.log('2. Testing getMarket(1)...')
    const market1 = await contracts.marketplace.getMarket(1)
    console.log('✅ Market 1 data:', {
      question: market1[1],
      outcomes: market1[3],
      category: Number(market1[6])
    })
    
    console.log('3. Testing getAllProbabilities(1)...')
    const probs = await contracts.marketplace.getAllProbabilities(1)
    console.log('✅ Probabilities:', probs.map(p => Number(p)))
    
    console.log('4. Testing getMarketsByCategory(0)...')
    const politicsMarkets = await contracts.marketplace.getMarketsByCategory(0)
    console.log('✅ Politics markets:', politicsMarkets.map(m => Number(m)))
    
    console.log('=== All tests passed! ===')
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}


