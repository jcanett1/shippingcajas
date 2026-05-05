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

      // ─── Parser binario HID para báscula BCA-222 ──────────────────────────
      device.oninputreport = (event) => {
        if (!event || !event.data) {
          console.warn('Reporte recibido sin datos')
          return
        }

        const { data } = event // DataView
        const byteCount = data.byteLength

        // LOG DE DIAGNÓSTICO: muestra todos los bytes para identificar el protocolo
        const bytes: number[] = []
        for (let i = 0; i < byteCount; i++) {
          bytes.push(data.getUint8(i))
        }
        console.log(`[BCA-222] reportId=${event.reportId} bytes(${byteCount}):`, bytes.join(', '))

        try {
          // Intentar leer el peso según el tamaño del reporte
          let rawWeight = 0

          if (byteCount >= 6) {
            // Protocolo estándar POS HID: byte4=LSB, byte5=MSB
            rawWeight = data.getUint8(4) + (data.getUint8(5) * 256)
          } else if (byteCount >= 4) {
            // Protocolo compacto: byte2=LSB, byte3=MSB
            rawWeight = data.getUint8(2) + (data.getUint8(3) * 256)
          } else if (byteCount >= 2) {
            // Protocolo mínimo: byte0=LSB, byte1=MSB
            rawWeight = data.getUint8(0) + (data.getUint8(1) * 256)
          } else if (byteCount === 1) {
            rawWeight = data.getUint8(0)
          }

          if (rawWeight > 0) {
            const scaledWeight = (rawWeight * 0.01).toFixed(2)
            console.log(`[BCA-222] Peso calculado: ${scaledWeight} kg (raw=${rawWeight})`)
            setWeight(scaledWeight)
          }

        } catch (error) {
          console.error('[BCA-222] Error al procesar bytes:', error, '| bytes:', bytes)
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
