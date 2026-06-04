'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'

interface HomeSettings {
  comparison_price: number
  cta_text: string
  cta_show_price: boolean
  secondary_cta_text: string
  cta_badge_text: string
  hero_image_url: string | null
  mentor_image_url: string | null
}

interface GalleryImage {
  name: string
  url: string
  size: number
}

type ImageField = 'hero_image_url' | 'mentor_image_url'

export default function HomepagePage() {
  const [settings, setSettings] = useState<HomeSettings>({
    comparison_price: 1376,
    cta_text: 'Vreau să mă transform',
    cta_show_price: true,
    secondary_cta_text: 'Cum funcționează',
    cta_badge_text: 'Mentorat exclusiv · Locuri limitate',
    hero_image_url: null,
    mentor_image_url: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [gallery, setGallery] = useState<GalleryImage[]>([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState<ImageField | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const heroInputRef = useRef<HTMLInputElement>(null)
  const mentorInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/homepage')
      .then(r => r.json())
      .then(d => {
        if (d && !d.error) setSettings(s => ({ ...s, ...d }))
        setLoading(false)
      })
  }, [])

  const loadGallery = useCallback(async () => {
    setGalleryLoading(true)
    const r = await fetch('/api/admin/gallery')
    const d = await r.json()
    setGallery(d.images ?? [])
    setGalleryLoading(false)
  }, [])

  const openPicker = async (field: ImageField) => {
    setPickerOpen(field)
    setUploadError('')
    if (gallery.length === 0) await loadGallery()
  }

  const uploadFile = async (file: File, field: ImageField) => {
    setUploading(true)
    setUploadError('')
    const fd = new FormData()
    fd.append('file', file)
    const r = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const d = await r.json()
    setUploading(false)
    if (d.error) { setUploadError(d.error); return }
    setSettings(s => ({ ...s, [field]: d.url }))
    setGallery(g => [{ name: d.path, url: d.url, size: file.size }, ...g])
    setPickerOpen(null)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, field: ImageField) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file, field)
    e.target.value = ''
  }

  const selectFromGallery = (url: string) => {
    if (!pickerOpen) return
    setSettings(s => ({ ...s, [pickerOpen]: url }))
    setPickerOpen(null)
  }

  const clearImage = (field: ImageField) => {
    setSettings(s => ({ ...s, [field]: null }))
  }

  const save = async () => {
    setSaving(true)
    const r = await fetch('/api/admin/homepage', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    const d = await r.json()
    setSaving(false)
    if (!d.error) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-[#ED03E9]/30 border-t-[#ED03E9] animate-spin" />
    </div>
  )

  const imageLabels: Record<ImageField, string> = {
    hero_image_url: 'Imagine Hero (secțiunea principală)',
    mentor_image_url: 'Imagine Mentorul tău',
  }
  const imageInputRefs: Record<ImageField, React.RefObject<HTMLInputElement | null>> = {
    hero_image_url: heroInputRef,
    mentor_image_url: mentorInputRef,
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold db-text">Home page</h1>
          <p className="db-muted font-sans text-sm mt-0.5">Modifică conținutul afișat pe landing page</p>
        </div>
        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ED03E9] to-[#6B00E8] text-white font-sans font-semibold px-6 py-2.5 rounded-xl shadow-md shadow-[#ED03E9]/20 hover:shadow-[#ED03E9]/40 transition-all disabled:opacity-60 active:scale-[.98]">
          {saving ? (
            <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Se salvează...</>
          ) : saved ? (
            <><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/></svg>Salvat!</>
          ) : (
            <><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M4 13V16h3l9-9-3-3-9 9zM14.5 6.5l-1-1" strokeLinecap="round" strokeLinejoin="round"/></svg>Salvează modificările</>
          )}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ── Prețuri ── */}
        <div className="g-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(237,3,233,0.08)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#ED03E9" strokeWidth="1.8" className="w-5 h-5">
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h2 className="font-serif font-bold db-text">Prețuri</h2>
              <p className="db-muted text-xs font-sans mt-0.5">Prețul curent se modifică din Setări</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold db-muted font-sans uppercase tracking-wider mb-2">
                Preț de comparație (tăiat) — €
              </label>
              <div className="relative">
                <input
                  type="number" min="0" step="1"
                  value={settings.comparison_price}
                  onChange={e => setSettings(s => ({ ...s, comparison_price: Number(e.target.value) }))}
                  className="w-full bg-black/[.03] border border-black/[.08] db-text rounded-xl px-4 py-3 font-sans text-base focus:outline-none focus:ring-2 focus:ring-[#ED03E9]/30 focus:border-[#ED03E9]/50"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm db-muted font-sans">€</span>
              </div>
              <p className="text-xs db-muted font-sans mt-1.5">
                Apare tăiat în secțiunea de prețuri. Ex: <span className="line-through">1.376€</span>
              </p>
            </div>

            <div className="bg-[#ED03E9]/5 border border-[#ED03E9]/15 rounded-xl p-3.5">
              <p className="text-xs font-sans text-[#B800BA] font-semibold mb-0.5">Previzualizare economii</p>
              <p className="text-sm font-sans db-text">
                Clienta economisește{' '}
                <strong className="text-[#ED03E9]">
                  {Math.max(0, settings.comparison_price - 297).toLocaleString('ro-RO')}€
                </strong>
                {' '}față de prețul de comparație
              </p>
            </div>
          </div>
        </div>

        {/* ── Butoane CTA ── */}
        <div className="g-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(107,0,232,0.08)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#6B00E8" strokeWidth="1.8" className="w-5 h-5">
                <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2 className="font-serif font-bold db-text">Butoane CTA</h2>
              <p className="db-muted text-xs font-sans mt-0.5">Configurează toate butoanele de acțiune</p>
            </div>
          </div>

          <div className="space-y-5">

            {/* Badge deasupra titlului hero */}
            <div>
              <label className="block text-xs font-bold db-muted font-sans uppercase tracking-wider mb-2">
                Text badge hero (deasupra titlului)
              </label>
              <input
                type="text"
                value={settings.cta_badge_text}
                onChange={e => setSettings(s => ({ ...s, cta_badge_text: e.target.value }))}
                placeholder="Mentorat exclusiv · Locuri limitate"
                className="w-full bg-black/[.03] border border-black/[.08] db-text rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#ED03E9]/30 focus:border-[#ED03E9]/50 placeholder:text-[#ABABAB]"
              />
              <div className="mt-2 inline-flex items-center gap-2 bg-[#ED03E9]/8 border border-[#ED03E9]/20 text-[#B800BA] text-[11px] font-bold px-3 py-1.5 rounded-full tracking-[.12em] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ED03E9]"/>
                {settings.cta_badge_text || 'Mentorat exclusiv · Locuri limitate'}
              </div>
            </div>

            {/* Text buton principal */}
            <div>
              <label className="block text-xs font-bold db-muted font-sans uppercase tracking-wider mb-2">
                Text buton principal (CTA)
              </label>
              <input
                type="text"
                value={settings.cta_text}
                onChange={e => setSettings(s => ({ ...s, cta_text: e.target.value }))}
                placeholder="Vreau să mă transform"
                className="w-full bg-black/[.03] border border-black/[.08] db-text rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#ED03E9]/30 focus:border-[#ED03E9]/50 placeholder:text-[#ABABAB]"
              />
            </div>

            {/* Toggle preț pe buton */}
            <div className="flex items-center justify-between p-4 bg-black/[.03] rounded-xl border border-black/[.06]">
              <div>
                <p className="text-sm font-semibold db-text font-sans">Afișează prețul pe buton</p>
                <p className="text-xs db-muted font-sans mt-0.5">
                  {settings.cta_show_price
                    ? `Butonul va arăta: "${settings.cta_text || 'Vreau să mă transform'} — 297€"`
                    : `Butonul va arăta: "${settings.cta_text || 'Vreau să mă transform'}"`
                  }
                </p>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, cta_show_price: !s.cta_show_price }))}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${settings.cta_show_price ? 'bg-[#ED03E9]' : 'bg-black/20'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.cta_show_price ? 'translate-x-5' : 'translate-x-0.5'}`}/>
              </button>
            </div>

            {/* Text buton secundar */}
            <div>
              <label className="block text-xs font-bold db-muted font-sans uppercase tracking-wider mb-2">
                Text buton secundar (lângă CTA principal)
              </label>
              <input
                type="text"
                value={settings.secondary_cta_text}
                onChange={e => setSettings(s => ({ ...s, secondary_cta_text: e.target.value }))}
                placeholder="Cum funcționează"
                className="w-full bg-black/[.03] border border-black/[.08] db-text rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#ED03E9]/30 focus:border-[#ED03E9]/50 placeholder:text-[#ABABAB]"
              />
            </div>

          </div>

          {/* Previzualizare */}
          <div className="mt-5 pt-5 border-t border-black/[.05]">
            <p className="text-xs font-bold db-muted font-sans uppercase tracking-wider mb-3">Previzualizare</p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ED03E9] to-[#6B00E8] text-white font-sans font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-[#ED03E9]/20">
                {settings.cta_text || 'Vreau să mă transform'}
                {settings.cta_show_price && ' — 297€'}
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                  <path d="M4 10h12M10 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-sans font-semibold text-[#3D3D3D] px-5 py-2.5 rounded-xl border border-black/10">
                {settings.secondary_cta_text || 'Cum funcționează'}
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M10 4v12M4 10l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Imagini ── */}
      <div className="g-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(16,185,129,0.08)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.8" className="w-5 h-5">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h2 className="font-serif font-bold db-text">Imagini</h2>
            <p className="db-muted text-xs font-sans mt-0.5">Imaginile afișate pe landing page · JPG, PNG, WebP · max 5MB</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {(['hero_image_url', 'mentor_image_url'] as ImageField[]).map(field => {
            const currentUrl = settings[field]
            return (
              <div key={field}>
                <p className="text-xs font-bold db-muted font-sans uppercase tracking-wider mb-3">{imageLabels[field]}</p>

                {/* Preview */}
                <div className="relative rounded-2xl overflow-hidden bg-black/[.04] border border-black/[.06] aspect-[3/4] mb-3 group">
                  {currentUrl ? (
                    <>
                      <Image
                        src={currentUrl} alt="Preview" fill
                        className="object-cover object-top"
                        unoptimized={currentUrl.startsWith('http')}
                        sizes="300px"
                      />
                      <button onClick={() => clearImage(field)}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                          <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#ABABAB" strokeWidth="1.5" className="w-10 h-10">
                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <p className="text-xs db-muted font-sans">Imaginea implicită (roxana.jpg)</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <input
                    ref={imageInputRefs[field] as React.RefObject<HTMLInputElement>}
                    type="file" accept="image/*" className="hidden"
                    onChange={e => handleFileInput(e, field)}
                  />
                  <button
                    onClick={() => imageInputRefs[field].current?.click()}
                    disabled={uploading}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-sans font-semibold db-text border border-black/[.10] rounded-xl py-2 hover:bg-black/[.04] transition-colors disabled:opacity-50">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <path d="M4 16v1a1 1 0 001 1h10a1 1 0 001-1v-1M9 12V4m0 0L6 7m3-3l3 3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {uploading ? 'Se încarcă...' : 'Încarcă'}
                  </button>
                  <button
                    onClick={() => openPicker(field)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-sans font-semibold text-[#ED03E9] border border-[#ED03E9]/30 rounded-xl py-2 hover:bg-[#ED03E9]/5 transition-colors">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <path d="M4 6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" strokeLinecap="round"/>
                      <path d="M4 10h12M10 4v12" strokeLinecap="round"/>
                    </svg>
                    Galerie
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {uploadError && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-sans">
            {uploadError}
          </div>
        )}
      </div>

      {/* ── Gallery Picker Modal ── */}
      {pickerOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
          onClick={() => setPickerOpen(null)}>
          <div className="g-card rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[85vh] flex flex-col border border-black/[.08] shadow-2xl"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-5 py-4 border-b border-black/[.05]">
              <div>
                <h3 className="font-serif font-bold db-text">Galerie imagini</h3>
                <p className="db-muted text-xs font-sans mt-0.5">{imageLabels[pickerOpen]}</p>
              </div>
              <button onClick={() => setPickerOpen(null)} className="w-8 h-8 rounded-xl hover:bg-black/[.06] db-muted flex items-center justify-center transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {/* Upload inline nel modal */}
              <div className="mb-4">
                <input
                  type="file" accept="image/*" className="hidden"
                  id="modal-upload"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, pickerOpen); e.target.value = '' }}
                />
                <label htmlFor="modal-upload"
                  className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-[#ED03E9]/30 rounded-xl py-4 text-sm font-sans font-semibold text-[#ED03E9] hover:bg-[#ED03E9]/5 cursor-pointer transition-colors">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M4 16v1a1 1 0 001 1h10a1 1 0 001-1v-1M9 12V4m0 0L6 7m3-3l3 3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {uploading ? 'Se încarcă...' : 'Încarcă imagine nouă'}
                </label>
              </div>

              {galleryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-7 h-7 rounded-full border-2 border-[#ED03E9]/30 border-t-[#ED03E9] animate-spin" />
                </div>
              ) : gallery.length === 0 ? (
                <div className="text-center py-12 db-muted font-sans text-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mx-auto mb-3 opacity-30">
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Nu există imagini în galerie. Încarcă prima imagine!
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {gallery.map(img => {
                    const isSelected = settings[pickerOpen] === img.url
                    return (
                      <button key={img.name} onClick={() => selectFromGallery(img.url)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02] ${isSelected ? 'border-[#ED03E9] shadow-lg shadow-[#ED03E9]/20' : 'border-transparent hover:border-[#ED03E9]/40'}`}>
                        <Image src={img.url} alt={img.name} fill className="object-cover" sizes="120px" unoptimized/>
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#ED03E9]/20 flex items-center justify-center">
                            <div className="w-6 h-6 bg-[#ED03E9] rounded-full flex items-center justify-center">
                              <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" className="w-3.5 h-3.5">
                                <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-black/[.05] flex justify-end gap-2">
              <button onClick={() => setPickerOpen(null)} className="px-5 py-2 text-sm font-sans font-semibold db-muted border border-black/[.08] rounded-xl hover:bg-black/[.04] transition-colors">
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
