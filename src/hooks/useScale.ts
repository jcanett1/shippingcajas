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

      // ─── Parser binario HID para báscula BCA-222-60U (Mettler Toledo) ───────────
      let lastBytesStr = ''
      device.oninputreport = (event) => {
        if (!event || !event.data) return

        const { data } = event
        const n = data.byteLength

        // Leer todos los bytes
        const bytes: number[] = []
        for (let i = 0; i < n; i++) bytes.push(data.getUint8(i))
        const bytesStr = bytes.join(',')

        // Solo loguear cuando los bytes cambian (evita spam)
        if (bytesStr !== lastBytesStr) {
          lastBytesStr = bytesStr
          // Calcular todas las posibles lecturas de peso
          const combos: string[] = []
          for (let i = 0; i + 1 < n; i++) {
            const raw = bytes[i] + (bytes[i+1] * 256)
            combos.push(`b[${i}+${i+1}]=${(raw*0.01).toFixed(2)}lb`)
          }
          console.log(`[DIAG] bytes(${n}): [${bytesStr}] | ${combos.join(' | ')}`)
        }

        // Por ahora mostrar el peso usando bytes[2]+bytes[3] (ajustar según diagnóstico)
        try {
          if (n >= 4) {
            const raw = bytes[2] + (bytes[3] * 256)
            setWeight((raw * 0.01).toFixed(2))
          }
        } catch { /* ignore */ }
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
