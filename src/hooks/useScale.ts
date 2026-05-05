import { useState, useCallback, useRef } from 'react'

// WebHID API type declarations
interface HIDDevice {
  open(): Promise<void>
  close(): Promise<void>
  forget(): Promise<void>
  oninputreport: ((event: HIDInputReportEvent) => void) | null
  opened: boolean
  productName: string
}

interface HIDInputReportEvent {
  data: DataView
  device: HIDDevice
  reportId: number
}

interface HID {
  requestDevice(options?: { filters?: object[] }): Promise<HIDDevice[]>
  getDevices(): Promise<HIDDevice[]>
}

declare global {
  interface Navigator { hid: HID }
}

export type ScaleStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface UseScaleReturn {
  status: ScaleStatus
  weight: string
  errorMsg: string
  connect: () => Promise<void> // Ya no necesitamos baudRate en HID
  disconnect: () => Promise<void>
  readWeight: () => void
  isSupported: boolean
}

function parsearRespuestaMettler(texto: string): string | null {
  if (!texto) return null
  // Extraer números y decimales
  const limpio = texto.replace(/[^0-9.]/g, '').trim()
  const numero = parseFloat(limpio)
  if (isNaN(numero) || numero < 0) return null
  return numero.toFixed(3)
}

export function useScale(): UseScaleReturn {
  const [status, setStatus] = useState<ScaleStatus>('disconnected')
  const [weight, setWeight] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const deviceRef = useRef<HIDDevice | null>(null)

  const isSupported = 'hid' in navigator

  const connect = useCallback(async () => {
    if (!isSupported) {
      setStatus('error')
      setErrorMsg('NAVEGADOR_NO_COMPATIBLE')
      return
    }

    try {
      setStatus('connecting')
      setErrorMsg('')

      // Filtramos por los IDs que arrojó tu consola
      const devices = await navigator.hid.requestDevice({
        filters: [{ vendorId: 3768, productId: 61440 }]
      })

      if (devices.length === 0) {
        setStatus('disconnected')
        return
      }

      const device = devices[0]
      await device.open()
      deviceRef.current = device

      // Configurar el listener de datos
      device.oninputreport = (event) => {
        const { data } = event
        const decoder = new TextDecoder()
        // Decodificamos el buffer que llega de la báscula
        const stringData = decoder.decode(data)
        
        const peso = parsearRespuestaMettler(stringData)
        if (peso !== null) {
          setWeight(peso)
        }
      }

      setStatus('connected')

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      if (msg.toLowerCase().includes('cancel')) {
        setStatus('disconnected')
      } else {
        setStatus('error')
        setErrorMsg('No se pudo conectar a la báscula HID.')
      }
    }
  }, [isSupported])

  const disconnect = useCallback(async () => {
    try {
      if (deviceRef.current) {
        deviceRef.current.oninputreport = null
        await deviceRef.current.close()
        deviceRef.current = null
      }
    } catch { /* ignore */ }
    setStatus('disconnected')
    setWeight('')
  }, [])

  const readWeight = useCallback(() => {
    setWeight(w => w)
  }, [])

  return { status, weight, errorMsg, connect, disconnect, readWeight, isSupported }
}
