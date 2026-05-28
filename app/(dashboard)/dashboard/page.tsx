import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, ArrowRight, CheckCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'

export default async function DashboardHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('client_id', user.id)
    .order('scheduled_at', { ascending: false })
    .limit(5)

  const nextBooking = bookings?.find(b =>
    b.status !== 'cancelled' && new Date(b.scheduled_at) > new Date()
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif text-gray-900">
          Bună, {profile?.full_name?.split(' ')[0] || 'prietenă'}! 👋
        </h1>
        <p className="text-gray-500 font-sans mt-1">Bine ai revenit în platforma ta de mentorat.</p>
      </div>

      {/* Urmatoarea sesiune */}
      {nextBooking ? (
        <div className="bg-[#c97d4e] text-white rounded-2xl p-6">
          <p className="text-white/70 text-sm font-sans mb-1">Următoarea ta sesiune</p>
          <p className="text-2xl font-bold font-serif">
            {format(new Date(nextBooking.scheduled_at), "EEEE, d MMMM 'la' HH:mm", { locale: ro })}
          </p>
          {nextBooking.meet_link && (
            <a
              href={nextBooking.meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 bg-white text-[#c97d4e] font-sans font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white/90 transition-colors"
            >
              Intră în sesiune →
            </a>
          )}
          {!nextBooking.meet_link && (
            <p className="text-white/70 text-sm mt-3 font-sans">Link-ul de sesiune va fi trimis în curând de Roxana.</p>
          )}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-[#c97d4e]/30 rounded-2xl p-6 text-center">
          <Calendar className="w-10 h-10 text-[#c97d4e]/50 mx-auto mb-3" />
          <p className="font-semibold text-gray-700 mb-1 font-serif">Nu ai nicio sesiune programată</p>
          <p className="text-gray-500 text-sm mb-4 font-sans">Programează prima ta sesiune cu Roxana acum!</p>
          <Link
            href="/dashboard/prenota"
            className="inline-flex items-center gap-2 bg-[#c97d4e] text-white font-sans font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-[#a85e35] transition-colors"
          >
            Programează sesiunea <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Card rapide */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/dashboard/prenota" className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#c97d4e]/30 hover:shadow-sm transition-all group">
          <Calendar className="w-8 h-8 text-[#c97d4e] mb-3" />
          <h3 className="font-bold text-gray-900 mb-1 font-serif group-hover:text-[#c97d4e] transition-colors">Programează o sesiune</h3>
          <p className="text-gray-500 text-sm font-sans">Alege un slot disponibil din calendarul Roxanei</p>
        </Link>
        <Link href="/dashboard/profil" className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#c97d4e]/30 hover:shadow-sm transition-all group">
          <CheckCircle className="w-8 h-8 text-[#c97d4e] mb-3" />
          <h3 className="font-bold text-gray-900 mb-1 font-serif group-hover:text-[#c97d4e] transition-colors">Profilul meu</h3>
          <p className="text-gray-500 text-sm font-sans">Actualizează datele și schimbă parola</p>
        </Link>
      </div>

      {/* Istoricul sesiunilor */}
      {bookings && bookings.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-lg font-serif mb-4">Istoricul sesiunilor</h2>
          <div className="space-y-3">
            {bookings.map(booking => (
              <div key={booking.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700 font-sans">
                      {format(new Date(booking.scheduled_at), "d MMM yyyy, HH:mm", { locale: ro })}
                    </p>
                    {booking.admin_notes && (
                      <p className="text-xs text-gray-500 font-sans mt-0.5">{booking.admin_notes}</p>
                    )}
                  </div>
                </div>
                <StatusBadge status={booking.status} />
              </div>
            ))}
          </div>
        </div>
      )}
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
