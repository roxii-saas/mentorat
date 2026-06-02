'use client'

import { useEffect, useRef, useState } from 'react'

export interface BarData {
  label: string
  value: number
  value2?: number
}

interface Props {
  data: BarData[]
  height?: number
  label1?: string
  label2?: string
  animated?: boolean
}

const C1 = '#ED03E9'
const C2 = '#6B00E8'

function IsoBar({
  x, y, w, h, depth, color, label, tooltip,
  progress, delay
}: {
  x: number; y: number; w: number; h: number; depth: number
  color: string; label: string; tooltip: string
  progress: number; delay: number
}) {
  const ah = h * progress
  const ty = y - ah

  // Faccia frontale
  const front = `${x},${ty + ah} ${x + w},${ty + ah} ${x + w},${y} ${x},${y}`
  // Faccia superiore (romboidale)
  const d2 = depth * 0.6
  const top = `${x},${ty} ${x + d2},${ty - d2} ${x + w + d2},${ty - d2} ${x + w},${ty}`
  // Faccia laterale destra
  const side = `${x + w},${ty} ${x + w + d2},${ty - d2} ${x + w + d2},${y + d2 - ah} ${x + w},${y}`

  // Lighten/darken helpers
  const lighten = (hex: string) => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
    return `rgb(${Math.min(255,r+60)},${Math.min(255,g+60)},${Math.min(255,b+60)})`
  }
  const darken = (hex: string) => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
    return `rgb(${Math.max(0,r-60)},${Math.max(0,g-40)},${Math.max(0,b-20)})`
  }

  return (
    <g style={{ filter: progress > 0.98 ? 'drop-shadow(0 4px 12px ' + color + '40)' : 'none', transition: 'filter .3s' }}>
      <polygon points={side}  fill={darken(color)} opacity=".9"/>
      <polygon points={front} fill={color} opacity=".95"/>
      <polygon points={top}   fill={lighten(color)} opacity=".9"/>
      {/* Etichetta sotto */}
      <text x={x + w/2} y={y + 16} textAnchor="middle" fontSize="10" fill="#737373" fontFamily="Inter,sans-serif">{label}</text>
      {/* Valore sopra */}
      {progress > 0.7 && (
        <text x={x + w/2 + depth*0.3} y={ty - depth*0.6 - 6} textAnchor="middle" fontSize="9" fontWeight="700" fill={color} fontFamily="Inter,sans-serif">{tooltip}</text>
      )}
    </g>
  )
}

export default function Bars3D({ data, height = 200, label1 = 'Sesiuni', label2, animated = true }: Props) {
  const [progress, setProgress] = useState(animated ? 0 : 1)
  const rafRef = useRef(0)
  const startRef = useRef(0)
  const DURATION = 900

  useEffect(() => {
    if (!animated) return
    setProgress(0)
    startRef.current = 0
    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const p = Math.min((ts - startRef.current) / DURATION, 1)
      // ease out cubic
      const eased = 1 - Math.pow(1 - p, 3)
      setProgress(eased)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [data, animated])

  if (!data.length) return null

  const maxVal = Math.max(...data.flatMap(d => [d.value, d.value2 ?? 0]), 1)
  const W = 520
  const H = height + 60
  const BAR_W = 22
  const DEPTH = 10
  const CHART_H = height - 30
  const BASE_Y = height + 5
  const PADDING_L = 40
  const SLOT = (W - PADDING_L) / data.length

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 300, height: H }}>
        {/* Grid lines */}
        {[0,.25,.5,.75,1].map(t => {
          const gy = BASE_Y - t * CHART_H
          const val = Math.round(t * maxVal)
          return (
            <g key={t}>
              <line x1={PADDING_L} y1={gy} x2={W - 10} y2={gy} stroke="#0A0A0A" strokeOpacity=".06" strokeWidth="1" strokeDasharray="3 3"/>
              <text x={PADDING_L - 4} y={gy + 3.5} textAnchor="end" fontSize="8" fill="#A0A0A0" fontFamily="Inter,sans-serif">{val}</text>
            </g>
          )
        })}

        {data.map((d, i) => {
          const cx = PADDING_L + i * SLOT + SLOT / 2
          const h1 = (d.value / maxVal) * CHART_H
          const h2 = d.value2 ? (d.value2 / maxVal) * CHART_H : 0
          const barDelay = i / data.length

          if (d.value2 !== undefined) {
            return (
              <g key={i}>
                <IsoBar x={cx - BAR_W - 2} y={BASE_Y} w={BAR_W} h={h2} depth={DEPTH} color={C2} label="" tooltip={String(d.value2)} progress={Math.max(0, Math.min(1, (progress - barDelay * .3) / (1 - barDelay * .3)))} delay={barDelay}/>
                <IsoBar x={cx + 2} y={BASE_Y} w={BAR_W} h={h1} depth={DEPTH} color={C1} label={d.label} tooltip={String(d.value)} progress={Math.max(0, Math.min(1, (progress - barDelay * .3) / (1 - barDelay * .3)))} delay={barDelay}/>
              </g>
            )
          }
          return (
            <IsoBar key={i} x={cx - BAR_W/2} y={BASE_Y} w={BAR_W} h={h1} depth={DEPTH} color={C1} label={d.label} tooltip={String(d.value)} progress={Math.max(0, Math.min(1, (progress - barDelay * .3) / (1 - barDelay * .3)))} delay={barDelay}/>
          )
        })}
      </svg>

      {/* Legend */}
      {label2 && (
        <div className="flex items-center gap-4 mt-1 px-1">
          {[[C1, label1],[C2, label2]].map(([c,l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: c }}/>
              <span className="text-[11px] text-[#737373] font-sans">{l}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
