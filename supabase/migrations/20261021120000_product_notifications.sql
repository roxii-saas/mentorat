-- Notifiche all'admin per ogni vendita, configurabili per prodotto
alter table public.products
  add column if not exists notify_admin  boolean not null default true,   -- email "Vânzare nouă" all'admin
  add column if not exists notify_copy   boolean not null default false,  -- copia dell'email di consegna inviata al cliente
  add column if not exists notify_emails text;                            -- destinatari separati da virgola; vuoto = indirizzo predefinito del sito
