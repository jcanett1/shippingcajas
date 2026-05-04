import { useState, useEffect, useCallback } from 'react'
import { supabase, type Shipment } from './lib/supabase'
import { useScale } from './hooks/useScale'
import { Toaster, toast } from 'sonner'
import {
  Package, Scale, Usb, RefreshCw, Send, Trash2,
  ChevronDown, Wifi, WifiOff, Loader2, AlertCircle, ClipboardList
} from 'lucide-react'

const BOX_TYPES = [
  '14 CLUN BOX',
  '24 DOZEN GOLF BALL BOX',
  '6 DOZEN GOLF BALL BOX',
  'BUCKET HAT BOX',
  'FEDEX PAK ( FEDEX ONE RATE )',
  'FULL BAG BOX',
  '10 X 10 X 6 BOX',
  'IRON BOX',
  'PUTTER BOX',
  'SINGLE IRON BOX',
  'SINGLE WOOD BOX',
  'WOODS BOX',
  'CUSTOM BOX',
] as const

const CUSTOM_BOX_TYPES = [
  'ULINE BOX - 8X6X6',
  'ULINE BOX - 27X21X18',
  'ULINE BOX - 15X7X11',
  'HAT BOX - 10X10X6',
  'BUCKET HAT BOX - 16X12X6',
  'BAG BOX - 36X15X11',
  'BAG BOX - 36X17X11',
  'BAG BOX - 36X13X11',
  'BAG BOX - 35X12X9',
  'BAG BOX - 36X19X12',
] as const

const inputStyle: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 12px', borderRadius: 8,
  border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)',
  color: 'var(--text)', fontSize: 13, outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s', fontFamily: "'Inter', sans-serif",
}
const iconBtnStyle: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 8, border: '1px solid var(--border)',
  backgroundColor: 'transparent', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s',
}
const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em',
  textTransform: 'uppercase', display: 'block', marginBottom: 6,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={labelStyle}>{label}</label>{children}</div>
}

