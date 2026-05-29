'use client'

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface MonthData {
  month: string
  bookings: number
  clients: number
  revenue: number
}

export default function AdminCharts({ data }: { data: MonthData[] }) {
  return (
    <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">

      {/* Revenue Area Chart */}
      <div className="bg-gray-900 rounded-2xl border border-white/5 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif font-bold text-white text-base">Venit estimat</h3>
            <p className="text-gray-500 font-sans text-xs mt-0.5">Ultimele 6 luni</p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c97d4e" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#c97d4e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08"/>
            <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'sans-serif' }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'sans-serif' }} axisLine={false} tickLine={false}/>
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #ffffff15', borderRadius: 12, color: '#fff', fontFamily: 'sans-serif', fontSize: 12 }}
              labelStyle={{ color: '#9ca3af' }}
              formatter={(v: unknown) => [`${v} €`, 'Venit']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#c97d4e" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ fill: '#c97d4e', r: 4, strokeWidth: 0 }}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Sessions + Clients Bar Chart */}
      <div className="bg-gray-900 rounded-2xl border border-white/5 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif font-bold text-white text-base">Sesiuni & Cliente noi</h3>
            <p className="text-gray-500 font-sans text-xs mt-0.5">Ultimele 6 luni</p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08"/>
            <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'sans-serif' }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'sans-serif' }} axisLine={false} tickLine={false}/>
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #ffffff15', borderRadius: 12, color: '#fff', fontFamily: 'sans-serif', fontSize: 12 }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'sans-serif', color: '#9ca3af', paddingTop: 8 }}/>
            <Bar dataKey="bookings" name="Sesiuni" fill="#c97d4e" radius={[4, 4, 0, 0]}/>
            <Bar dataKey="clients" name="Cliente noi" fill="#6366f1" radius={[4, 4, 0, 0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
