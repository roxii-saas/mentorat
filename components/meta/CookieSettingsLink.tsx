'use client'

// Permette di cambiare idea sul consenso (revocare deve essere facile quanto accettare).
// Non compare se il Pixel non è configurato.
export default function CookieSettingsLink({ className = '', separatorClassName }: {
  className?: string; separatorClassName?: string
}) {
  if (!process.env.NEXT_PUBLIC_META_PIXEL_ID) return null
  return (
    <>
      {separatorClassName && <span className={separatorClassName}>·</span>}
      <button type="button" className={className}
        onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}>
        Setări cookie
      </button>
    </>
  )
}