export default function App() {
  const [shipment, setShipment] = useState('')
  const [boxType, setBoxType] = useState('')
  const [customBox, setCustomBox] = useState('')
  const [manualWeight, setManualWeight] = useState('')
  const [comments, setComments] = useState('')
  const [saving, setSaving] = useState(false)
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loadingList, setLoadingList] = useState(true)

  const scale = useScale()
  const effectiveWeight = scale.status === 'connected' ? scale.weight : manualWeight

  const fetchShipments = useCallback(async () => {
    setLoadingList(true)
    const { data, error } = await supabase.from('shipments').select('*').order('created_at', { ascending: false })
    if (error) toast.error('Error al cargar historial', { description: error.message })
    else setShipments(data || [])
    setLoadingList(false)
  }, [])

  useEffect(() => { fetchShipments() }, [fetchShipments])

  const handleSubmit = async () => {
    if (!shipment.trim()) { toast.error('El campo SHIPMENT es requerido'); return }
    if (!boxType) { toast.error('Selecciona un tipo de CAJA'); return }
    if (boxType === 'CUSTOM BOX' && !customBox) { toast.error('Selecciona el tipo de CUSTOM BOX'); return }
    setSaving(true)
    const { error } = await supabase.from('shipments').insert([{
      shipment: shipment.trim(),
      box_type: boxType === 'CUSTOM BOX' ? `CUSTOM BOX - ${customBox}` : boxType,
      custom_box: boxType === 'CUSTOM BOX' ? customBox : null,
      weight: effectiveWeight ? parseFloat(effectiveWeight) : null,
      comments: comments.trim() || null,
    }])
    if (error) toast.error('Error al guardar', { description: error.message })
    else {
      toast.success('Envio registrado exitosamente', { description: `Shipment "${shipment}" guardado.` })
      setShipment(''); setBoxType(''); setCustomBox(''); setManualWeight(''); setComments('')
      fetchShipments()
    }
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('shipments').delete().eq('id', id)
    if (error) toast.error('Error al eliminar', { description: error.message })
    else { toast.success('Registro eliminado'); fetchShipments() }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

  const scaleStatusColor = { disconnected: '#6b6b8a', connecting: '#fbbf24', connected: '#34d399', error: '#f87171' }[scale.status]
  const scaleStatusLabel = { disconnected: 'Sin conexion', connecting: 'Conectando...', connected: 'Bascula conectada', error: 'Error de conexion' }[scale.status]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Toaster theme="dark" position="top-right" richColors />

      <header style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(17,17,24,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={18} color="#6366f1" />
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.3px' }}>SHIPPING SYSTEM</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Gestion de Envios</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: scaleStatusColor }}>
            {scale.status === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{scaleStatusLabel}</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 32 }}>

        <div style={{ minWidth: 0 }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>Nuevo Envio</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Complete los datos del paquete a registrar</p>
          </div>
          <div style={{ borderRadius: 14, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

            <Field label="SHIPMENT">
              <input value={shipment} onChange={e => setShipment(e.target.value)} placeholder="Ej: SHP-2024-001 o ABC123" style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }} />
            </Field>

            <Field label="BOXES">
              <select value={boxType} onChange={e => { setBoxType(e.target.value); setCustomBox('') }} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Seleccionar tipo de caja...</option>
                {BOX_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>

            {boxType === 'CUSTOM BOX' && (
              <div style={{ paddingLeft: 16, borderLeft: '2px solid #6366f1', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ ...labelStyle, color: '#6366f1' }}>
                  <ChevronDown size={12} style={{ display: 'inline', marginRight: 4 }} />
                  CUSTOM BOX - TIPO
                </label>
                <select value={customBox} onChange={e => setCustomBox(e.target.value)} style={{ ...inputStyle, borderColor: 'rgba(99,102,241,0.3)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, cursor: 'pointer' }}>
                  <option value="">Seleccionar medida...</option>
                  {CUSTOM_BOX_TYPES.map(cb => <option key={cb} value={cb}>{cb}</option>)}
                </select>
              </div>
            )}

            <Field label="PESO">
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Scale size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    value={scale.status === 'connected' ? scale.weight : manualWeight}
                    onChange={e => { if (scale.status !== 'connected') setManualWeight(e.target.value) }}
                    readOnly={scale.status === 'connected'}
                    placeholder={scale.status === 'connected' ? 'Leyendo bascula...' : '0.000'}
                    style={{ ...inputStyle, paddingLeft: 36, fontFamily: "'JetBrains Mono', monospace", ...(scale.status === 'connected' ? { borderColor: 'rgba(52,211,153,0.4)', backgroundColor: 'rgba(52,211,153,0.06)', color: '#34d399' } : {}) }}
                  />
                </div>
                <button onClick={scale.status === 'connected' ? scale.readWeight : scale.connect} disabled={scale.status === 'connecting'} title={scale.status === 'connected' ? 'Leer peso' : 'Conectar bascula USB'}
                  style={{ ...iconBtnStyle, borderColor: scale.status === 'connected' ? 'rgba(52,211,153,0.4)' : 'var(--border)', color: scale.status === 'connected' ? '#34d399' : 'var(--text-muted)' }}>
                  {scale.status === 'connecting' ? <Loader2 size={16} className="spin" /> : scale.status === 'connected' ? <RefreshCw size={16} /> : <Usb size={16} />}
                </button>
                {scale.status === 'connected' && (
                  <button onClick={scale.disconnect} title="Desconectar bascula" style={{ ...iconBtnStyle, borderColor: 'rgba(248,113,113,0.3)', color: '#f87171' }}>
                    <WifiOff size={16} />
                  </button>
                )}
              </div>
              {scale.errorMsg && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#f87171', marginTop: 4 }}><AlertCircle size={11} /> {scale.errorMsg}</div>}
              {scale.status === 'disconnected' && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Presiona el icono USB para conectar la bascula o ingresa el peso manualmente.</p>}
            </Field>

            <Field label="COMENTARIOS">
              <textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="Notas adicionales del envio..." rows={3}
                style={{ ...inputStyle, height: 'auto', resize: 'none', lineHeight: 1.6, padding: '10px 12px' }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }} />
            </Field>

            <button onClick={handleSubmit} disabled={saving}
              style={{ width: '100%', height: 48, borderRadius: 10, border: 'none', background: saving ? 'rgba(99,102,241,0.5)' : '#6366f1', color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: '0.8px', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(99,102,241,0.25)', transition: 'all 0.2s', fontFamily: "'Space Grotesk', sans-serif" }}>
              {saving ? <><Loader2 size={16} className="spin" /> Guardando...</> : <><Send size={16} /> GUARDAR ENVIO</>}
            </button>
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>Historial de Envios</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{shipments.length} registros guardados</p>
            </div>
            <button onClick={fetchShipments} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
              <RefreshCw size={13} /> Actualizar
            </button>
          </div>
          <div style={{ borderRadius: 14, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', overflow: 'hidden', maxHeight: 580, overflowY: 'auto' }}>
            {loadingList ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 10, color: 'var(--text-muted)' }}>
                <Loader2 size={18} className="spin" /> Cargando...
              </div>
            ) : shipments.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(107,107,138,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ClipboardList size={24} color="var(--text-muted)" />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Sin registros</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Los envios guardados apareceran aqui</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    {['FECHA', 'SHIPMENT', 'CAJA', 'PESO', 'COMENTARIOS', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((s, idx) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(37,37,53,0.6)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>{formatDate(s.created_at)}</td>
                      <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.3px' }}>{s.shipment}</span></td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{s.custom_box ? 'CUSTOM BOX' : s.box_type}</span>
                          {s.custom_box && <span style={{ fontSize: 10, color: '#6366f1', fontFamily: "'JetBrains Mono', monospace" }}>{s.custom_box}</span>}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {s.weight != null ? <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#34d399', fontWeight: 600 }}>{Number(s.weight).toFixed(3)}</span> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>-</span>}
                      </td>
                      <td style={{ padding: '10px 14px', maxWidth: 160 }}><span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.comments || '-'}</span></td>
                      <td style={{ padding: '10px 14px' }}>
                        <button onClick={() => handleDelete(s.id)} title="Eliminar registro"
                          style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        select option { background: #16161f; color: #e8e8f0; }
      `}</style>
    </div>
  )
}
