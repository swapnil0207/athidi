-- Run once using the Supabase SQL editor or Supabase CLI migrations.
-- Only the trusted Next.js server may access customer and payment records.
create table public.payment_orders (
  id text primary key,
  access_hash text not null,
  request_hash text not null,
  customer jsonb not null check (jsonb_typeof(customer) = 'object'),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  subtotal_paise integer not null check (subtotal_paise > 0),
  delivery_paise integer not null check (delivery_paise >= 0),
  amount_paise integer not null check (amount_paise = subtotal_paise + delivery_paise),
  status text not null default 'PENDING' check (status in ('PENDING', 'COMPLETED', 'FAILED')),
  provider_order_id text unique,
  transaction_id text,
  checkout_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.payment_orders enable row level security;
revoke all on public.payment_orders from anon, authenticated;
grant select, insert, update on public.payment_orders to service_role;
-- No public policies: customer browsers must use the protected server endpoints.
