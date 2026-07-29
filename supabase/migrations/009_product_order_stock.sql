-- Decrement stock atomically on purchase. SECURITY DEFINER because a member
-- placing their own order has no RLS UPDATE rights on products (only
-- owner/manager do) — the trigger needs to write on their behalf.
create or replace function public.handle_product_order_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock int;
begin
  select stock_count into v_stock from public.products where id = new.product_id for update;

  if v_stock is null then
    raise exception 'product not found';
  end if;

  if v_stock < new.quantity then
    raise exception 'not enough stock';
  end if;

  update public.products set stock_count = stock_count - new.quantity where id = new.product_id;

  return new;
end;
$$;

create trigger product_orders_before_insert
  before insert on public.product_orders
  for each row execute function public.handle_product_order_insert();

revoke execute on function public.handle_product_order_insert() from public, anon, authenticated;
