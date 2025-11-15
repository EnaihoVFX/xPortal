import { ethers } from 'ethers'
import { NETWORK_CONFIG } from '../config/contracts'

export const connectWallet = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      
      // Check if we're on the correct network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      
      if (chainId !== NETWORK_CONFIG.chainId) {
        // Switch to Arc Testnet
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: NETWORK_CONFIG.chainId }]
          })
        } catch (switchError) {
          // If network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [NETWORK_CONFIG]
            })
          } else {
            throw switchError
          }
        }
      }
      
      // Use ethers v6 BrowserProvider or v5 Web3Provider
      let provider
      if (ethers.BrowserProvider) {
        provider = new ethers.BrowserProvider(window.ethereum)
      } else {
        provider = new ethers.providers.Web3Provider(window.ethereum)
      }
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      
      return { provider, signer, address }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      throw error
    }
  } else {
    throw new Error('MetaMask is not installed')
  }
}

export const getProvider = () => {
  if (typeof window.ethereum !== 'undefined') {
    if (ethers.BrowserProvider) {
      return new ethers.BrowserProvider(window.ethereum)
    } else {
      return new ethers.providers.Web3Provider(window.ethereum)
    }
  }
  return null
}

export const formatAddress = (address) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const formatUSDC = (amount, decimals = 6) => {
  if (!amount || amount === '0' || amount === 0) return '0.00'
  
  try {
    // Handle BigNumber objects
    if (typeof amount === 'object' && amount.toString) {
      amount = amount.toString()
    }
    
    // Convert to string if it's a number
    const amountStr = amount.toString().trim()
    
    // Check if already formatted (contains decimal point and reasonable length)
    if (amountStr.includes('.') && amountStr.length < 20) {
      const num = parseFloat(amountStr)
      if (!isNaN(num) && isFinite(num) && num >= 0 && num < 1e12) {
        // Already formatted, just ensure 2 decimal places
        return num.toFixed(2)
      }
    }
    
    // Check if the string is too long (likely an error)
    if (amountStr.length > 50) {
      console.warn('formatUSDC: Amount string is suspiciously long:', amountStr.substring(0, 100))
      return '0.00'
    }
    
    // Handle very large numbers that might be in wrong format
    // If it's a huge number without decimals, it's likely an error
    if (!amountStr.includes('.') && amountStr.length > 20) {
      console.warn('formatUSDC: Amount appears to be in wrong format:', amountStr)
      return '0.00'
    }
    
    // Use ethers to format, but catch errors
    const formatted = ethers.formatUnits(amountStr, decimals)
    
    // Validate the result is reasonable
    const num = parseFloat(formatted)
    if (isNaN(num) || !isFinite(num) || num < 0 || num > 1e12) {
      console.warn('formatUSDC: Formatted result is not a valid number:', formatted)
      return '0.00'
    }
    
    // Format to 2 decimal places
    return num.toFixed(2)
  } catch (error) {
    console.error('formatUSDC error:', error, 'amount:', amount)
    return '0.00'
  }
}

export const parseUSDC = (amount, decimals = 6) => {
  return ethers.parseUnits(amount.toString(), decimals)
}

export const getNetworkName = (chainId) => {
  const networks = {
    '0x4D1A0A': 'Arc Testnet',
    '0x1': 'Ethereum Mainnet',
    '0x5': 'Goerli',
    '0xaa36a7': 'Sepolia'
  }
  return networks[chainId] || `Chain ${chainId}`
}

