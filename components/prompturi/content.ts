// Testi della landing /prompturi (dal design Stitch "Haute Editorial").
// ⚠️ TESTIMONIANZE e NUMERI (cursante, rating, economie, +184%…) sono segnaposto generati da Stitch:
//    vanno sostituiti con recensioni e dati REALI prima di fare pubblicità
//    (le recensioni inventate sono vietate dalla legge sulla tutela dei consumatori).

export const MODULES = [
  {
    n: '01', count: 12, icon: 'auto_awesome', title: 'Poziții Beauty & Close-up Produse',
    text: 'Lash extension, macro pe buze hidratate, reflexia luminii pe ten de sticlă și unghiuri de revistă dedicate saloanelor și tehnicienilor.',
    prompt: 'Extreme macro beauty shot, ultra-hydrated glass skin, lash extensions with clean separation, warm studio rim lighting, 85mm f/1.8 lens, Vogue editorial aesthetic --ar 4:5 --v 6.0',
  },
  {
    n: '02', count: 10, icon: 'styler', title: 'Poses Fashion & Editorial Haute-Couture',
    text: 'Ținute statement, sacouri supradimensionate, posturi dinamice în picioare, fundaluri de studio warm alabaster și cadre stradale luxoase.',
    checks: ['Posturi asimetrice', 'Full body editorial'],
  },
  {
    n: '03', count: 10, icon: 'chair', title: 'Lifestyle & Salon Atmosphere',
    text: 'Cadre naturale de lucru în salon, cafea de dimineață în cană de ceramică texturată, cliente zâmbind discret și instrumente organizate impecabil.',
  },
  {
    n: '04', count: 9, icon: 'ad_units', title: 'Reclame & Lansări de Produs',
    text: 'Unghiuri optime pentru reclame Meta (Instagram & Facebook), compoziții cu spațiu negativ pentru text, mâini manichiurate ținând flacoane de serum.',
  },
  {
    n: '05', count: 11, icon: 'tune', title: 'Ghid de Personalizare & Mix de Stiluri',
    text: 'Algoritmul de schimbare a culorilor, ajustarea intensității luminii golden hour, controlul camerei și combinarea a două prompturi într-o imagine hibridă.',
  },
]

export const BONUSES = [
  {
    title: 'Ghidul Compatibilității Tehnice', value: 99, tag: 'PDF descărcabil + exemple video',
    text: 'Cum să adaptezi prompturile direct în ChatGPT, Midjourney sau Google Gemini fără erori de sintaxă sau deformări.',
  },
  {
    title: '25 Iluminări & Lentile Profesionale de Studio', value: 149, tag: 'Dicționar de termeni cheie',
    text: 'Vocabularul folosit de fotografii de revistă: Rembrandt lighting, softbox diffusers, bokeh cinematic și distanțe focale ideale.',
  },
  {
    title: 'Cheat Sheet: Piele & Mâini Realiste', value: 79, tag: 'Negative prompts pre-configurate',
    text: 'Cuvintele negative și parametrii anti-plastic pentru textură autentică a porilor, degete anatomice corecte și luciu natural.',
  },
]

export const BUNDLE_VALUE = 322 // valoarea pachetului principal în tabelul de ofertă

export const PILLARS = [
  { icon: 'photo_camera', title: 'Poziții & Compoziții Dinamice', text: 'Unghiuri calculate editorial, posturi sofisticate și cadre tip revistă, fără ore pierdute căutând idei pe Pinterest.' },
  { icon: 'tune', title: 'Compatibil cu Orice AI de Imagini', text: 'Fiecare prompt este structurat modular și testat în ChatGPT, Midjourney, Claude și Gemini.' },
  { icon: 'collections_bookmark', title: 'Propria Ta Bibliotecă de Ședințe Foto', text: 'Creează campanii memorabile pentru produse cosmetice, atmosferă de salon sau portofolii personale.' },
  { icon: 'content_copy', title: '100% Personalizabil & Copy-Paste', text: 'Copiază direct sau schimbă nuanțele, machiajul și recuzita pentru a reda semnătura brandului tău.' },
]

export const AI_TOOLS = [
  { icon: 'smart_toy', label: 'ChatGPT' },
  { icon: 'palette', label: 'Midjourney' },
  { icon: 'psychology', label: 'Claude' },
  { icon: 'blur_on', label: 'Google Gemini' },
]

