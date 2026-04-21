'use client'

import { useEffect, useState, useCallback } from 'react'
import AppSidebar from '../components/AppSidebar'

interface LookupTable { id: string; name: string; description: string | null; row_count: number; created_at: string; updated_at: string }
interface LookupRow   { id: string; match_value: string; output_value: string; position: number }

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px',
  border: '1px solid #e8e8e5', borderRadius: 7,
  fontSize: 13, fontFamily: 'Inter, -apple-system, sans-serif',
  color: '#191919', background: 'white', outline: 'none', boxSizing: 'border-box',
}

export default function LookupTablesPage() {
  const [tables,      setTables]      = useState<LookupTable[]>([])
  const [selected,    setSelected]    = useState<LookupTable | null>(null)
  const [rows,        setRows]        = useState<LookupRow[]>([])
  const [loading,     setLoading]     = useState(true)
  const [rowLoading,  setRowLoading]  = useState(false)
  const [toast,       setToast]       = useState('')
  const [showCreate,  setShowCreate]  = useState(false)
  const [newName,     setNewName]     = useState('')
  const [newDesc,     setNewDesc]     = useState('')
  const [creating,    setCreating]    = useState(false)
  const [pasteText,   setPasteText]   = useState('')
  const [showPaste,   setShowPaste]   = useState(false)
  const [editRow,     setEditRow]     = useState<LookupRow | null>(null)
  const [newRow,      setNewRow]      = useState({ match: '', output: '' })
  const [showAddRow,  setShowAddRow]  = useState(false)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const loadTables = useCallback(() => {
    setLoading(true)
    fetch('/api/lookup-tables')
      .then(r => r.json())
      .then(d => setTables(d.tables || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadTables() }, [loadTables])

  async function selectTable(t: LookupTable) {
    setSelected(t)
    setRowLoading(true)
    setShowPaste(false)
    setShowAddRow(false)
    try {
      const res  = await fetch(`/api/lookup-tables?table_id=${t.id}`)
      const json = await res.json()
      setRows(json.rows || [])
    } finally { setRowLoading(false) }
  }

  async function createTable() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res  = await fetch('/api/lookup-tables', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName, description: newDesc }) })
      const json = await res.json()
      if (!res.ok) { showToast(json.error || 'Failed'); return }
      setTables(prev => [{ ...json.table, row_count: 0 }, ...prev])
      setNewName(''); setNewDesc(''); setShowCreate(false)
      showToast('Table created')
      await selectTable({ ...json.table, row_count: 0 })
    } finally { setCreating(false) }
  }

  async function deleteTable(t: LookupTable) {
    if (!confirm(`Delete "${t.name}" and all its rows?`)) return
    const res = await fetch('/api/lookup-tables', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table_id: t.id }) })
    if (res.ok) { setTables(prev => prev.filter(x => x.id !== t.id)); if (selected?.id === t.id) { setSelected(null); setRows([]) } }
    else showToast('Delete failed')
  }

  async function addSingleRow() {
    if (!selected || !newRow.match) return
    const res  = await fetch('/api/lookup-tables', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table_id: selected.id, rows: [{ match_value: newRow.match, output_value: newRow.output }] }) })
    const json = await res.json()
    if (!res.ok) { showToast(json.error || 'Failed'); return }
    setNewRow({ match: '', output: '' }); setShowAddRow(false)
    await selectTable(selected)
    setTables(prev => prev.map(t => t.id === selected.id ? { ...t, row_count: t.row_count + 1 } : t))
    showToast('Row added')
  }

  async function importPaste() {
    if (!selected || !pasteText.trim()) return
    const parsed = pasteText.trim().split('\n').map(line => {
      const [match_value, ...rest] = line.split('\t')
      const output_value = rest.join('\t') || ''
      return { match_value: match_value.trim(), output_value: output_value.trim() }
    }).filter(r => r.match_value)

    if (!parsed.length) { showToast('No valid rows found — use tab-separated values'); return }

    const res  = await fetch('/api/lookup-tables', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table_id: selected.id, rows: parsed }) })
    const json = await res.json()
    if (!res.ok) { showToast(json.error || 'Import failed'); return }
    setPasteText(''); setShowPaste(false)
    await selectTable(selected)
    setTables(prev => prev.map(t => t.id === selected.id ? { ...t, row_count: t.row_count + json.added } : t))
    showToast(`${json.added} rows imported`)
  }

  async function deleteRow(rowId: string) {
    if (!selected) return
    const res = await fetch('/api/lookup-tables', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ row_id: rowId }) })
    if (res.ok) {
      setRows(prev => prev.filter(r => r.id !== rowId))
      setTables(prev => prev.map(t => t.id === selected.id ? { ...t, row_count: t.row_count - 1 } : t))
    }
  }

  async function saveRowEdit() {
    if (!editRow) return
    const res  = await fetch('/api/lookup-tables', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ row_id: editRow.id, match_value: editRow.match_value, output_value: editRow.output_value }) })
    const json = await res.json()
    if (res.ok) { setRows(prev => prev.map(r => r.id === editRow.id ? json.row : r)); setEditRow(null); showToast('Row updated') }
    else showToast('Update failed')
  }

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: '#f8f4ec', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#191919', color: 'white', padding: '11px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 300, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>{toast}</div>
      )}

      <main style={{ marginLeft: 220, flex: 1, padding: '32px 40px' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#191919', letterSpacing: '-0.02em', margin: 0, marginBottom: 4 }}>Lookup Tables</h1>
            <p style={{ fontSize: 13, color: '#787774', margin: 0 }}>Bulk value maps used in feed rules — brand normalisation, category mapping, condition codes</p>
          </div>
          <button onClick={() => setShowCreate(true)} style={{ background: '#191919', color: 'white', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 400, lineHeight: 1 }}>+</span> New table
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: 10, padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#191919', marginBottom: 16 }}>Create lookup table</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Name *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Brand normalisation" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Description</label>
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Optional description" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={createTable} disabled={creating || !newName.trim()} style={{ background: '#191919', color: 'white', border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: creating ? 'wait' : 'pointer', fontFamily: 'Inter, -apple-system, sans-serif', opacity: !newName.trim() ? 0.5 : 1 }}>
                {creating ? 'Creating…' : 'Create'}
              </button>
              <button onClick={() => { setShowCreate(false); setNewName(''); setNewDesc('') }} style={{ background: 'none', color: '#787774', border: '1px solid #e8e8e5', borderRadius: 7, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif' }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, alignItems: 'start' }}>

          {/* Table list */}
          <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: 10, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#b8b8b5', fontSize: 13 }}>Loading…</div>
            ) : tables.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#b8b8b5', fontSize: 13 }}>
                No lookup tables yet.<br />Create one to get started.
              </div>
            ) : (
              tables.map((t, i) => (
                <div key={t.id} onClick={() => selectTable(t)} style={{
                  padding: '12px 16px', cursor: 'pointer',
                  background: selected?.id === t.id ? '#f8f4ec' : 'white',
                  borderBottom: i < tables.length - 1 ? '1px solid #f8f4ec' : 'none',
                  transition: 'background 0.1s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 13, fontWeight: selected?.id === t.id ? 600 : 500, color: '#191919', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{t.name}</div>
                    <button onClick={e => { e.stopPropagation(); deleteTable(t) }} style={{ background: 'none', border: 'none', color: '#d0d0cc', cursor: 'pointer', fontSize: 14, padding: '0 4px', flexShrink: 0 }}>×</button>
                  </div>
                  <div style={{ fontSize: 11, color: '#b8b8b5', marginTop: 2 }}>{t.row_count} row{t.row_count !== 1 ? 's' : ''}</div>
                </div>
              ))
            )}
          </div>

          {/* Table detail */}
          {!selected ? (
            <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: 10, padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#191919', marginBottom: 6 }}>Select a table</div>
              <div style={{ fontSize: 13, color: '#9b9b98' }}>Click a lookup table on the left to view and edit its rows</div>
            </div>
          ) : (
            <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: 10, overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f1ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>{selected.name}</div>
                  {selected.description && <div style={{ fontSize: 12, color: '#9b9b98', marginTop: 2 }}>{selected.description}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setShowPaste(!showPaste); setShowAddRow(false) }} style={{ background: '#f8f4ec', color: '#191919', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif' }}>
                    Import (paste)
                  </button>
                  <button onClick={() => { setShowAddRow(!showAddRow); setShowPaste(false) }} style={{ background: '#191919', color: 'white', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif' }}>
                    + Add row
                  </button>
                </div>
              </div>

              {/* Paste import */}
              {showPaste && (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f1ef', background: '#fafaf8' }}>
                  <div style={{ fontSize: 12, color: '#787774', marginBottom: 8 }}>
                    Paste tab-separated values (two columns: <strong>match value</strong> → <strong>output value</strong>). One row per line. Works with Excel/Sheets paste.
                  </div>
                  <textarea
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    placeholder={"Nike\tNIKE\nAdidas\tADIDAS\nPuma\tPUMA"}
                    rows={6}
                    style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={importPaste} style={{ background: '#191919', color: 'white', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif' }}>Import {pasteText.trim().split('\n').filter(l => l.trim()).length} rows</button>
                    <button onClick={() => { setShowPaste(false); setPasteText('') }} style={{ background: 'none', color: '#787774', border: '1px solid #e8e8e5', borderRadius: 6, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif' }}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Add single row */}
              {showAddRow && (
                <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f1ef', background: '#fafaf8', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={newRow.match} onChange={e => setNewRow(p => ({ ...p, match: e.target.value }))} placeholder="Match value…" style={{ ...inputStyle, flex: 1 }} onKeyDown={e => e.key === 'Enter' && addSingleRow()} />
                  <span style={{ color: '#b8b8b5', flexShrink: 0 }}>→</span>
                  <input value={newRow.output} onChange={e => setNewRow(p => ({ ...p, output: e.target.value }))} placeholder="Output value…" style={{ ...inputStyle, flex: 1 }} onKeyDown={e => e.key === 'Enter' && addSingleRow()} />
                  <button onClick={addSingleRow} style={{ background: '#191919', color: 'white', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif', flexShrink: 0 }}>Add</button>
                </div>
              )}

              {/* Rows */}
              {rowLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#b8b8b5', fontSize: 13 }}>Loading rows…</div>
              ) : rows.length === 0 ? (
                <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#9b9b98', marginBottom: 8 }}>No rows yet</div>
                  <div style={{ fontSize: 12, color: '#b8b8b5' }}>Add rows manually or paste from a spreadsheet</div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', background: '#f9f9f7', borderBottom: '1px solid #ededea' }}>
                    {['Match value', 'Output value', ''].map((h, i) => (
                      <div key={i} style={{ padding: '8px 16px', fontSize: 10, fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
                    ))}
                  </div>
                  <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                    {rows.map((row, i) => (
                      <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', borderBottom: i < rows.length - 1 ? '1px solid #f8f4ec' : 'none' }}>
                        {editRow?.id === row.id ? (
                          <>
                            <div style={{ padding: '8px 12px' }}>
                              <input value={editRow.match_value} onChange={e => setEditRow(p => ({ ...p!, match_value: e.target.value }))} style={{ ...inputStyle, fontSize: 12 }} />
                            </div>
                            <div style={{ padding: '8px 12px' }}>
                              <input value={editRow.output_value} onChange={e => setEditRow(p => ({ ...p!, output_value: e.target.value }))} style={{ ...inputStyle, fontSize: 12 }} onKeyDown={e => e.key === 'Enter' && saveRowEdit()} />
                            </div>
                            <div style={{ padding: '8px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
                              <button onClick={saveRowEdit} style={{ background: '#191919', color: 'white', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif' }}>Save</button>
                              <button onClick={() => setEditRow(null)} style={{ background: 'none', color: '#9b9b98', border: '1px solid #e8e8e5', borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'Inter, -apple-system, sans-serif' }}>×</button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ padding: '10px 16px', fontSize: 12, color: '#191919', display: 'flex', alignItems: 'center' }}>{row.match_value}</div>
                            <div style={{ padding: '10px 16px', fontSize: 12, color: '#787774', display: 'flex', alignItems: 'center' }}>{row.output_value}</div>
                            <div style={{ padding: '10px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
                              <button onClick={() => setEditRow(row)} style={{ background: 'none', border: 'none', color: '#b8b8b5', cursor: 'pointer', fontSize: 11, padding: '3px 6px', borderRadius: 4 }}>Edit</button>
                              <button onClick={() => deleteRow(row.id)} style={{ background: 'none', border: 'none', color: '#d0d0cc', cursor: 'pointer', fontSize: 14, padding: '3px 4px' }}>×</button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f1ef', fontSize: 11, color: '#b8b8b5' }}>
                    {rows.length} row{rows.length !== 1 ? 's' : ''}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
