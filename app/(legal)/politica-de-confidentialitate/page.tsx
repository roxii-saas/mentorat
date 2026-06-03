export const metadata = { title: 'Politica de Confidențialitate — Mentorat cu Roxana' }

export default function PoliticaConfidentialitate() {
  return (
    <article className="prose prose-sm sm:prose max-w-none text-[#3D3D3D]">
      <h1 className="font-serif text-[#0A0A0A]">Politica de Confidențialitate</h1>
      <p className="text-[#737373] text-sm">Ultima actualizare: iunie 2025</p>

      <p>
        Prezenta Politică de Confidențialitate descrie modul în care <strong>Roxana Dinca</strong>
        {' '}(denumită în continuare „Operatorul"), cu activitate desfășurată în România, colectează,
        utilizează și protejează datele cu caracter personal ale utilizatorilor platformei
        <strong> mentorat.roxii-dinca.com</strong>, în conformitate cu Regulamentul (UE) 2016/679
        (GDPR) și legislația română aplicabilă.
      </p>

      <h2 className="font-serif text-[#0A0A0A]">1. Datele colectate</h2>
      <p>Colectăm următoarele date personale:</p>
      <ul>
        <li><strong>Date de identificare:</strong> nume complet, adresă de email, număr de telefon</li>
        <li><strong>Date de plată:</strong> procesate exclusiv prin <strong>Stripe, Inc.</strong> — Operatorul nu stochează date bancare sau de card</li>
        <li><strong>Date tehnice:</strong> adresa IP, tipul de browser, paginile vizitate (prin cookie-uri — a se vedea Politica de Cookie)</li>
        <li><strong>Date de comunicare:</strong> mesajele transmise prin email sau prin platformă</li>
      </ul>

      <h2 className="font-serif text-[#0A0A0A]">2. Scopul prelucrării datelor</h2>
      <ul>
        <li>Executarea contractului de mentorat (rezervarea locului, programarea sesiunilor)</li>
        <li>Procesarea plăților prin Stripe</li>
        <li>Comunicarea cu clienta privind pașii următori în program</li>
        <li>Respectarea obligațiilor legale (contabilitate, fiscalitate)</li>
        <li>Trimiterea de comunicări legate de serviciul achiziționat</li>
      </ul>

      <h2 className="font-serif text-[#0A0A0A]">3. Temeiul juridic al prelucrării</h2>
      <ul>
        <li><strong>Executarea contractului</strong> (art. 6 alin. 1 lit. b GDPR) — pentru rezervare și mentorat</li>
        <li><strong>Obligație legală</strong> (art. 6 alin. 1 lit. c GDPR) — pentru documente contabile</li>
        <li><strong>Consimțământ</strong> (art. 6 alin. 1 lit. a GDPR) — pentru cookie-uri ne-esențiale</li>
        <li><strong>Interes legitim</strong> (art. 6 alin. 1 lit. f GDPR) — pentru securitatea platformei</li>
      </ul>

      <h2 className="font-serif text-[#0A0A0A]">4. Durata păstrării datelor</h2>
      <p>
        Datele personale sunt păstrate pe perioada necesară scopului colectării, dar nu mai mult de:
      </p>
      <ul>
        <li><strong>Date de rezervare și mentorat:</strong> 3 ani de la ultima interacțiune</li>
        <li><strong>Date de facturare:</strong> 10 ani (conform legislației contabile românești)</li>
        <li><strong>Date tehnice (cookie-uri):</strong> maximum 2 ani</li>
      </ul>

      <h2 className="font-serif text-[#0A0A0A]">5. Destinatarii datelor</h2>
      <p>Datele pot fi transferate către:</p>
      <ul>
        <li><strong>Stripe, Inc.</strong> — procesare plăți (Privacy Policy: stripe.com/privacy)</li>
        <li><strong>Supabase, Inc.</strong> — stocare date (bază de date securizată, UE)</li>
        <li><strong>Resend, Inc.</strong> — trimitere email-uri tranzacționale</li>
        <li><strong>Vercel, Inc.</strong> — hosting platformă</li>
      </ul>
      <p>
        Nu vindem, nu închiriem și nu transmitem datele tale către terți în scop comercial.
        Toți furnizorii de mai sus sunt conformi GDPR și asigură protecția adecvată a datelor.
      </p>

      <h2 className="font-serif text-[#0A0A0A]">6. Drepturile tale</h2>
      <p>Conform GDPR, ai dreptul la:</p>
      <ul>
        <li><strong>Acces</strong> — să obții o copie a datelor tale prelucrate</li>
        <li><strong>Rectificare</strong> — corectarea datelor inexacte</li>
        <li><strong>Ștergere</strong> — ștergerea datelor, în condițiile legii</li>
        <li><strong>Restricționarea prelucrării</strong> — în anumite situații prevăzute de GDPR</li>
        <li><strong>Portabilitate</strong> — primirea datelor în format structurat</li>
        <li><strong>Opoziție</strong> — la prelucrarea bazată pe interes legitim</li>
        <li><strong>Plângere</strong> — la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP), cu sediul în București, B-dul G-ral. Gheorghe Magheru nr. 28-30, anspdcp.ro</li>
      </ul>

      <h2 className="font-serif text-[#0A0A0A]">7. Securitatea datelor</h2>
      <p>
        Implementăm măsuri tehnice și organizatorice adecvate pentru protejarea datelor tale:
        comunicare criptată SSL/TLS, acces restricționat la baza de date, parole securizate,
        stocarea datelor de plată exclusiv prin Stripe (PCI DSS Compliant).
      </p>

      <h2 className="font-serif text-[#0A0A0A]">8. Transferuri internaționale</h2>
      <p>
        Unii furnizori de servicii (Stripe, Supabase, Resend) pot prelucra date în SUA.
        Transferurile se realizează pe baza Deciziei de adecvare UE-SUA (Data Privacy Framework)
        sau a clauzelor contractuale standard adoptate de Comisia Europeană.
      </p>

      <h2 className="font-serif text-[#0A0A0A]">9. Contact</h2>
      <p>
        Pentru orice solicitare privind datele tale personale, ne poți contacta la:
        <br/>
        📧 <strong>roxana@roxii-dinca.com</strong>
        <br/>
        Vom răspunde în termen de maximum 30 de zile calendaristice.
      </p>
    </article>
  )
}
