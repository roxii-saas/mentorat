'use client'

import { useState } from 'react'

export default function ResendEmailBtn({ purchaseId, email }: { purchaseId: string; email: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  const handleResend = async () => {
    if (!confirm(`Retrimite email de confirmare la ${email}?`)) return
    setState('loading')
    const res = await fetch('/api/admin/resend-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchaseId }),
    })
    setState(res.ok ? 'ok' : 'error')
    if (!res.ok) {
      // Mostra il motivo reale (es. chiave Resend non valida) invece del solo "Eroare"
      const d = await res.json().catch(() => null)
      alert(`Emailul nu a putut fi trimis.\n\n${d?.message ?? d?.error ?? `Eroare ${res.status}`}`)
    }
    setTimeout(() => setState('idle'), 4000)
  }

  return (
    <button type="button" onClick={handleResend} disabled={state === 'loading'}
      title="Retrimite email de confirmare"
      className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[13px] leading-5 font-semibold transition-colors disabled:opacity-70 ${
        state === 'ok'    ? 'bg-[#E3F6EE] text-[#0B6B49] border-[#0B6B49]/30' :
        state === 'error' ? 'bg-[#FDE8E6] text-[#B42318] border-[#B42318]/30' :
        'bg-white text-[#15151C] border-[#D3D3DF] hover:bg-[#F6F6FA]'
      }`}>
      {state === 'loading' ? (
        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden>
          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      )}
      {state === 'loading' ? 'Se trimite' : state === 'ok' ? 'Trimis!' : state === 'error' ? 'Eroare' : 'Email'}
    </button>
  )
}