export const SHOWCASE_PROMPT =
  'Macro close-up beauty portrait of a woman holding a luxury gold mascara, flawless porcelain skin texture, soft dewy glow, editorial softbox lighting, 85mm lens, Vogue style --ar 4:5'

// ⚠️ SEGNAPOSTO — sostituire con dati reali
export const METRICS = [
  { value: '0 Lei', label: 'Cheltuiți pe studio', accent: true },
  { value: '5 Min', label: 'Compoziție gata', accent: false },
  { value: '10x', label: 'Mesaje pe Instagram', accent: true },
]

// ⚠️ SEGNAPOSTO — sostituire con recensioni reali (con il consenso delle clienti)
export const CASES = [
  {
    name: 'Elena M.', role: 'Lash & Brow Pro • București', avatar: '/prompturi/case1-avatar.jpg',
    images: [{ src: '/prompturi/case1-a.jpg', tag: 'Creat cu Prompt #12' }, { src: '/prompturi/case1-b.jpg', tag: 'Creat cu Prompt #19' }],
    quote: 'Nu aveam timp și nici buget pentru modele și fotografi în fiecare lună. Cu aceste prompturi creez imagini hiper-realiste pentru reclame în câteva minute!',
    result: { label: 'Impact financiar:', value: 'Economie 1.800 Lei / lună', icon: 'trending_down' },
  },
  {
    name: 'Andreea C.', role: 'Atelier Beauty Studio • Cluj', avatar: '/prompturi/case2-avatar.jpg',
    images: [{ src: '/prompturi/case2.jpg', tag: '' }],
    quote: 'Pozițiile generate arată atât de naturale încât clientele mă întreabă cine îmi face pozele de promovare!',
  },
  {
    name: 'Simona D.', role: 'Fashion & Lifestyle • Timișoara', avatar: '/prompturi/case3-avatar.jpg',
    images: [{ src: '/prompturi/case3.jpg', tag: "Colecția 'Café Chic Parisien'" }],
    quote: 'Am economisit sute de euro pe decoruri și locații. Prompturile de compoziție sunt aur curat.',
    result: { label: 'Rată de interacțiune:', value: '+184% saves & shares' },
  },
]

export const COMPARISON = [
  { without: ['1.500 - 3.000 Lei', 'Per ședință foto lunară'], with: ['{price} O Singură Dată', 'Acces pe viață la colecție'] },
  { without: ['Zile întregi', 'Organizare, locație, retuș'], with: ['Sub 5 Minute', 'Copiezi & generezi direct'] },
  { without: [null, 'Texturi plastice, AI nerealist'], with: [null, 'Textură naturală a pielii & pori fini'] },
  { without: [null, 'Feed dezordonat, culori haotice'], with: [null, 'Estetică de copertă editorială unitară'] },
]

export const FAQ = [
  {
    q: 'Cum primesc accesul la cele 50+ prompturi?',
    a: 'Imediat după confirmarea plății primești un email personalizat cu linkul de descărcare a ghidului în format PDF de înaltă rezoluție, optimizat pentru telefon, tabletă și desktop.',
  },
  {
    q: 'Trebuie să am cunoștințe tehnice avansate?',
    a: 'Deloc. Prompturile sunt plug-and-play: copiezi textul din ghid și îl inserezi în ChatGPT sau Midjourney. Ai incluse instrucțiuni simple pas cu pas.',
  },
  {
    q: 'Pot folosi imaginile în scopuri comerciale?',
    a: 'Da, imaginile pe care le generezi pe baza acestor prompturi pot fi folosite în materialele promoționale ale salonului tău, reclame plătite sau conturi de social media.',
  },
  {
    q: 'Ce se întâmplă dacă nu primesc emailul?',
    a: 'Verifică folderul Spam / Promoții. Dacă tot nu îl găsești, răspunde la emailul de confirmare a plății sau scrie-ne și îți retrimitem imediat linkul.',
  },
  {
    q: 'Există garanție?',
    a: 'Da. Dacă nu obții imagini spectaculoase folosind prompturile și indicațiile din ghid, scrie-ne în termen de 14 zile și primești banii înapoi, fără întrebări.',
  },
]
