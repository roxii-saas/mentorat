'use client'

import { useState } from 'react'

export default function ResendEmailBtn({ userId, email }: { userId: string; email: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  const handleResend = async () => {
    if (!confirm(`Reinviare email con credenziali a ${email}?`)) return
    setState('loading')
    const res = await fetch('/api/admin/resend-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    setState(res.ok ? 'ok' : 'error')
    setTimeout(() => setState('idle'), 4000)
  }

  return (
    <button onClick={handleResend} disabled={state === 'loading'}
      title="Retrimite email cu credențiale"
      className={`inline-flex items-center gap-1 text-[11px] font-sans font-semibold px-2.5 py-1 rounded-lg transition-all ${
        state === 'ok'    ? 'bg-green-50 text-green-700 border border-green-200' :
        state === 'error' ? 'bg-red-50 text-red-600 border border-red-200' :
        'bg-[#ED03E9]/8 text-[#B800BA] border border-[#ED03E9]/20 hover:bg-[#ED03E9]/15'
      }`}>
      {state === 'loading' ? (
        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {state === 'ok' ? 'Trimis!' : state === 'error' ? 'Eroare' : 'Email'}
    </button>
  )
}
