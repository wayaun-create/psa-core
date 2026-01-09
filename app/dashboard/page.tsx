'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface TaxSale {
  tax_sale_id: number
  tax_sale_name: string
  sale_date: string
  county: string
  status: string
}

interface ClientInfo {
  client_name: string
  email: string
  phone: string
  business_type: string
}

export default function Dashboard() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState('')
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null)
  const [activeTaxSales, setActiveTaxSales] = useState<TaxSale[]>([])
  const [completedTaxSales, setCompletedTaxSales] = useState<TaxSale[]>([])
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [loading, setLoading] = useState(true)
  const [chatMinimized, setChatMinimized] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { text: "Hi! I'm your parcel assistant. Ask me anything about parcels, tax sales, or legal questions.", isUser: false }
  ])
  const [chatLoading, setChatLoading] = useState(false)

  const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? window.location.origin
    : 'https://psa-core-api.onrender.com'

  useEffect(() => {
    const acctId = localStorage.getItem('acct_id')
    if (!acctId) {
      router.push('/')
      return
    }
    loadDashboard(acctId)
  }, [router])

  const loadDashboard = async (acctId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/account/${acctId}`)
      const data = await response.json()

      if (data.success) {
        setUserInfo(`You are logged in as: ${data.client.client_name}`)
        setClientInfo(data.client)
        await loadTaxSales(acctId)
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setLoading(false)
    }
  }

  const loadTaxSales = async (acctId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/tax-sales/${acctId}`)
      const data = await response.json()

      if (data.success) {
        const active = data.taxSales.filter((ts: TaxSale) => ts.status?.toLowerCase() !== 'completed')
        const completed = data.taxSales.filter((ts: TaxSale) => ts.status?.toLowerCase() === 'completed')
        setActiveTaxSales(active)
        setCompletedTaxSales(completed)
      }
    } catch (error) {
      console.error('Error loading tax sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('acct_id')
    router.push('/')
  }

  const sendMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage = chatInput
    setChatMessages(prev => [...prev, { text: userMessage, isUser: true }])
    setChatInput('')
    setChatLoading(true)

    try {
      const acctId = localStorage.getItem('acct_id')
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, acct_id: acctId })
      })

      const data = await response.json()
      
      if (data.success) {
        setChatMessages(prev => [...prev, { text: data.response, isUser: false }])
      } else {
        setChatMessages(prev => [...prev, { text: 'Sorry, I encountered an error. Please try again.', isUser: false }])
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { text: "Sorry, I couldn't process your request. Please try again.", isUser: false }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif', background: '#f3f4f6', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
        <h1 style={{ fontSize: '1.75rem' }}>🚀 PSA Core Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/wilbur" style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600, textDecoration: 'none' }}>⚖️ Ask WilburAI</Link>
          <button onClick={logout} style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '2px solid white', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        {/* Welcome Section */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '30px' }}>
          <h2 style={{ color: '#333', marginBottom: '10px' }}>Welcome back! 👋</h2>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>{loading ? 'Loading your account information...' : userInfo}</p>
          
          <div style={{ marginTop: '20px' }}>
            <Link href="/wilbur" style={{ display: 'block', background: '#f9fafb', border: '2px solid #e5e7eb', borderLeft: '4px solid #2563eb', padding: '20px', borderRadius: '8px', textDecoration: 'none', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚖️</div>
              <h3 style={{ color: '#111827', marginBottom: '4px' }}>WilburAI Legal Assistant</h3>
              <p style={{ color: '#6b7280', margin: 0 }}>Get answers to legal questions about tax sales</p>
            </Link>
          </div>
        </div>

        {/* Client Info */}
        {clientInfo && (
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '30px' }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Client Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div><strong style={{ color: '#6b7280', fontSize: '0.875rem' }}>NAME</strong><p style={{ color: '#111827', marginTop: '4px' }}>{clientInfo.client_name}</p></div>
              <div><strong style={{ color: '#6b7280', fontSize: '0.875rem' }}>EMAIL</strong><p style={{ color: '#111827', marginTop: '4px' }}>{clientInfo.email}</p></div>
              {clientInfo.phone && <div><strong style={{ color: '#6b7280', fontSize: '0.875rem' }}>PHONE</strong><p style={{ color: '#111827', marginTop: '4px' }}>{clientInfo.phone}</p></div>}
              {clientInfo.business_type && <div><strong style={{ color: '#6b7280', fontSize: '0.875rem' }}>BUSINESS TYPE</strong><p style={{ color: '#111827', marginTop: '4px' }}>{clientInfo.business_type}</p></div>}
            </div>
          </div>
        )}

        {/* Tax Sales Section */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 30px' }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Tax Sales</h2>
            <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #e5e7eb' }}>
              <button onClick={() => setActiveTab('active')} style={{ padding: '12px 24px', background: 'none', border: 'none', color: activeTab === 'active' ? '#667eea' : '#6b7280', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', borderBottom: `3px solid ${activeTab === 'active' ? '#667eea' : 'transparent'}`, marginBottom: '-2px' }}>Active Tax Sales</button>
              <button onClick={() => setActiveTab('completed')} style={{ padding: '12px 24px', background: 'none', border: 'none', color: activeTab === 'completed' ? '#667eea' : '#6b7280', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', borderBottom: `3px solid ${activeTab === 'completed' ? '#667eea' : 'transparent'}`, marginBottom: '-2px' }}>Completed Tax Sales</button>
            </div>
          </div>

          <div style={{ padding: '20px 30px' }}>
            {activeTab === 'active' && (
              <div style={{ display: 'grid', gap: '12px' }}>
                {loading ? <p style={{ color: '#6b7280' }}>Loading tax sales...</p> : activeTaxSales.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📋</div>
                    <p style={{ fontSize: '1.1rem' }}>No active tax sales found</p>
                  </div>
                ) : activeTaxSales.map(ts => (
                  <Link key={ts.tax_sale_id} href={`/parcels?taxSaleId=${ts.tax_sale_id}&name=${encodeURIComponent(ts.tax_sale_name || 'Tax Sale')}`} style={{ background: '#f9fafb', border: '2px solid #e5e7eb', borderLeft: '4px solid #667eea', padding: '16px 20px', borderRadius: '8px', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}>{ts.tax_sale_name || 'Untitled Tax Sale'}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {ts.sale_date ? new Date(ts.sale_date).toLocaleDateString() : 'No date'}
                        {ts.county && ` • ${ts.county}`}
                        {ts.status && ` • ${ts.status}`}
                      </div>
                    </div>
                    <div style={{ color: '#667eea', fontSize: '1.5rem' }}>→</div>
                  </Link>
                ))}
              </div>
            )}

            {activeTab === 'completed' && (
              <div style={{ display: 'grid', gap: '12px' }}>
                {loading ? <p style={{ color: '#6b7280' }}>Loading tax sales...</p> : completedTaxSales.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
                    <p style={{ fontSize: '1.1rem' }}>No completed tax sales</p>
                  </div>
                ) : completedTaxSales.map(ts => (
                  <Link key={ts.tax_sale_id} href={`/parcels?taxSaleId=${ts.tax_sale_id}&name=${encodeURIComponent(ts.tax_sale_name || 'Tax Sale')}`} style={{ background: '#f9fafb', border: '2px solid #e5e7eb', borderLeft: '4px solid #10b981', padding: '16px 20px', borderRadius: '8px', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}>{ts.tax_sale_name || 'Untitled Tax Sale'}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {ts.sale_date ? new Date(ts.sale_date).toLocaleDateString() : 'No date'}
                        {ts.county && ` • ${ts.county}`}
                        {ts.status && ` • ${ts.status}`}
                      </div>
                    </div>
                    <div style={{ color: '#10b981', fontSize: '1.5rem' }}>→</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: chatMinimized ? 'auto' : '350px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)', zIndex: 1000 }}>
        <div onClick={() => setChatMinimized(!chatMinimized)} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '16px 20px', borderRadius: '12px 12px 0 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>💬 Parcel Assistant</h3>
          <button style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: 'white', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }}>{chatMinimized ? '+' : '−'}</button>
        </div>
        
        {!chatMinimized && (
          <>
            <div style={{ height: '300px', overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {chatMessages.map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: msg.isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: '12px', background: msg.isUser ? '#667eea' : '#f3f4f6', color: msg.isUser ? 'white' : '#111827' }}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
              <input 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about parcels..."
                style={{ flex: 1, padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem' }}
              />
              <button onClick={sendMessage} disabled={chatLoading} style={{ background: chatLoading ? '#9ca3af' : '#667eea', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: chatLoading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
