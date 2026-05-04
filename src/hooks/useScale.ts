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
  requestPort(options?: object): Promise<SerialPort>
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
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  readWeight: () => void
}

export function useScale(): UseScaleReturn {
  const [status, setStatus] = useState<ScaleStatus>('disconnected')
  const [weight, setWeight] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const portRef = useRef<SerialPort | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const bufferRef = useRef('')

  const connect = useCallback(async () => {
    if (!('serial' in navigator)) {
      setStatus('error')
      setErrorMsg('Web Serial API no disponible. Usa Chrome o Edge.')
      return
    }
    try {
      setStatus('connecting')
      setErrorMsg('')
      const port = await navigator.serial.requestPort()
      await port.open({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none' })
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
                const match = trimmed.match(/\d+\.?\d*/)
                if (match) setWeight(match[0])
              }
            }
          }
        } catch {
          // port closed
        } finally {
          reader.releaseLock()
        }
      }
      readLoop()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      if (msg.includes('No port selected') || msg.includes('cancelled')) {
        setStatus('disconnected')
        setErrorMsg('')
      } else {
        setStatus('error')
        setErrorMsg(msg)
      }
    }
  }, [])

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
    setWeight(w => w) // triggers re-render with latest value
  }, [])

  return { status, weight, errorMsg, connect, disconnect, readWeight }
}
