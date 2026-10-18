export const metadata = { title: 'Politica de Cookie — Mentorat cu Roxana' }

export default function PoliticaCookie() {
  return (
    <article className="prose prose-sm sm:prose max-w-none text-[#3D3D3D]">
      <h1 className="font-serif text-[#0A0A0A]">Politica de Cookie</h1>
      <p className="text-[#737373] text-sm">Ultima actualizare: octombrie 2026</p>

      <p>
        Platforma <strong>mentorat.roxii-dinca.com</strong> utilizează cookie-uri și tehnologii similare
        pentru a asigura funcționarea corectă a site-ului și pentru a îmbunătăți experiența utilizatorilor,
        în conformitate cu Legea nr. 506/2004 privind prelucrarea datelor cu caracter personal și
        protecția vieții private în sectorul comunicațiilor electronice și cu GDPR.
      </p>

      <h2 className="font-serif text-[#0A0A0A]">1. Ce sunt cookie-urile?</h2>
      <p>
        Cookie-urile sunt fișiere text de mici dimensiuni stocate pe dispozitivul tău (calculator,
        telefon, tabletă) atunci când vizitezi un site web. Ele permit site-ului să-ți rețină
        preferințele și să funcționeze corect la vizite ulterioare.
      </p>

      <h2 className="font-serif text-[#0A0A0A]">2. Tipuri de cookie-uri utilizate</h2>

      <h3 className="font-serif text-[#0A0A0A]">a) Cookie-uri esențiale (necesare)</h3>
      <p>
        Aceste cookie-uri sunt strict necesare pentru funcționarea platformei.
        Nu pot fi dezactivate fără a afecta funcționalitatea site-ului.
        Nu stochează informații de identificare personală.
      </p>
      <table>
        <thead>
          <tr><th>Nume</th><th>Scop</th><th>Durată</th></tr>
        </thead>
        <tbody>
          <tr><td><code>sb-auth-token</code></td><td>Autentificare Supabase</td><td>Sesiune</td></tr>
          <tr><td><code>sb-refresh-token</code></td><td>Reîmprospătare sesiune</td><td>7 zile</td></tr>
          <tr><td><code>__stripe_mid</code></td><td>Protecție anti-fraudă Stripe</td><td>1 an</td></tr>
          <tr><td><code>__stripe_sid</code></td><td>Sesiune Stripe</td><td>30 minute</td></tr>
        </tbody>
      </table>

      <h3 className="font-serif text-[#0A0A0A]">b) Cookie-uri funcționale</h3>
      <p>
        Rețin preferințele tale (ex: perioada selectată în panoul admin) pentru a îmbunătăți
        experiența pe platformă. Nu colectează date în scopuri publicitare.
      </p>
      <table>
        <thead>
          <tr><th>Nume</th><th>Scop</th><th>Durată</th></tr>
        </thead>
        <tbody>
          <tr><td><code>admin-period</code></td><td>Preferință perioadă analiză (admin)</td><td>localStorage</td></tr>
          <tr><td><code>sb-col</code></td><td>Stare sidebar (extins/colapsat)</td><td>localStorage</td></tr>
          <tr><td><code>ov_filters</code></td><td>Filtrele alese în panoul admin (doar pentru administratoare)</td><td>1 an</td></tr>
        </tbody>
      </table>

      <h3 className="font-serif text-[#0A0A0A]">c) Cookie-uri de performanță</h3>
      <p>
        Nu utilizăm servicii de analiză terțe (Google Analytics, etc.). Pentru a înțelege câți vizitatori
        avem și de unde vin, folosim o statistică proprie, anonimă, <strong>fără cookie-uri și fără a stoca
        nimic pe dispozitivul tău</strong>: un cod aleatoriu valabil doar în ziua respectivă, calculat pe server
        din date tehnice ale cererii, fără a păstra adresa IP. Se rețin doar țara/orașul aproximativ, tipul
        de dispozitiv și browser, sursa vizitei, paginile vizitate și etapa atinsă (de ex. „a ajuns în checkout”),
        timp de maximum 90 de zile. Nu se măsoară vizitatorii care au activat „Do Not Track” / Global Privacy Control. Dacă acest lucru se va schimba, vom actualiza prezenta politică
        și vom solicita consimțământul tău.
      </p>

      <h3 className="font-serif text-[#0A0A0A]">d) Cookie-uri de marketing / publicitate</h3>
      <p>
        Folosim <strong>Meta Pixel</strong> și <strong>API-ul de conversii Meta</strong> (Meta Platforms Ireland Ltd.)
        pentru a măsura câte persoane ajung pe site, încep și finalizează o comandă după ce au văzut reclamele noastre
        și pentru a le optimiza. Aceste instrumente se activează <strong>doar dacă apeși „Accept”</strong> în
        bannerul de cookie-uri; până atunci nu se încarcă și nu se trimite nimic către Meta.
        Nu sunt folosite în zonele private ale platformei (cont de client, administrare).
      </p>
      <table>
        <thead>
          <tr><th>Nume</th><th>Scop</th><th>Durată</th></tr>
        </thead>
        <tbody>
          <tr><td><code>_fbp</code></td><td>Identifică browserul pentru măsurarea reclamelor Meta</td><td>3 luni</td></tr>
          <tr><td><code>_fbc</code></td><td>Reține clicul pe o reclamă Meta (dacă ai venit dintr-una)</td><td>3 luni</td></tr>
          <tr><td><code>meta_consent</code></td><td>Reține alegerea ta privind cookie-urile (localStorage, nu e transmis)</td><td>6 luni</td></tr>
        </tbody>
      </table>
      <p>
        Dacă ai acceptat, la achiziție trimitem către Meta, pe cale securizată, valoarea comenzii și date de contact
        (email, telefon, nume) <strong>criptate irreversibil (hash)</strong>, împreună cu adresa IP și browserul,
        pentru a asocia achiziția cu reclama. Poți retrage consimțământul oricând din linkul <strong>„Setări cookie”</strong>
        din subsolul paginii; retragerea oprește trimiterea de date pentru vizitele următoare.
      </p>

      <h2 className="font-serif text-[#0A0A0A]">3. Cookie-uri ale terților</h2>
      <p>
        Unele funcționalități ale platformei implică servicii terțe care pot plasa propriile cookie-uri:
      </p>
      <ul>
        <li>
          <strong>Stripe</strong> — procesarea plăților securizate.
          Cookie-urile Stripe sunt necesare pentru protecția anti-fraudă și nu pot fi dezactivate
          în contextul efectuării plăților. Politica Stripe: <strong>stripe.com/privacy</strong>
        </li>
        <li>
          <strong>Meta Platforms Ireland Ltd.</strong> — măsurarea reclamelor (Meta Pixel), doar cu consimțământul tău.
          Politica Meta: <strong>facebook.com/privacy/policy</strong>
        </li>
      </ul>

      <h2 className="font-serif text-[#0A0A0A]">4. Cum poți controla cookie-urile?</h2>
      <p>
        Poți controla și/sau șterge cookie-urile prin setările browser-ului tău:
      </p>
      <ul>
        <li><strong>Google Chrome:</strong> Setări → Confidențialitate și securitate → Cookie-uri</li>
        <li><strong>Mozilla Firefox:</strong> Preferințe → Confidențialitate și securitate</li>
        <li><strong>Safari:</strong> Preferințe → Confidențialitate</li>
        <li><strong>Microsoft Edge:</strong> Setări → Cookie-uri și permisiuni site</li>
      </ul>
      <p>
        Dezactivarea cookie-urilor esențiale poate afecta funcționarea corectă a platformei
        (autentificare, procesare plăți).
      </p>
      <p>
        Pentru mai multe informații despre gestionarea cookie-urilor, vizitați:
        {' '}<strong>allaboutcookies.org</strong> sau <strong>youronlinechoices.eu</strong>.
      </p>

      <h2 className="font-serif text-[#0A0A0A]">5. Consimțământul tău</h2>
      <p>
        <strong>Cookie-urile esențiale și funcționale</strong> nu necesită consimțământ, deoarece sunt strict necesare
        pentru funcționarea serviciului solicitat (art. 5 alin. 3 din Directiva ePrivacy).
      </p>
      <p>
        <strong>Cookie-urile de marketing (Meta)</strong> se folosesc doar cu acordul tău explicit, exprimat prin
        butonul „Accept” din banner. Poți refuza fără nicio consecință asupra utilizării site-ului sau a
        posibilității de a cumpăra, iar alegerea o poți schimba oricând din „Setări cookie”.
      </p>

      <h2 className="font-serif text-[#0A0A0A]">6. Actualizarea politicii</h2>
      <p>
        Ne rezervăm dreptul de a actualiza această Politică de Cookie ori de câte ori este
        necesar, pentru a reflecta modificările aduse platformei sau legislației aplicabile.
        Data ultimei actualizări este indicată în antetul documentului.
      </p>

      <h2 className="font-serif text-[#0A0A0A]">7. Contact</h2>
      <p>
        Pentru întrebări legate de utilizarea cookie-urilor:
        <br/>
        📧 <strong>roxana@roxii-dinca.com</strong>
      </p>
    </article>
  )
}
