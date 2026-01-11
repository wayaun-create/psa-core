'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Message {
  text: string
  isUser: boolean
  time: string
}

export default function Wilbur() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { 
      text: "Hello! I'm WilburAI, your legal assistant for property tax sales. I can help answer questions about tax deeds, tax liens, redemption rights, legal processes, and more. What would you like to know?", 
      isUser: false,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
  ])
  const [loading, setLoading] = useState(false)
  const [showTyping, setShowTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const API_BASE = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => {
    const acctId = localStorage.getItem('acct_id')
    if (!acctId) {
      router.push('/')
      return
    }
    inputRef.current?.focus()
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showTyping])

  const logout = () => {
    localStorage.removeItem('acct_id')
    router.push('/')
  }

  const askQuestion = (question: string) => {
    setInput(question)
    setTimeout(() => sendMessage(question), 100)
  }

  const sendMessage = async (messageText?: string) => {
    const message = (messageText || input).trim()
    if (!message) return

    const newMessage: Message = {
      text: message,
      isUser: true,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }

    setMessages(prev => [...prev, newMessage])
    setInput('')
    setLoading(true)
    setShowTyping(true)

    try {
      const acctId = localStorage.getItem('acct_id')
      const response = await fetch(`${API_BASE}/api/wilbur`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, acct_id: acctId })
      })

      const data = await response.json()
      
      setShowTyping(false)
      
      const assistantMessage: Message = {
        text: data.success ? data.response : 'Sorry, I encountered an error processing your request. Please try again.',
        isUser: false,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      setShowTyping(false)
      setMessages(prev => [...prev, {
        text: "Sorry, I couldn't connect to the server. Please try again later.",
        isUser: false,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const suggestions = [
    "What are the typical steps in a tax deed sale process?",
    "What is the difference between a tax deed and a tax lien?",
    "What are redemption rights in property tax sales?",
    "What legal documents are needed for a property tax sale?"
  ]

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif', background: '#f3f4f6', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
        <h1 style={{ fontSize: '1.75rem' }}>⚖️ WilburAI Legal Assistant</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/dashboard" style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '2px solid white', padding: '8px 20px', borderRadius: '6px', fontWeight: 600, textDecoration: 'none' }}>
            Back to Dashboard
          </Link>
          <button onClick={logout} style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '2px solid white', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
        {/* Welcome Section */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '30px' }}>
          <h2 style={{ color: '#333', marginBottom: '10px' }}>Welcome to WilburAI</h2>
          <p style={{ color: '#666', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '12px' }}>
            WilburAI is your intelligent legal assistant for property tax sales and related legal topics. 
            Ask questions about tax deed sales, tax liens, redemption rights, legal documents, and more.
          </p>

          {/* Disclaimer */}
          <div style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b', padding: '16px', borderRadius: '8px', marginTop: '20px' }}>
            <strong style={{ color: '#92400e', display: 'block', marginBottom: '8px' }}>⚠️ Legal Disclaimer</strong>
            <p style={{ color: '#78350f', fontSize: '0.95rem', margin: 0 }}>
              WilburAI provides general legal information only and does not constitute legal advice. 
              For specific legal matters, please consult with a qualified attorney in your jurisdiction.
            </p>
          </div>

          {/* Suggestions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '20px' }}>
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => askQuestion(suggestion)}
                style={{ background: '#f9fafb', border: '2px solid #e5e7eb', padding: '14px 16px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', color: '#374151', transition: 'all 0.2s' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6'
                  e.currentTarget.style.borderColor = '#2563eb'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f9fafb'
                  e.currentTarget.style.borderColor = '#e5e7eb'
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Section */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '2px solid #e5e7eb' }}>
            <h2 style={{ color: '#333', margin: 0 }}>Chat with WilburAI</h2>
          </div>

          {/* Messages */}
          <div style={{ height: '500px', overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isUser ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '75%', background: msg.isUser ? '#2563eb' : '#f3f4f6', color: msg.isUser ? 'white' : '#111827', padding: '12px 16px', borderRadius: '12px', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {msg.text}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>{msg.time}</div>
              </div>
            ))}
            
            {showTyping && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ background: '#f3f4f6', padding: '12px 16px', borderRadius: '12px', display: 'flex', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9ca3af', animation: 'bounce 1.4s infinite ease-in-out both' }}>●</span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9ca3af', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}>●</span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9ca3af', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}>●</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '20px', borderTop: '2px solid #e5e7eb', display: 'flex', gap: '12px' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a legal question about property tax sales..."
              rows={1}
              style={{ flex: 1, padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '1rem', resize: 'none', minHeight: '48px', maxHeight: '120px', fontFamily: 'inherit' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading}
              style={{ background: loading ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem' }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
