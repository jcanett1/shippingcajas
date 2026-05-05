import { useState, useCallback, useRef } from 'react'

// Web Serial API type declarations
interface SerialOptions {
  baudRate: number
  dataBits?: number
  stopBits?: number
  parity?: string
  flowControl?: string
}
interface SerialPort {
  open(options: SerialOptions): Promise<void>
  close(): Promise<void>
  readable: ReadableStream<Uint8Array> | null
  writable: WritableStream<Uint8Array> | null
}
interface Serial {
  requestPort(options?: { filters?: object[] }): Promise<SerialPort>
  getPorts(): Promise<SerialPort[]>
}
declare global {
  interface Navigator { serial: Serial }
}

export type ScaleStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface UseScaleReturn {
  status: ScaleStatus
  weight: string
  errorMsg: string
  connect: (baudRate?: number) => Promise<void>
  disconnect: () => Promise<void>
  readWeight: () => void
  isSupported: boolean
}

// Baud rates comunes para básculas USB/serial
export const COMMON_BAUD_RATES = [9600, 4800, 19200, 38400, 57600, 115200, 2400, 1200]

// ─── Parser protocolo SICS Mettler Toledo ────────────────────────────────────
// Formatos comunes: "S S  12.345 kg", "+12.345", "12.345 kg", "ST,GS,+  22.500kg"
function parsearRespuestaMettler(texto: string): string | null {
  if (!texto) return null
  // Eliminar todo excepto dígitos, punto, signo y espacio
  const limpio = texto.replace(/[^0-9.\-+]/g, '').trim()
  const numero = parseFloat(limpio)
  if (isNaN(numero) || numero < 0) return null
  return numero.toFixed(3)
}

export function useScale(): UseScaleReturn {
  const [status, setStatus] = useState<ScaleStatus>('disconnected')
  const [weight, setWeight] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const portRef = useRef<SerialPort | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const readerLoopRef = useRef(false)
  const bufferRef = useRef('')

  // Verificar soporte del navegador
  const isSupported = 'serial' in navigator

  const connect = useCallback(async (baudRate: number = 9600) => {
    if (!isSupported) {
      setStatus('error')
      setErrorMsg('NAVEGADOR_NO_COMPATIBLE')
      return
    }
    try {
      setStatus('connecting')
      setErrorMsg('')

      // Sin filtros → muestra TODOS los dispositivos USB/serial disponibles
      const port = await navigator.serial.requestPort({ filters: [] })

      // Configuración estándar Mettler Toledo (SICS protocol)
      await port.open({
        baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none',
      })

      portRef.current = port
      readerLoopRef.current = true
      setStatus('connected')

      // ─── Loop de lectura continua ─────────────────────────────────────────
      const iniciarLectura = async () => {
        if (!port.readable) return
        const decoder = new TextDecoder()
        const reader = port.readable.getReader()
        readerRef.current = reader

        try {
          while (readerLoopRef.current) {
            const { value, done } = await reader.read()
            if (done) break

            bufferRef.current += decoder.decode(value, { stream: true })

            // Las básculas MT envían datos terminados en \r\n
            const lines = bufferRef.current.split(/\r?\n/)
            bufferRef.current = lines.pop() ?? ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed) continue
              const peso = parsearRespuestaMettler(trimmed)
              if (peso !== null) {
                setWeight(peso)
              }
            }
          }
        } catch {
          // puerto cerrado normalmente o desconectado
        } finally {
          reader.releaseLock()
          setStatus('disconnected')
        }
      }

      iniciarLectura()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      // Usuario canceló el diálogo
      if (
        msg.toLowerCase().includes('no port selected') ||
        msg.toLowerCase().includes('cancelled') ||
        msg.toLowerCase().includes('canceled') ||
        msg.toLowerCase().includes('user cancelled') ||
        msg.toLowerCase().includes('user canceled')
      ) {
        setStatus('disconnected')
        setErrorMsg('')
      } else if (
        msg.toLowerCase().includes('blocked') ||
        msg.toLowerCase().includes('denied') ||
        msg.toLowerCase().includes('permission')
      ) {
        setStatus('error')
        setErrorMsg('BRAVE_BLOQUEADO')
      } else {
        setStatus('error')
        setErrorMsg('No se pudo conectar. Revisa el cable, drivers o usa otro puerto USB.')
      }
    }
  }, [isSupported])

  const disconnect = useCallback(async () => {
    readerLoopRef.current = false
    try {
      if (readerRef.current) {
        await readerRef.current.cancel()
        readerRef.current = null
      }
      if (portRef.current) {
        await portRef.current.close()
        portRef.current = null
      }
    } catch { /* ignore */ }
    setStatus('disconnected')
    setWeight('')
    setErrorMsg('')
    bufferRef.current = ''
  }, [])

  const readWeight = useCallback(() => {
    // Fuerza re-render con el último valor leído
    setWeight(w => w)
  }, [])

  return { status, weight, errorMsg, connect, disconnect, readWeight, isSupported }
}
