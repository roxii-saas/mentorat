'use client'

import { useEffect, useRef, useState } from 'react'

interface Spark { value: number }

function Sparkline({ data, color }: { data: Spark[]; color: string }) {
  if (data.length < 2) return null
  const W = 80; const H = 28
  const max = Math.max(...data.map(d => d.value), 1)
  const pts = data.map((d, i) => `${(i / (data.length-1)) * W},${H - (d.value/max) * (H-4) - 2}`)
  const area = `M${pts.join('L')} L${W},${H} L0,${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-20 h-7">
      <defs>
        <linearGradient id={`sg${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg${color.slice(1)})`}/>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function AnimCounter({ target, duration = 800, format }: { target: number; duration?: number; format?: (n: number) => string }) {
  const [val, setVal] = useState(0)
  const rafRef = useRef(0)
  const startRef = useRef(0)

  useEffect(() => {
    const startVal = val
    startRef.current = 0
    cancelAnimationFrame(rafRef.current)
    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const p = Math.min((ts - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(startVal + (target - startVal) * eased))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target])

  return <>{format ? format(val) : val}</>
}

interface Props {
  label: string
  value: number
  delta?: string
  deltaPositive?: boolean
  icon: string
  color: string
  bg: string
  format?: (n: number) => string
  sparkline?: Spark[]
  live?: boolean
}

export default function KPICard({ label, value, delta, deltaPositive, icon, color, bg, format, sparkline, live }: Props) {
  return (
    <div className="db-card rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
      {/* Background glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" style={{ background: `radial-gradient(circle at 30% 50%, ${bg} 0%, transparent 70%)` }}/>

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: bg }}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-5 h-5" style={{ stroke: color }}>
              <path d={icon} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex items-center gap-1.5">
            {live && (
              <span className="flex items-center gap-1 text-[10px] font-bold font-sans" style={{ color }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: color }}/>
                  <span className="relative rounded-full h-1.5 w-1.5 inline-flex" style={{ background: color }}/>
                </span>
                LIVE
              </span>
            )}
            {sparkline && <Sparkline data={sparkline} color={color}/>}
          </div>
        </div>

        <p className="text-2xl sm:text-3xl font-serif font-bold db-text leading-none mb-1">
          <AnimCounter target={value} format={format}/>
        </p>
        <p className="text-xs db-muted font-sans">{label}</p>

        {delta && (
          <div className="flex items-center gap-1 mt-2">
            <svg viewBox="0 0 16 16" fill="none" stroke={deltaPositive ? '#10B981' : '#EF4444'} strokeWidth="2" className="w-3 h-3">
              <path d={deltaPositive ? 'M8 12V4M4 8l4-4 4 4' : 'M8 4v8M4 8l4 4 4-4'} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[11px] font-sans font-semibold" style={{ color: deltaPositive ? '#10B981' : '#EF4444' }}>
              {delta}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
