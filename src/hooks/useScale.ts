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
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  readWeight: () => void
  isSupported: boolean
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

      // Filtramos por los IDs exactos de la báscula BCA-222-60U-1101-110
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

      // ─── Parser binario HID para básculas POS / Shipping Scale ──────────
      // Protocolo estándar: Byte 4 (LSB) + Byte 5 (MSB), factor 0.01 para kg
      device.oninputreport = (event) => {
        // Verificar que el evento y la data existan
        if (!event || !event.data) {
          console.warn('Reporte recibido sin datos')
          return
        }

        const { data } = event // DataView

        try {
          // Byte 4 = LSB (menos significativo), Byte 5 = MSB (más significativo)
          const weightLSB = data.getUint8(4)
          const weightMSB = data.getUint8(5)

          // Valor crudo combinado
          const rawWeight = weightLSB + (weightMSB * 256)

          // Factor de escala: 0.01 para kg (ej: rawWeight=1050 → 10.50 kg)
          const scaledWeight = (rawWeight * 0.01).toFixed(2)

          console.log(`Peso capturado: ${scaledWeight} kg`)
          setWeight(scaledWeight)
          setStatus('connected')

        } catch (error) {
          console.error('Error al procesar los bytes de la báscula:', error)
        }
      }

      setStatus('connected')

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      if (
        msg.toLowerCase().includes('cancel') ||
        msg.toLowerCase().includes('no device selected')
      ) {
        setStatus('disconnected')
        setErrorMsg('')
      } else {
        setStatus('error')
        setErrorMsg('No se pudo conectar a la báscula. Revisa el cable USB.')
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
    setErrorMsg('')
  }, [])

  const readWeight = useCallback(() => {
    setWeight(w => w)
  }, [])

  return { status, weight, errorMsg, connect, disconnect, readWeight, isSupported }
}
