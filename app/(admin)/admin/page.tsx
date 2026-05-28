import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import { Users, Calendar, Clock, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'

export default async function AdminOverview() {
  await requireAdmin()
  const supabase = await createClient()

  const [
    { count: totalClients },
    { count: pendingBookings },
    { data: upcomingBookings },
    { data: settings },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('bookings')
      .select('*, profiles(full_name, email)')
      .in('status', ['pending', 'confirmed'])
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at')
      .limit(5),
    supabase.from('platform_settings').select('price_amount, sales_active').single(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif text-gray-900">Bună ziua, Roxana! 👋</h1>
        <p className="text-gray-500 font-sans mt-1">Iată un rezumat al platformei tale.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cliente totale', value: totalClients ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Rezervări în așteptare', value: pendingBookings ?? 0, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Preț curent', value: `${settings?.price_amount ?? 297}€`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Vânzări active', value: settings?.sales_active ? 'DA ✓' : 'OPRIT', icon: TrendingUp, color: settings?.sales_active ? 'text-green-600' : 'text-red-600', bg: settings?.sales_active ? 'bg-green-50' : 'bg-red-50' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 font-sans mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming sessions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg font-serif">Sesiuni viitoare</h2>
          <Link href="/admin/calendar" className="text-sm text-[#c97d4e] hover:underline font-sans">
            Vezi tot calendarul →
          </Link>
        </div>
        {upcomingBookings?.length === 0 ? (
          <p className="text-gray-400 font-sans text-sm text-center py-4">Nu ai sesiuni programate.</p>
        ) : (
          <div className="space-y-3">
            {upcomingBookings?.map(booking => (
              <div key={booking.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800 font-sans">
                      {(booking.profiles as any)?.full_name || (booking.profiles as any)?.email}
                    </p>
                    <p className="text-xs text-gray-500 font-sans">
                      {format(new Date(booking.scheduled_at), "EEEE, d MMM 'la' HH:mm", { locale: ro })}
                    </p>
                  </div>
                </div>
                <StatusBadge status={booking.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/admin/disponibilitate" className="bg-[#c97d4e] text-white rounded-2xl p-5 hover:bg-[#a85e35] transition-colors">
          <Clock className="w-6 h-6 mb-2" />
          <p className="font-bold font-serif">Adaugă disponibilitate</p>
          <p className="text-white/70 text-sm font-sans mt-1">Setează slot-urile pentru sesiuni</p>
        </Link>
        <Link href="/admin/clienti" className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-[#c97d4e]/30 hover:shadow-sm transition-all">
          <Users className="w-6 h-6 text-[#c97d4e] mb-2" />
          <p className="font-bold font-serif">Gestionează cliente</p>
          <p className="text-gray-500 text-sm font-sans mt-1">Vezi toate clientele și sesiunile lor</p>
        </Link>
        <Link href="/admin/setari" className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-[#c97d4e]/30 hover:shadow-sm transition-all">
          <TrendingUp className="w-6 h-6 text-[#c97d4e] mb-2" />
          <p className="font-bold font-serif">Modifică prețul</p>
          <p className="text-gray-500 text-sm font-sans mt-1">Actualizează prețul mentorat-ului</p>
        </Link>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: 'În așteptare', className: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Confirmată', className: 'bg-green-100 text-green-700' },
    completed: { label: 'Finalizată', className: 'bg-blue-100 text-blue-700' },
    cancelled: { label: 'Anulată', className: 'bg-red-100 text-red-600' },
  }
  const { label, className } = map[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return <span className={`text-xs font-sans font-semibold px-2.5 py-1 rounded-full ${className}`}>{label}</span>
}
