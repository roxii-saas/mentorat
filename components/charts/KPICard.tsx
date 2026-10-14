interface Props {
  label: string; value: number; delta?: string; deltaPositive?: boolean
  icon: string; color: string; bg: string; format?: (n: number) => string
  sparkline?: { value: number }[]; live?: boolean
}

function Sparkline({ data, color }: { data: { value: number }[]; color: string }) {
  if (data.length < 2) return null
  const W = 80, H = 28
  const max = Math.max(...data.map(d => d.value), 1)
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * W},${H - (d.value / max) * (H - 4) - 2}`)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-20 h-7" aria-hidden>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Riquadro indicatore piatto: valore grande e leggibile, nessun effetto
export default function KPICard({ label, value, delta, deltaPositive, icon, color, bg, format, sparkline, live }: Props) {
  return (
    <div className="g-card p-4 sm:p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-5 h-5" style={{ stroke: color }} aria-hidden>
            <path d={icon} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          {live && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#0B6B49]">
              <span className="w-2 h-2 rounded-full bg-[#12A06E]" />Live
            </span>
          )}
          {sparkline && <Sparkline data={sparkline} color={color} />}
        </div>
      </div>

      <p className="text-[28px] leading-9 font-bold tracking-[-0.01em] tnum text-[#15151C]">{format ? format(value) : value}</p>
      <p className="text-sm leading-5 font-medium db-muted mt-0.5">{label}</p>

      {delta && (
        <p className="text-[13px] leading-5 font-semibold mt-2" style={{ color: deltaPositive ? '#0B6B49' : '#B42318' }}>
          {deltaPositive ? '↑' : '↓'} {delta}
        </p>
      )}
    </div>
  )
}
