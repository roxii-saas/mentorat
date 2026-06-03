'use client'

import { useMemo } from 'react'

interface DataPoint { label: string; value: number; value2?: number }

interface Props {
  data: DataPoint[]
  color?: string
  color2?: string
  label?: string
  label2?: string
  formatValue?: (v: number) => string
  height?: number
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]
    const curr = pts[i]
    const cpx = (prev.x + curr.x) / 2
    d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`
  }
  return d
}

export default function LineChart3D({
  data,
  color = '#ED03E9',
  color2 = '#6B00E8',
  label,
  label2,
  formatValue = v => `${v}`,
  height = 200,
}: Props) {
  const W = 560
  const H = height
  const padL = 44
  const padR = 20
  const padT = 20
  const padB = 36

  const chartW = W - padL - padR
  const chartH = H - padT - padB

  const allVals = data.flatMap(d => [d.value, d.value2 ?? 0])
  const maxVal = Math.max(...allVals, 1)
  const minVal = 0

  const pts1 = useMemo(() => data.map((d, i) => ({
    x: padL + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padT + (1 - (d.value - minVal) / (maxVal - minVal)) * chartH,
  })), [data, chartW, chartH, maxVal, minVal, padL, padT])

  const pts2 = useMemo(() => data.map((d, i) => ({
    x: padL + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padT + (1 - ((d.value2 ?? 0) - minVal) / (maxVal - minVal)) * chartH,
  })), [data, chartW, chartH, maxVal, minVal, padL, padT])

  const path1 = smoothPath(pts1)
  const path2 = label2 ? smoothPath(pts2) : ''

  const areaPath1 = path1
    ? `${path1} L ${pts1[pts1.length - 1].x} ${padT + chartH} L ${pts1[0].x} ${padT + chartH} Z`
    : ''
  const areaPath2 = path2
    ? `${path2} L ${pts2[pts2.length - 1].x} ${padT + chartH} L ${pts2[0].x} ${padT + chartH} Z`
    : ''

  const yTicks = 4
  const xStep = Math.max(1, Math.ceil(data.length / 6))

  const id = useMemo(() => Math.random().toString(36).slice(2), [])

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', height: 'auto', overflow: 'visible' }}
    >
      <defs>
        {/* Area gradient line 1 */}
        <linearGradient id={`g1-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
        {/* Area gradient line 2 */}
        <linearGradient id={`g2-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color2} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color2} stopOpacity="0"/>
        </linearGradient>
        {/* Glow filtro linea 1 */}
        <filter id={`glow1-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
        {/* Glow filtro linea 2 */}
        <filter id={`glow2-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
        {/* Shadow 3D sotto linea */}
        <filter id={`shadow-${id}`}>
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={color} floodOpacity="0.25"/>
        </filter>
      </defs>

      {/* Grid orizzontale */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = padT + (i / yTicks) * chartH
        const val = maxVal - (i / yTicks) * maxVal
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={padL + chartW} y2={y}
              stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="4 4"/>
            <text x={padL - 6} y={y + 4} textAnchor="end"
              fill="currentColor" fillOpacity="0.4" fontSize="10" fontFamily="system-ui">
              {val >= 1000 ? `${Math.round(val / 100) / 10}k` : Math.round(val)}
            </text>
          </g>
        )
      })}

      {/* Area line 2 (sotto) */}
      {path2 && (
        <path d={areaPath2} fill={`url(#g2-${id})`} />
      )}
      {/* Area line 1 */}
      {areaPath1 && (
        <path d={areaPath1} fill={`url(#g1-${id})`} />
      )}

      {/* Ombra 3D sotto la linea principale (offset + blur) */}
      {path1 && (
        <path d={path1} fill="none" stroke={color} strokeWidth="6"
          strokeOpacity="0.12" filter={`url(#shadow-${id})`}
          transform="translate(0,6)" strokeLinecap="round" strokeLinejoin="round"/>
      )}

      {/* Linea 2 */}
      {path2 && (
        <path d={path2} fill="none" stroke={color2} strokeWidth="2.5"
          strokeOpacity="0.85" strokeLinecap="round" strokeLinejoin="round"
          filter={`url(#glow2-${id})`}/>
      )}

      {/* Linea 1 principale con glow */}
      {path1 && (
        <path d={path1} fill="none" stroke={color} strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round"
          filter={`url(#glow1-${id})`}/>
      )}

      {/* Dot e tooltip line 2 */}
      {label2 && pts2.map((pt, i) => (
        <g key={`d2-${i}`}>
          <circle cx={pt.x} cy={pt.y} r="5" fill="white" stroke={color2} strokeWidth="2" opacity="0.9"/>
        </g>
      ))}

      {/* Dot e valore line 1 */}
      {pts1.map((pt, i) => (
        <g key={`d1-${i}`}>
          <circle cx={pt.x} cy={pt.y} r="4" fill="white" stroke={color} strokeWidth="2.5"/>
          {/* Valore sopra il dot per l'ultimo punto */}
          {i === pts1.length - 1 && (
            <text x={pt.x} y={pt.y - 10} textAnchor="middle"
              fill={color} fontSize="11" fontWeight="700" fontFamily="system-ui">
              {formatValue(data[i].value)}
            </text>
          )}
        </g>
      ))}

      {/* Labels X */}
      {data.map((d, i) => {
        if (i % xStep !== 0 && i !== data.length - 1) return null
        const x = padL + (i / Math.max(data.length - 1, 1)) * chartW
        return (
          <text key={i} x={x} y={padT + chartH + 18} textAnchor="middle"
            fill="currentColor" fillOpacity="0.45" fontSize="11" fontFamily="system-ui">
            {d.label}
          </text>
        )
      })}

      {/* Legenda */}
      {(label || label2) && (
        <g transform={`translate(${padL}, ${H - 2})`}>
          {label && (
            <g>
              <rect x="0" y="-8" width="16" height="4" rx="2" fill={color}/>
              <text x="20" y="-3" fill="currentColor" fillOpacity="0.55" fontSize="10" fontFamily="system-ui">{label}</text>
            </g>
          )}
          {label2 && (
            <g transform="translate(90,0)">
              <rect x="0" y="-8" width="16" height="4" rx="2" fill={color2}/>
              <text x="20" y="-3" fill="currentColor" fillOpacity="0.55" fontSize="10" fontFamily="system-ui">{label2}</text>
            </g>
          )}
        </g>
      )}
    </svg>
  )
}
