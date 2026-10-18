-- Pagina dedicata per ogni prodotto digitale: copertina + contenuto editabile dall'admin (landing jsonb)
alter table public.products add column if not exists cover_url text;
alter table public.products add column if not exists landing jsonb not null default '{}'::jsonb;

-- Prompturi: la sua pagina resta quella personalizzata; qui solo i testi del checkout (prima erano nel codice)
update public.products
set cover_url = coalesce(cover_url, '/prompturi/cover.jpg'),
    landing = landing || jsonb_build_object(
      'checkout_eyebrow', 'Ediție limitată digitală',
      'checkout_text', 'Primești instant colecția de 50+ prompturi AI și începi să creezi ședințe foto virtuale impecabile.',
      'checkout_badge', 'Ghid premium + bonusuri',
      'checkout_note', 'Include 3 bonusuri exclusive',
      'format', 'PDF digital',
      'guarantee', 'Dacă nu obții imagini spectaculoase folosind prompturile și indicațiile din ghid, scrie-ne în termen de 14 zile și primești toți banii înapoi, fără întrebări.'
    )
where slug = 'prompturi' and landing = '{}'::jsonb;
