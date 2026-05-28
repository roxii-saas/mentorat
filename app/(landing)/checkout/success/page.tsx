import Link from 'next/link'

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#fdf8f3] flex items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-4xl font-bold font-serif text-gray-900 mb-4">
          Felicitări! Plata a fost confirmată!
        </h1>
        <p className="text-lg text-gray-600 font-sans mb-4 leading-relaxed">
          Contul tău a fost creat automat. Vei primi un email cu datele de acces în câteva minute.
        </p>
        <p className="text-gray-500 font-sans text-sm mb-8">
          Verifică și <strong>folderul Spam</strong> dacă nu găsești emailul în inbox.
        </p>
        <Link
          href="/login"
          className="inline-block bg-[#c97d4e] hover:bg-[#a85e35] text-white font-sans font-semibold px-10 py-4 rounded-xl transition-colors text-lg"
        >
          Intră în platformă →
        </Link>
      </div>
    </div>
  )
}
