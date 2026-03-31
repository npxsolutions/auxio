'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../../components/AppSidebar'

type ImportResult = {
  job_id: string
  total: number
  imported: number
  failed_rows: number
  errors: { row?: number; batch?: number; error: string }[]
}

export default function ImportListingsPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile]       = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult]   = useState<ImportResult | null>(null)
  const [error, setError]     = useState('')
  const [dragOver, setDragOver] = useState(false)

  function onFileChange(f: File | null) {
    if (!f) return
    if (!f.name.endsWith('.csv')) { setError('Please upload a CSV file'); return }
    setFile(f)
    setError('')
    setResult(null)
  }

  async function handleImport() {
    if (!file) return
    setImporting(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/listings/import', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) { setError(data.error || 'Import failed'); return }
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: '#f7f7f5', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px', minWidth: 0 }}>
      <div style={{ maxWidth: '680px' }}>

        <button onClick={() => router.push('/listings')} style={{ background: 'none', border: 'none', color: '#787774', fontSize: '13px', cursor: 'pointer', padding: 0, fontFamily: 'Inter, sans-serif', marginBottom: '24px' }}>
          ← Back to listings
        </button>

        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#191919', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Import listings</h1>
        <p style={{ fontSize: '13px', color: '#787774', margin: '0 0 28px' }}>Upload a CSV from Shopify, eBay, or any spreadsheet. We'll map the columns automatically.</p>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); onFileChange(e.dataTransfer.files[0]) }}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#191919' : '#d8d8d5'}`,
            borderRadius: '12px',
            padding: '48px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? '#f1f1ef' : 'white',
            transition: 'all 0.15s',
            marginBottom: '16px',
          }}
        >
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => onFileChange(e.target.files?.[0] ?? null)} />
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
          {file ? (
            <>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#191919' }}>{file.name}</div>
              <div style={{ fontSize: '12px', color: '#787774', marginTop: '4px' }}>{(file.size / 1024).toFixed(1)} KB · Click to change</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#191919', marginBottom: '4px' }}>Drop a CSV here, or click to browse</div>
              <div style={{ fontSize: '12px', color: '#9b9b98' }}>Shopify, eBay, Amazon, or any spreadsheet export</div>
            </>
          )}
        </div>

        {/* Column mapping guide */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#191919', marginBottom: '10px' }}>Recognised column names</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
            {[
              ['Title / name / product_title', 'title'],
              ['Price / sale_price', 'price'],
              ['Quantity / stock / qty', 'quantity'],
              ['SKU / item_sku', 'sku'],
              ['Barcode / EAN / UPC / GTIN', 'barcode'],
              ['Brand / vendor / manufacturer', 'brand'],
              ['Category / type / product_type', 'category'],
              ['Image / image_url / image_src', 'images (pipe-separated)'],
              ['Weight / weight_grams / weight_kg', 'weight'],
              ['Any other column', 'saved as attribute'],
            ].map(([col, field]) => (
              <div key={col} style={{ display: 'flex', gap: '8px', padding: '4px 0', borderBottom: '1px solid #f7f7f5' }}>
                <span style={{ fontSize: '11px', color: '#787774', flex: 1 }}>{col}</span>
                <span style={{ fontSize: '11px', color: '#191919', fontWeight: 600 }}>→ {field}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: '#fce8e6', color: '#c9372c', padding: '12px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ background: result.failed_rows === 0 ? '#e8f5f3' : '#fef3e2', borderRadius: '12px', border: `1px solid ${result.failed_rows === 0 ? '#b8e3dd' : '#f4d9a0'}`, padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#191919', marginBottom: '8px' }}>
              {result.failed_rows === 0 ? '✓ Import complete' : 'Import finished with errors'}
            </div>
            <div style={{ display: 'flex', gap: '24px', marginBottom: result.errors.length ? '12px' : 0 }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f7b6c' }}>{result.imported}</div>
                <div style={{ fontSize: '11px', color: '#787774' }}>imported</div>
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: result.failed_rows > 0 ? '#c9372c' : '#9b9b98' }}>{result.failed_rows}</div>
                <div style={{ fontSize: '11px', color: '#787774' }}>failed</div>
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#191919' }}>{result.total}</div>
                <div style={{ fontSize: '11px', color: '#787774' }}>total rows</div>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div style={{ fontSize: '12px', color: '#c9372c' }}>
                {result.errors.slice(0, 5).map((e, i) => (
                  <div key={i}>{e.row ? `Row ${e.row}` : `Batch ${e.batch}`}: {e.error}</div>
                ))}
                {result.errors.length > 5 && <div>...and {result.errors.length - 5} more errors</div>}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            style={{ flex: 1, padding: '13px', background: file && !importing ? '#191919' : '#e8e8e5', color: file && !importing ? 'white' : '#9b9b98', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: file && !importing ? 'pointer' : 'default', fontFamily: 'Inter, sans-serif' }}
          >
            {importing ? 'Importing...' : 'Import listings'}
          </button>
          {result && (
            <button
              onClick={() => router.push('/listings')}
              style={{ padding: '13px 20px', background: 'white', color: '#191919', border: '1px solid #e8e8e5', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              View listings →
            </button>
          )}
        </div>
      </div>
      </main>
    </div>
  )
}
