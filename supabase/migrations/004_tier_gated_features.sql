-- Pro+ features: private lesson appointments and the gym shop.
-- Every policy re-checks the gym's tier_flags directly (not just app code),
-- so a Base-tier gym's member cannot reach these tables even with a valid session.

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  staff_id uuid not null references public.staff(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'booked' check (status in ('booked', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);
create index appointments_gym_id_idx on public.appointments(gym_id);
create index appointments_member_id_idx on public.appointments(member_id);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  name text not null,
  description text,
  price_cents int not null check (price_cents >= 0),
  stock_count int not null default 0 check (stock_count >= 0),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index products_gym_id_idx on public.products(gym_id);

create table public.product_orders (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity int not null check (quantity > 0),
  total_cents int not null check (total_cents >= 0),
  status text not null default 'pending_pickup' check (status in ('pending_pickup', 'picked_up', 'cancelled')),
  created_at timestamptz not null default now()
);
create index product_orders_gym_id_idx on public.product_orders(gym_id);
create index product_orders_member_id_idx on public.product_orders(member_id);

create or replace function public.gym_has_feature(p_gym_id uuid, p_feature text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select (tier_flags ->> p_feature)::boolean from public.gyms where id = p_gym_id), false);
$$;

alter table public.appointments enable row level security;
alter table public.products enable row level security;
alter table public.product_orders enable row level security;

-- appointments (private_lessons flag)
create policy "appointments_select" on public.appointments
  for select using (
    gym_id = public.current_gym_id()
    and public.gym_has_feature(gym_id, 'private_lessons')
    and (public.current_staff_role() in ('owner', 'manager') or member_id = auth.uid())
  );
create policy "appointments_insert" on public.appointments
  for insert with check (
    gym_id = public.current_gym_id()
    and public.gym_has_feature(gym_id, 'private_lessons')
    and (member_id = auth.uid() or public.current_staff_role() in ('owner', 'manager'))
  );
create policy "appointments_update" on public.appointments
  for update using (
    gym_id = public.current_gym_id()
    and public.gym_has_feature(gym_id, 'private_lessons')
    and (member_id = auth.uid() or public.current_staff_role() in ('owner', 'manager'))
  )
  with check (
    gym_id = public.current_gym_id()
    and public.gym_has_feature(gym_id, 'private_lessons')
    and (member_id = auth.uid() or public.current_staff_role() in ('owner', 'manager'))
  );

-- products (gym_shop flag): staff see everything, members only active listings.
create policy "products_select" on public.products
  for select using (
    gym_id = public.current_gym_id()
    and public.gym_has_feature(gym_id, 'gym_shop')
    and (public.current_staff_role() in ('owner', 'manager') or active)
  );
create policy "products_insert_staff" on public.products
  for insert with check (
    gym_id = public.current_gym_id()
    and public.gym_has_feature(gym_id, 'gym_shop')
    and public.current_staff_role() in ('owner', 'manager')
  );
create policy "products_update_staff" on public.products
  for update using (
    gym_id = public.current_gym_id()
    and public.gym_has_feature(gym_id, 'gym_shop')
    and public.current_staff_role() in ('owner', 'manager')
  )
  with check (
    gym_id = public.current_gym_id()
    and public.gym_has_feature(gym_id, 'gym_shop')
    and public.current_staff_role() in ('owner', 'manager')
  );
create policy "products_delete_staff" on public.products
  for delete using (
    gym_id = public.current_gym_id()
    and public.gym_has_feature(gym_id, 'gym_shop')
    and public.current_staff_role() in ('owner', 'manager')
  );

-- product_orders (gym_shop flag)
create policy "orders_select" on public.product_orders
  for select using (
    gym_id = public.current_gym_id()
    and public.gym_has_feature(gym_id, 'gym_shop')
    and (public.current_staff_role() in ('owner', 'manager') or member_id = auth.uid())
  );
create policy "orders_insert" on public.product_orders
  for insert with check (
    gym_id = public.current_gym_id()
    and public.gym_has_feature(gym_id, 'gym_shop')
    and (member_id = auth.uid() or public.current_staff_role() in ('owner', 'manager'))
  );
create policy "orders_update_staff" on public.product_orders
  for update using (
    gym_id = public.current_gym_id()
    and public.gym_has_feature(gym_id, 'gym_shop')
    and public.current_staff_role() in ('owner', 'manager')
  )
  with check (
    gym_id = public.current_gym_id()
    and public.gym_has_feature(gym_id, 'gym_shop')
    and public.current_staff_role() in ('owner', 'manager')
  );
