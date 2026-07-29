alter table public.products add column product_type text not null default 'retail' check (product_type in ('retail','membership','package'));
