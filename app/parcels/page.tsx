'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ChatWidget from '../components/ChatWidget'

interface Parcel {
  parcel_id: string
  file__: string
  map_parcel: string
  def: string
}

function ParcelsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const taxSaleId = searchParams.get('taxSaleId')
  const taxSaleName = searchParams.get('name')
  
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [loading, setLoading] = useState(true)

  const API_BASE = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => {
    if (!taxSaleId) {
      router.push('/dashboard')
      return
    }
    loadParcels()
  }, [taxSaleId, router])

  const loadParcels = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/parcels/${taxSaleId}`)
      const data = await response.json()

      if (data.success && data.parcels) {
        setParcels(data.parcels)
      }
    } catch (error) {
      console.error('Error loading parcels:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif', background: '#f3f4f6', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
        <h1 style={{ fontSize: '1.75rem' }}>📋 Parcels</h1>
        <Link href="/dashboard" style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '2px solid white', padding: '8px 20px', borderRadius: '6px', fontWeight: 600, textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '40px auto', padding: '0 20px' }}>
        {/* Title Section */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '30px' }}>
          <h2 style={{ color: '#333', marginBottom: '5px' }}>{taxSaleName || 'Tax Sale'}</h2>
          <p style={{ color: '#6b7280', margin: 0 }}>
            {loading ? 'Loading parcels...' : `${parcels.length} parcel${parcels.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>File #</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Map/Parcel</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Defendant</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading parcels...</td>
                </tr>
              ) : parcels.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No parcels found for this tax sale</td>
                </tr>
              ) : parcels.map((parcel) => (
                <tr 
                  key={parcel.parcel_id}
                  onClick={() => router.push(`/parcel?parcelId=${parcel.parcel_id}`)}
                  style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '16px', color: '#111827' }}>{parcel.file__ || '-'}</td>
                  <td style={{ padding: '16px', color: '#111827' }}>{parcel.map_parcel || '-'}</td>
                  <td style={{ padding: '16px', color: '#111827' }}>{parcel.def || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ChatWidget initialMessage="Hi! I can help you find information about your parcels. Try asking me things like: • How many parcels are in Butts County? • Show me parcels with defendant John Smith" />
    </div>
  )
}

export default function Parcels() {
  return (
    <Suspense fallback={
      <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif', background: '#f3f4f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    }>
      <ParcelsContent />
    </Suspense>
  )
}
