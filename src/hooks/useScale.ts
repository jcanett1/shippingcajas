import { useState, useCallback, useRef } from 'react'

// Web Serial API type declarations
interface SerialPortInfo { usbVendorId?: number; usbProductId?: number }
interface SerialOptions { baudRate: number; dataBits?: number; stopBits?: number; parity?: string }
interface SerialPort {
  open(options: SerialOptions): Promise<void>
  close(): Promise<void>
  readable: ReadableStream<Uint8Array> | null
  writable: WritableStream<Uint8Array> | null
  getInfo(): SerialPortInfo
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

export function useScale(): UseScaleReturn {
  const [status, setStatus] = useState<ScaleStatus>('disconnected')
  const [weight, setWeight] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const portRef = useRef<SerialPort | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
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

      // Sin filtros para mostrar TODOS los dispositivos USB disponibles
      const port = await navigator.serial.requestPort({ filters: [] })
      await port.open({ baudRate, dataBits: 8, stopBits: 1, parity: 'none' })
      portRef.current = port
      setStatus('connected')

      const readLoop = async () => {
        if (!port.readable) return
        const reader = port.readable.getReader()
        readerRef.current = reader
        const decoder = new TextDecoder()
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break
            bufferRef.current += decoder.decode(value, { stream: true })
            const lines = bufferRef.current.split(/\r?\n/)
            bufferRef.current = lines.pop() ?? ''
            for (const line of lines) {
              const trimmed = line.trim()
              if (trimmed) {
                // Extraer número con decimales (ej: "22.500 kg", "0022.5", "ST,GS,+  22.500kg")
                const match = trimmed.match(/[\d]+\.?[\d]*/)
                if (match) {
                  const val = parseFloat(match[0])
                  if (!isNaN(val) && val >= 0) {
                    setWeight(val.toFixed(3))
                  }
                }
              }
            }
          }
        } catch {
          // puerto cerrado normalmente
        } finally {
          reader.releaseLock()
          setStatus('disconnected')
        }
      }
      readLoop()
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
      } else if (msg.toLowerCase().includes('blocked') || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('permission')) {
        setStatus('error')
        setErrorMsg('BRAVE_BLOQUEADO')
      } else {
        setStatus('error')
        setErrorMsg(msg)
      }
    }
  }, [isSupported])

  const disconnect = useCallback(async () => {
    try {
      if (readerRef.current) { await readerRef.current.cancel(); readerRef.current = null }
      if (portRef.current) { await portRef.current.close(); portRef.current = null }
    } catch { /* ignore */ }
    setStatus('disconnected')
    setWeight('')
    setErrorMsg('')
  }, [])

  const readWeight = useCallback(() => {
    setWeight(w => w)
  }, [])

  return { status, weight, errorMsg, connect, disconnect, readWeight, isSupported }
}
