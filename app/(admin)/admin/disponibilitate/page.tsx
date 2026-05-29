'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO, addDays } from 'date-fns'
import { ro } from 'date-fns/locale'

interface Slot { id: string; date: string; start_time: string; end_time: string; is_booked: boolean }

const TIMES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']

export default function DisponibilitatePage() {
  const [slots, setSlots] = useState<Record<string, Slot[]>>({})
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('11:00')
  const [adding, setAdding] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkDays, setBulkDays] = useState<string[]>([])

  useEffect(() => { loadSlots() }, [])

  const loadSlots = async () => {
    setLoading(true)
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('availability').select('*')
      .gte('date', today).order('date').order('start_time')
    const grouped: Record<string, Slot[]> = {}
    data?.forEach(s => { if (!grouped[s.date]) grouped[s.date] = []; grouped[s.date].push(s) })
    setSlots(grouped)
    setLoading(false)
  }

  const addSlot = async () => {
    if ((!bulkMode && !date) || (bulkMode && bulkDays.length === 0)) return
    setAdding(true)
    const supabase = createClient()
    for (const d of bulkMode ? bulkDays : [date]) {
      await supabase.from('availability').upsert(
        { date: d, start_time: startTime, end_time: endTime, is_booked: false },
        { onConflict: 'date,start_time', ignoreDuplicates: true }
      )
    }
    await loadSlots()
    if (!bulkMode) setDate('')
    setBulkDays([])
    setAdding(false)
  }

  const deleteSlot = async (id: string) => {
    const supabase = createClient()
    await supabase.from('availability').delete().eq('id', id)
    await loadSlots()
  }

  const next14 = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1).toISOString().split('T')[0])
  const toggleDay = (d: string) => setBulkDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])

  const totalFree = Object.values(slots).flat().filter(s => !s.is_booked).length
  const totalBooked = Object.values(slots).flat().filter(s => s.is_booked).length

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white">Disponibilitate</h1>
          <p className="text-gray-400 font-sans text-sm mt-0.5">Setează slot-urile pentru sesiuni</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-900 rounded-xl px-3 py-2 border border-white/5 text-center">
            <p className="text-lg font-serif font-bold text-green-400">{totalFree}</p>
            <p className="text-xs text-gray-500 font-sans">Libere</p>
          </div>
          <div className="bg-gray-900 rounded-xl px-3 py-2 border border-white/5 text-center">
            <p className="text-lg font-serif font-bold text-[#c97d4e]">{totalBooked}</p>
            <p className="text-xs text-gray-500 font-sans">Rezervate</p>
          </div>
        </div>
      </div>

      {/* Add form */}
      <div className="bg-gray-900 rounded-2xl border border-white/5 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif font-bold text-white text-base sm:text-lg">Adaugă slot nou</h2>
          <button onClick={() => { setBulkMode(!bulkMode); setBulkDays([]) }}
            className="text-xs font-sans text-[#c97d4e] hover:underline flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <rect x="8" y="2" width="8" height="4" rx="1"/><path d="M3 10h18M3 14h18M3 18h18" strokeLinecap="round"/>
            </svg>
            {bulkMode ? 'Mod simplu' : 'Mai multe zile'}
          </button>
        </div>

        <div className={`grid gap-4 mb-4 ${bulkMode ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
          {!bulkMode && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5 font-sans">Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 font-sans focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]" />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5 font-sans">Ora de start</label>
            <select value={startTime} onChange={e => setStartTime(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 font-sans focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]">
              {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5 font-sans">Ora de final</label>
            <select value={endTime} onChange={e => setEndTime(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 font-sans focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]">
              {TIMES.filter(t => t > startTime).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {bulkMode && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-300 mb-2 font-sans">Selectează zilele:</p>
            <div className="flex flex-wrap gap-2">
              {next14.map(day => (
                <button key={day} type="button" onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-sans font-semibold border-2 transition-all active:scale-95 ${
                    bulkDays.includes(day)
                      ? 'border-[#c97d4e] bg-[#c97d4e] text-white'
                      : 'border-white/10 text-gray-400 hover:border-[#c97d4e]/40 bg-gray-800'
                  }`}>
                  {format(parseISO(day), 'EEE d MMM', { locale: ro })}
                </button>
              ))}
            </div>
          </div>
        )}

        <button onClick={addSlot}
          disabled={adding || (!bulkMode && !date) || (bulkMode && bulkDays.length === 0)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#c97d4e] to-[#a85e35] text-white font-sans font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
          </svg>
          {adding ? 'Se adaugă...' : `Adaugă ${bulkMode ? bulkDays.length : 1} slot${(bulkMode ? bulkDays.length : 1) > 1 ? '-uri' : ''}`}
        </button>
      </div>

      {/* Existing slots */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#c97d4e] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : Object.keys(slots).length === 0 ? (
        <div className="bg-gray-900 rounded-2xl border border-white/5 p-10 text-center text-gray-500 font-sans text-sm">
          Nu există slot-uri. Adaugă unul mai sus.
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(slots).map(([date, daySlots]) => (
            <div key={date} className="bg-gray-900 rounded-2xl border border-white/5 p-4 sm:p-5">
              <h3 className="font-serif font-semibold text-white mb-3 text-sm sm:text-base capitalize">
                {format(parseISO(date), "EEEE, d MMMM yyyy", { locale: ro })}
              </h3>
              <div className="flex flex-wrap gap-2">
                {daySlots.map(slot => (
                  <div key={slot.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-sans border transition-colors ${
                    slot.is_booked ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-white/10 bg-gray-800 text-gray-300'
                  }`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" strokeLinecap="round"/>
                    </svg>
                    <span className="font-semibold">{slot.start_time}–{slot.end_time}</span>
                    {slot.is_booked
                      ? <span className="text-xs font-bold text-green-400">✓ Rezervat</span>
                      : <button onClick={() => deleteSlot(slot.id)} className="text-gray-600 hover:text-red-400 transition-colors ml-1">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
                          </svg>
                        </button>
                    }
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
