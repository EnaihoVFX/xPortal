import { useState, useEffect, createContext, useContext } from 'react'
import { authService } from '../services/auth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      const session = await authService.getSession()
      if (session) {
        setUser(session.user)
        setWallet(session.wallet)
        setIsAuthenticated(true)
      }
      setLoading(false)
    }
    checkSession()
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const result = await authService.login(email, password)
      if (result.success) {
        setUser(result.data.user)
        setWallet(result.data.wallet)
        setIsAuthenticated(true)
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (email, password) => {
    setLoading(true)
    try {
      const result = await authService.register(email, password)
      if (result.success) {
        setUser(result.data.user)
        setWallet(result.data.wallet)
        setIsAuthenticated(true)
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setWallet(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{
      user,
      wallet,
      loading,
      isAuthenticated,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Hook that combines auth with Web3
export const useEmbeddedWallet = () => {
  const { wallet, isAuthenticated } = useAuth()
  const [signer, setSigner] = useState(null)
  const [provider, setProvider] = useState(null)

  useEffect(() => {
    const setupWallet = async () => {
      if (wallet && isAuthenticated) {
        try {
          // Create a provider for the embedded wallet
          const { ethers } = await import('ethers')
          
          // Use JSON-RPC provider for Arc Testnet
          const rpcProvider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network')
          const walletSigner = new ethers.Wallet(wallet.privateKey, rpcProvider)
          
          setProvider(rpcProvider)
          setSigner(walletSigner)
        } catch (error) {
          console.error('Error setting up wallet:', error)
        }
      } else {
        setSigner(null)
        setProvider(null)
      }
    }
    
    setupWallet()
  }, [wallet, isAuthenticated])

  return {
    wallet,
    signer,
    provider,
    address: wallet?.address,
    isConnected: !!wallet && !!signer
  }
}

