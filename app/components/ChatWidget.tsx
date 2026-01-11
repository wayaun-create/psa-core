'use client'

import { useState } from 'react'

interface Message {
  text: string
  isUser: boolean
}

interface ChatWidgetProps {
  initialMessage?: string
}

export default function ChatWidget({ initialMessage = "Hi! I can help you find information about your parcels." }: ChatWidgetProps) {
  const [minimized, setMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { text: initialMessage, isUser: false }
  ])
  const [loading, setLoading] = useState(false)

  const API_BASE = typeof window !== 'undefined' ? window.location.origin : ''

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = input
    setMessages(prev => [...prev, { text: userMessage, isUser: true }])
    setInput('')
    setLoading(true)

    try {
      const acctId = localStorage.getItem('acct_id')
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, acct_id: acctId })
      })

      const data = await response.json()
      
      if (data.success) {
        setMessages(prev => [...prev, { text: data.response, isUser: false }])
      } else {
        setMessages(prev => [...prev, { text: 'Sorry, I encountered an error. Please try again.', isUser: false }])
      }
    } catch (error) {
      setMessages(prev => [...prev, { text: "Sorry, I couldn't process your request. Please try again.", isUser: false }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: minimized ? 'auto' : '350px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)', zIndex: 1000 }}>
      <div onClick={() => setMinimized(!minimized)} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '16px 20px', borderRadius: '12px 12px 0 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>💬 Parcel Assistant</h3>
        <button style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: 'white', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }}>{minimized ? '+' : '−'}</button>
      </div>
      
      {!minimized && (
        <>
          <div style={{ height: '300px', overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: msg.isUser ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: '12px', background: msg.isUser ? '#667eea' : '#f3f4f6', color: msg.isUser ? 'white' : '#111827' }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about your parcels..."
              style={{ flex: 1, padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem' }}
            />
            <button onClick={sendMessage} disabled={loading} style={{ background: loading ? '#9ca3af' : '#667eea', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
              Send
            </button>
          </div>
        </>
      )}
    </div>
  )
}
