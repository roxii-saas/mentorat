'use client'

import { useEffect, useRef, useState } from 'react'

export interface AreaPoint { label: string; value: number }

interface Props {
  data: AreaPoint[]
  color?: string
  label?: string
  formatValue?: (v: number) => string
  height?: number
}

export default function Area3D({ data, color = '#ED03E9', label, formatValue, height = 160 }: Props) {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef(0)
  const startRef = useRef(0)

  useEffect(() => {
    setProgress(0)
    startRef.current = 0
    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const p = Math.min((ts - startRef.current) / 800, 1)
      setProgress(1 - Math.pow(1 - p, 3))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [data])

  if (!data.length) return null

  const W = 500; const H = height
  const PAD = { l: 36, r: 16, t: 20, b: 30 }
  const CW = W - PAD.l - PAD.r
  const CH = H - PAD.t - PAD.b
  const maxVal = Math.max(...data.map(d => d.value), 1)

  const pts = data.map((d, i) => ({
    x: PAD.l + (i / Math.max(data.length - 1, 1)) * CW,
    y: PAD.t + CH - (d.value / maxVal) * CH * progress,
    raw: d.value,
  }))

  const linePath = pts.map((p,i) => `${i===0?'M':'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${pts[pts.length-1].x},${PAD.t+CH} L${pts[0].x},${PAD.t+CH} Z`

  // Depth effect: second area slightly offset
  const depthPts = pts.map(p => ({ x: p.x + 8, y: p.y + 8 }))
  const depthLine = depthPts.map((p,i) => `${i===0?'M':'L'}${p.x},${p.y}`).join(' ')
  const depthArea = `${depthLine} L${depthPts[depthPts.length-1].x},${PAD.t+CH+8} L${depthPts[0].x},${PAD.t+CH+8} Z`

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        <defs>
          <linearGradient id={`ag-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".35"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
          <linearGradient id={`dg-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".1"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
          <filter id={`glow-${color.slice(1)}`}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>

        {/* Grid */}
        {[0,.25,.5,.75,1].map(t => {
          const gy = PAD.t + CH - t * CH
          return (
            <g key={t}>
              <line x1={PAD.l} y1={gy} x2={W-PAD.r} y2={gy} stroke="#0A0A0A" strokeOpacity=".05" strokeWidth="1"/>
              <text x={PAD.l-4} y={gy+3} textAnchor="end" fontSize="8" fill="#A0A0A0" fontFamily="Inter,sans-serif">
                {formatValue ? formatValue(Math.round(t*maxVal)) : Math.round(t*maxVal)}
              </text>
            </g>
          )
        })}

        {/* Depth layer */}
        <path d={depthArea} fill={`url(#dg-${color.slice(1)})`}/>
        <path d={depthLine} fill="none" stroke={color} strokeWidth="1.5" strokeOpacity=".2" strokeLinecap="round" strokeLinejoin="round"/>

        {/* Main area */}
        <path d={areaPath} fill={`url(#ag-${color.slice(1)})`}/>
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#glow-${color.slice(1)})`}/>

        {/* Dots */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="white" stroke={color} strokeWidth="2"/>
            <circle cx={p.x} cy={p.y} r="2.5" fill={color}/>
          </g>
        ))}

        {/* X labels */}
        {data.map((d, i) => (
          <text key={i} x={pts[i].x} y={H - 4} textAnchor="middle" fontSize="9" fill="#A0A0A0" fontFamily="Inter,sans-serif">{d.label}</text>
        ))}

        {/* Hover tooltip area (last value) */}
        {pts.length > 0 && progress > 0.95 && (
          <g>
            <line x1={pts[pts.length-1].x} y1={PAD.t} x2={pts[pts.length-1].x} y2={PAD.t+CH} stroke={color} strokeOpacity=".2" strokeWidth="1" strokeDasharray="3 3"/>
            <rect x={pts[pts.length-1].x - 22} y={pts[pts.length-1].y - 22} width="44" height="16" rx="6" fill={color}/>
            <text x={pts[pts.length-1].x} y={pts[pts.length-1].y - 10} textAnchor="middle" fontSize="9" fontWeight="700" fill="white" fontFamily="Inter,sans-serif">
              {formatValue ? formatValue(data[data.length-1].value) : data[data.length-1].value}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
