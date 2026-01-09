'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ChatWidget from '../components/ChatWidget'

interface ParcelData {
  [key: string]: any
}

export default function ParcelDetail() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const parcelId = searchParams.get('parcelId')
  
  const [parcel, setParcel] = useState<ParcelData | null>(null)
  const [loading, setLoading] = useState(true)

  const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? window.location.origin
    : 'https://psa-core-api.onrender.com'

  useEffect(() => {
    if (!parcelId) {
      router.push('/dashboard')
      return
    }
    loadParcel()
  }, [parcelId, router])

  const loadParcel = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/parcel/${parcelId}`)
      const data = await response.json()

      if (data.success && data.parcel) {
        setParcel(data.parcel)
      }
    } catch (error) {
      console.error('Error loading parcel:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatFieldName = (fieldName: string) => {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim()
  }

  const renderField = (key: string, value: any) => {
    if (!value) return null
    return (
      <div key={key} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '15px', marginBottom: '15px', alignItems: 'start' }}>
        <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 500, textTransform: 'uppercase' }}>
          {formatFieldName(key)}
        </div>
        <div style={{ color: '#111827', fontSize: '0.95rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
          {value}
        </div>
      </div>
    )
  }

  const categorizeFields = (parcel: ParcelData) => {
    const categories: any = {
      parcelDetails: {},
      propertyDescription: {},
      notes: {},
      interestedParties: {},
      mortgageHolders: {},
      lienIndex: {},
      bankruptcy: {}
    }

    for (const [key, value] of Object.entries(parcel)) {
      if (value === null || value === '') continue
      
      const keyLower = key.toLowerCase()
      
      if (keyLower === 'file__' || keyLower === 'map_parcel' || keyLower === 'years_due' || keyLower === 'def') {
        categories.parcelDetails[key] = value
      } else if (keyLower.includes('villa') || keyLower === 'legal' || keyLower === 'property_description') {
        categories.propertyDescription[key] = value
      } else if (keyLower === 'notes') {
        categories.notes[key] = value
      } else if (keyLower.includes('def') || keyLower.includes('occ') || keyLower.includes('m1') || keyLower.includes('m2')) {
        categories.interestedParties[key] = value
      } else if (keyLower.includes('mh') || keyLower.includes('mortgage')) {
        categories.mortgageHolders[key] = value
      } else if (keyLower.includes('lien')) {
        categories.lienIndex[key] = value
      } else if (keyLower.includes('bank') || keyLower.includes('probate')) {
        categories.bankruptcy[key] = value
      } else {
        categories.parcelDetails[key] = value
      }
    }

    return categories
  }

  if (loading) {
    return (
      <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif', background: '#f5f5f5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: '#6b7280' }}>Loading parcel details...</div>
      </div>
    )
  }

  if (!parcel) {
    return (
      <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif', background: '#f5f5f5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: '#ef4444' }}>Parcel not found</div>
      </div>
    )
  }

  const categories = categorizeFields(parcel)

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
        <h1 style={{ fontSize: '1.75rem' }}>📄 Parcel Details</h1>
        <button onClick={() => router.back()} style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '2px solid white', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
          ← Back
        </button>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '20px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Parcel Details Section */}
          <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ background: '#f8f9fa', borderBottom: '1px solid #e0e0e0', padding: '12px 20px', fontWeight: 600, fontSize: '0.875rem', color: '#333', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Parcel Details
            </div>
            <div style={{ padding: '20px' }}>
              {Object.entries(categories.parcelDetails).map(([k, v]) => renderField(k, v))}
              {Object.keys(categories.parcelDetails).length === 0 && <div style={{ color: '#6b7280' }}>No parcel details available</div>}
            </div>
          </div>

          {/* Property Description Section */}
          {Object.keys(categories.propertyDescription).length > 0 && (
            <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ background: '#f8f9fa', borderBottom: '1px solid #e0e0e0', padding: '12px 20px', fontWeight: 600, fontSize: '0.875rem', color: '#333', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Property Description
              </div>
              <div style={{ padding: '20px' }}>
                {Object.entries(categories.propertyDescription).map(([k, v]) => renderField(k, v))}
              </div>
            </div>
          )}

          {/* Notes Section */}
          {Object.keys(categories.notes).length > 0 && (
            <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ background: '#f8f9fa', borderBottom: '1px solid #e0e0e0', padding: '12px 20px', fontWeight: 600, fontSize: '0.875rem', color: '#333', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Notes
              </div>
              <div style={{ padding: '20px' }}>
                {Object.entries(categories.notes).map(([k, v]) => renderField(k, v))}
              </div>
            </div>
          )}

          {/* Subsections Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {Object.keys(categories.interestedParties).length > 0 && (
              <div style={{ background: '#fafafa', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#667eea', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  Interested Parties
                </div>
                {Object.entries(categories.interestedParties).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 500, textTransform: 'uppercase' }}>{formatFieldName(k)}</div>
                    <div style={{ color: '#111827', fontSize: '0.95rem' }}>{String(v)}</div>
                  </div>
                ))}
              </div>
            )}

            {Object.keys(categories.mortgageHolders).length > 0 && (
              <div style={{ background: '#fafafa', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#667eea', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  Mortgage Holders
                </div>
                {Object.entries(categories.mortgageHolders).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 500, textTransform: 'uppercase' }}>{formatFieldName(k)}</div>
                    <div style={{ color: '#111827', fontSize: '0.95rem' }}>{String(v)}</div>
                  </div>
                ))}
              </div>
            )}

            {Object.keys(categories.lienIndex).length > 0 && (
              <div style={{ background: '#fafafa', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#667eea', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  Lien Index
                </div>
                {Object.entries(categories.lienIndex).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 500, textTransform: 'uppercase' }}>{formatFieldName(k)}</div>
                    <div style={{ color: '#111827', fontSize: '0.95rem' }}>{String(v)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bankruptcy and Probate */}
          {Object.keys(categories.bankruptcy).length > 0 && (
            <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ background: '#f8f9fa', borderBottom: '1px solid #e0e0e0', padding: '12px 20px', fontWeight: 600, fontSize: '0.875rem', color: '#333', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Bankruptcy and Probate
              </div>
              <div style={{ padding: '20px' }}>
                {Object.entries(categories.bankruptcy).map(([k, v]) => renderField(k, v))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ChatWidget />
    </div>
  )
}
