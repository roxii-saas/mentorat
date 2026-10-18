'use client'
import { useCallback, useEffect, useRef } from 'react'
import type { Map as LMap, LayerGroup } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { stageOf, placeText, type LiveSession, type Summary } from '@/lib/live-types'

type Props = { sessions: LiveSession[]; heat: Summary['heat']; selected: string | null; onSelect: (id: string) => void }

// Hartă: strat de căldură (unde sunt vizitatorii în perioada aleasă) + puncte colorate după etapă (cine e pe site acum)
export default function LiveMap({ sessions, heat, selected, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const state = useRef<{ L: typeof import('leaflet'); map: LMap; dots: LayerGroup; heat: ReturnType<typeof import('leaflet').heatLayer> | null } | null>(null)
  const latest = useRef({ sessions, heat, selected, onSelect })
  useEffect(() => { latest.current = { sessions, heat, selected, onSelect } })

  const draw = useCallback(() => {
    const s = state.current
    if (!s) return
    const { L, map, dots } = s
    const { sessions, heat, selected, onSelect } = latest.current
    if (s.heat) { map.removeLayer(s.heat); s.heat = null }
    const pts = heat.filter(h => h.lat != null && h.lon != null)
    if (pts.length) {
      const max = Math.max(...pts.map(p => p.n))
      s.heat = L.heatLayer(pts.map(p => [p.lat, p.lon, Math.max(0.25, p.n / max)] as [number, number, number]), {
        radius: 28, blur: 22, minOpacity: 0.35, gradient: { 0.3: '#7C3AED', 0.6: '#D97706', 1: '#DC2626' },
      }).addTo(map)
    }
    dots.clearLayers()
    for (const v of sessions) {
      if (v.lat == null || v.lon == null) continue
      const st = stageOf(v.stage)
      const hot = v.stage_rank >= 2 && v.stage_rank < 5
      const m = L.circleMarker([v.lat, v.lon], {
        radius: v.id === selected ? 11 : hot ? 9 : 7, color: v.id === selected ? '#15151C' : '#FFFFFF',
        weight: v.id === selected ? 3 : 2, fillColor: st.dot, fillOpacity: 1,
      })
      m.bindTooltip(`${placeText(v)} · ${st.label}`)
      m.on('click', () => onSelect(v.id))
      m.addTo(dots)
    }
  }, [])

  useEffect(() => {
    let dead = false
    ;(async () => {
      const L = (await import('leaflet')).default ?? (await import('leaflet'))
      await import('leaflet.heat')
      if (dead || !el.current || state.current) return
      const map = L.map(el.current, { center: [46, 15], zoom: 4, minZoom: 2, worldCopyJump: true, scrollWheelZoom: true })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap, © CARTO', maxZoom: 18,
      }).addTo(map)
      const dots = L.layerGroup().addTo(map)
      state.current = { L, map, dots, heat: null }
      draw()
    })()
    return () => { dead = true; state.current?.map.remove(); state.current = null }
  }, [draw])

  useEffect(() => { latest.current = { sessions, heat, selected, onSelect }; draw() }, [sessions, heat, selected, onSelect, draw])

  // Centrează harta pe vizitatorul selectat
  useEffect(() => {
    const s = state.current, v = sessions.find(x => x.id === selected)
    if (s && v?.lat != null && v.lon != null) s.map.flyTo([v.lat, v.lon], Math.max(s.map.getZoom(), 6), { duration: 0.6 })
  }, [selected, sessions])

  return <div ref={el} className="w-full h-[380px] sm:h-[460px] rounded-[10px] border border-[#D3D3DF] overflow-hidden" role="application" aria-label="Harta vizitatorilor" />
}
