'use client'

import { useEffect } from 'react'
import { trackMeta, type MetaParams } from '@/lib/meta/pixel'

// Invia un evento Meta quando la pagina (o il blocco) viene mostrata.
// `once`: non lo rimanda se la pagina viene ricaricata (es. Purchase sulla pagina di ringraziamento).
export default function MetaEvent({ name, params, eventId, once = false }: {
  name: string; params?: MetaParams; eventId?: string; once?: boolean
}) {
  const paramsKey = JSON.stringify(params ?? {})
  useEffect(() => {
    const key = once && eventId ? `meta_sent_${name}_${eventId}` : ''
    try { if (key && localStorage.getItem(key)) return } catch {}
    trackMeta(name, JSON.parse(paramsKey), eventId)
    try { if (key) localStorage.setItem(key, '1') } catch {}
  }, [name, paramsKey, eventId, once])
  return null
}
