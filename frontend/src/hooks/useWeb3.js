import { useState, useEffect } from 'react'
import { connectWallet, getProvider } from '../utils/web3'

export const useWeb3 = () => {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [chainId, setChainId] = useState(null)

  const connect = async () => {
    setIsConnecting(true)
    setError(null)
    try {
      const { provider: prov, signer: sig, address } = await connectWallet()
      setProvider(prov)
      setSigner(sig)
      setAccount(address)
      
      // Get chain ID
      const network = await prov.getNetwork()
      setChainId(network.chainId.toString())
      
      // Listen for account changes
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0])
          } else {
            setAccount(null)
            setSigner(null)
          }
        })
        
        window.ethereum.on('chainChanged', () => {
          window.location.reload()
        })
      }
    } catch (err) {
      setError(err.message)
      console.error('Connection error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setAccount(null)
    setProvider(null)
    setSigner(null)
    setChainId(null)
  }

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          if (accounts.length > 0) {
            const prov = getProvider()
            if (prov) {
              const sig = await prov.getSigner()
              const network = await prov.getNetwork()
              setProvider(prov)
              setSigner(sig)
              setAccount(accounts[0])
              setChainId(network.chainId.toString())
            }
          }
        } catch (err) {
          console.error('Error checking connection:', err)
        }
      }
    }
    
    checkConnection()
  }, [])

  return {
    account,
    provider,
    signer,
    isConnecting,
    error,
    chainId,
    connect,
    disconnect,
    isConnected: !!account && !!signer
  }
}


