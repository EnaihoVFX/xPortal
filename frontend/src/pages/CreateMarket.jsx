import React, { useState } from 'react'
import { useAuth, useEmbeddedWallet } from '../hooks/useAuth'
import { useMarkets } from '../hooks/useMarkets'
import { formatAddress } from '../utils/web3'
import Header from '../components/Header'
import './CreateMarket.css'

const CATEGORIES = ['Politics', 'Sports', 'Crypto', 'Economics', 'Technology', 'Entertainment', 'Weather', 'Other']
const CATEGORY_VALUES = [0, 1, 2, 3, 4, 5, 6, 7]

function CreateMarket() {
  const { user, logout } = useAuth()
  const { signer, address, isConnected } = useEmbeddedWallet()
  const { usdcBalance, loading, createMarket, loadMarketCount } = useMarkets(signer)

  const [question, setQuestion] = useState('')
  const [description, setDescription] = useState('')
  const [outcomes, setOutcomes] = useState(['Yes', 'No'])
  const [duration, setDuration] = useState(7) // days
  const [category, setCategory] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAddOutcome = () => {
    if (outcomes.length < 10) {
      setOutcomes([...outcomes, ''])
    }
  }

  const handleRemoveOutcome = (index) => {
    if (outcomes.length > 2) {
      setOutcomes(outcomes.filter((_, i) => i !== index))
    }
  }

  const handleOutcomeChange = (index, value) => {
    const newOutcomes = [...outcomes]
    newOutcomes[index] = value
    setOutcomes(newOutcomes)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!question.trim()) {
      setError('Question is required')
      return
    }

    if (outcomes.some(o => !o.trim())) {
      setError('All outcomes must have values')
      return
    }

    if (outcomes.length < 2) {
      setError('At least 2 outcomes are required')
      return
    }

    try {
      const durationSeconds = duration * 24 * 60 * 60
      const txHash = await createMarket(question, description, outcomes, durationSeconds, category)
      setSuccess(`Market created! Transaction: ${txHash}`)
      setQuestion('')
      setDescription('')
      setOutcomes(['Yes', 'No'])
      setDuration(7)
      await loadMarketCount()
      setTimeout(() => {
        window.location.href = '/markets'
      }, 2000)
    } catch (error) {
      setError(error.message || 'Failed to create market')
    }
  }

  if (!isConnected) {
    return (
      <div className="create-market-page">
        <div className="loading">Loading your wallet...</div>
      </div>
    )
  }

  return (
    <div className="create-market-page">
      <Header />
      <div className="create-market-page-header">
        <h1>Create Market</h1>
      </div>

      <div className="create-market-content">
        <form onSubmit={handleSubmit} className="create-market-form">
          <div className="form-section">
            <label>Question *</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Will Bitcoin reach $100k by end of 2024?"
              className="form-input"
              required
            />
          </div>

          <div className="form-section">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context about this market..."
              className="form-textarea"
              rows="4"
            />
          </div>

          <div className="form-section">
            <label>Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(Number(e.target.value))}
              className="form-select"
              required
            >
              {CATEGORIES.map((cat, idx) => (
                <option key={idx} value={CATEGORY_VALUES[idx]}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <label>Duration (days) *</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min="1"
              max="365"
              className="form-input"
              required
            />
          </div>

          <div className="form-section">
            <div className="outcomes-header">
              <label>Outcomes *</label>
              {outcomes.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddOutcome}
                  className="add-outcome-btn"
                >
                  + Add Outcome
                </button>
              )}
            </div>
            {outcomes.map((outcome, index) => (
              <div key={index} className="outcome-input-group">
                <input
                  type="text"
                  value={outcome}
                  onChange={(e) => handleOutcomeChange(index, e.target.value)}
                  placeholder={`Outcome ${index + 1}`}
                  className="form-input outcome-input"
                  required
                />
                {outcomes.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOutcome(index)}
                    className="remove-outcome-btn"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? 'Creating...' : 'Create Market'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateMarket

