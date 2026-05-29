'use client'

interface MonthData {
  month: string
  bookings: number
  clients: number
  revenue: number
}

export default function AdminCharts({ data }: { data: MonthData[] }) {
  const maxRev = Math.max(...data.map(d => d.revenue), 1)
  const maxBar = Math.max(...data.map(d => Math.max(d.bookings, d.clients)), 1)
  const W = 300; const H = 120; const pad = 24

  // Punti per area chart revenue
  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (W - pad * 2)
    const y = H - pad - ((d.revenue / maxRev) * (H - pad * 2))
    return `${x},${y}`
  })
  const areaPath = `M${pts.join('L')} L${pad + (W - pad * 2)},${H - pad} L${pad},${H - pad} Z`
  const linePath = `M${pts.join('L')}`

  return (
    <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">

      {/* Revenue area chart */}
      <div className="admin-card rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif font-bold admin-text-primary text-base">Venit estimat</h3>
            <p className="admin-text-muted text-xs font-sans mt-0.5">Ultimele 6 luni</p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-[#ED03E9] to-[#6B00E8] rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
              <path d="M2 11l4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ED03E9" stopOpacity=".3"/>
              <stop offset="100%" stopColor="#ED03E9" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[0,.25,.5,.75,1].map(t => {
            const y = pad + t * (H - pad * 2)
            return <line key={t} x1={pad} y1={y} x2={W - pad} y2={y} stroke="currentColor" strokeOpacity=".06" strokeWidth="1"/>
          })}
          {/* Area + line */}
          <path d={areaPath} fill="url(#revFill)"/>
          <path d={linePath} fill="none" stroke="#ED03E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Dots */}
          {pts.map((p, i) => {
            const [x, y] = p.split(',').map(Number)
            return <circle key={i} cx={x} cy={y} r="3" fill="#ED03E9" stroke="white" strokeWidth="1.5"/>
          })}
          {/* X labels */}
          {data.map((d, i) => {
            const x = pad + (i / (data.length - 1 || 1)) * (W - pad * 2)
            return <text key={i} x={x} y={H - 4} textAnchor="middle" fontSize="9" fill="currentColor" opacity=".4" fontFamily="sans-serif">{d.month}</text>
          })}
        </svg>
      </div>

      {/* Sessions + Clients bar chart */}
      <div className="admin-card rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif font-bold admin-text-primary text-base">Sesiuni & Cliente noi</h3>
            <p className="admin-text-muted text-xs font-sans mt-0.5">Ultimele 6 luni</p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-[#6B00E8] to-[#4C00A8] rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
              <path d="M2 12V8m4 4V5m4 7V7m4 5V3" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
          {[0,.25,.5,.75,1].map(t => {
            const y = pad + t * (H - pad * 2)
            return <line key={t} x1={pad} y1={y} x2={W - pad} y2={y} stroke="currentColor" strokeOpacity=".06" strokeWidth="1"/>
          })}
          {data.map((d, i) => {
            const slotW = (W - pad * 2) / data.length
            const bW = slotW * 0.35
            const x = pad + i * slotW + slotW * 0.1
            const bH1 = (d.bookings / maxBar) * (H - pad * 2)
            const bH2 = (d.clients / maxBar) * (H - pad * 2)
            const cx = pad + i * slotW + slotW / 2
            return (
              <g key={i}>
                <rect x={x} y={H - pad - bH1} width={bW} height={bH1} rx="2" fill="#ED03E9" fillOpacity=".8"/>
                <rect x={x + bW + 2} y={H - pad - bH2} width={bW} height={bH2} rx="2" fill="#6B00E8" fillOpacity=".8"/>
                <text x={cx} y={H - 4} textAnchor="middle" fontSize="9" fill="currentColor" opacity=".4" fontFamily="sans-serif">{d.month}</text>
              </g>
            )
          })}
        </svg>
        <div className="flex items-center gap-4 mt-2">
          {[{ c:'#ED03E9', l:'Sesiuni' }, { c:'#6B00E8', l:'Cliente noi' }].map(item => (
            <div key={item.l} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: item.c }}/>
              <span className="text-[11px] admin-text-muted font-sans">{item.l}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
