export type Bar = { value: number; tip: string; label: string; showLabel: boolean }

// Grafico a barre semplice (solo div): leggibile, veloce, senza librerie.
// La descrizione di ogni barra è nel tooltip (hover) e nella tabella "zi cu zi" sotto.
export default function BarChart({ bars, color, ariaLabel, height = 176 }: {
  bars: Bar[]; color: string; ariaLabel: string; height?: number
}) {
  const max = Math.max(1, ...bars.map(b => b.value))
  const gap = bars.length > 40 ? 1 : bars.length <= 8 ? 14 : 3
  return (
    <div>
      <div
        role="img"
        aria-label={ariaLabel}
        className="flex items-end border-b border-[#D3D3DF]"
        style={{
          height, gap,
          backgroundImage: 'linear-gradient(to bottom,#EEEEF4 1px,transparent 1px)',
          backgroundSize: `100% ${height / 4}px`,
        }}>
        {bars.map((b, i) => (
          <div key={i} title={b.tip}
            className="flex-1 min-w-[2px] rounded-t-[3px] transition-opacity hover:opacity-70"
            style={{
              height: b.value > 0 ? `${Math.max(4, Math.round((b.value / max) * 100))}%` : 2,
              background: b.value > 0 ? color : '#E4E4EC',
            }} />
        ))}
      </div>
      <div className="flex mt-1.5" style={{ gap }} aria-hidden>
        {bars.map((b, i) => (
          <div key={i} className="flex-1 min-w-[2px] relative h-[18px]">
            {b.showLabel && (
              <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xs leading-4 text-[#5A5A6C]">{b.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
