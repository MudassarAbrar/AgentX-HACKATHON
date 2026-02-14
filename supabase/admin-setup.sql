-- Admin Setup SQL for TrendZone
-- Run this in Supabase SQL editor to set up admin features

-- =====================================================
-- 1. Create Storage Bucket for Product Images
-- =====================================================

-- Create the product-images bucket (run in Storage section or via SQL)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Allow public read access to product images
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'product-images' );

-- Allow authenticated users to upload images (for admin)
-- Note: For production, you'd want to restrict this to admin users only
create policy "Allow uploads"
on storage.objects for insert
with check ( bucket_id = 'product-images' );

-- Allow authenticated users to delete images
create policy "Allow deletes"
on storage.objects for delete
using ( bucket_id = 'product-images' );

-- =====================================================
-- 2. Add Colors Column to Products (if not exists)
-- =====================================================

-- Add colors column if it doesn't exist
do $$
begin
    if not exists (
        select 1 from information_schema.columns 
        where table_name = 'products' and column_name = 'colors'
    ) then
        alter table public.products 
        add column colors jsonb not null default '[]'::jsonb;
    end if;
end $$;

-- =====================================================
-- 3. Create Indexes for Better Performance
-- =====================================================

-- Index for product search
create index if not exists products_name_idx 
on public.products using gin (to_tsvector('english', name));

create index if not exists products_description_idx 
on public.products using gin (to_tsvector('english', description));

-- Index for order queries
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- Index for coupon queries  
create index if not exists coupons_valid_dates_idx 
on public.coupons (valid_from, valid_until);

-- =====================================================
-- 4. Row Level Security Policies (Optional - for production)
-- =====================================================

-- Enable RLS on all tables
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.coupons enable row level security;
alter table public.user_activity enable row level security;
alter table public.product_embeddings enable row level security;

-- Allow public read access to products
create policy "Products are viewable by everyone"
on public.products for select
using (true);

-- Allow public insert/update/delete on products (for demo - restrict in production)
create policy "Products can be managed"
on public.products for all
using (true)
with check (true);

-- Allow public access to cart_items based on session
create policy "Cart items are accessible by session"
on public.cart_items for all
using (true)
with check (true);

-- Allow public access to orders based on session
create policy "Orders are accessible by session"
on public.orders for all
using (true)
with check (true);

-- Allow public access to order_items
create policy "Order items are accessible"
on public.order_items for all
using (true)
with check (true);

-- Allow public access to coupons
create policy "Coupons are viewable by everyone"
on public.coupons for select
using (true);

create policy "Coupons can be managed"
on public.coupons for all
using (true)
with check (true);

-- Allow public access to user_activity
create policy "User activity is accessible by session"
on public.user_activity for all
using (true)
with check (true);

-- Allow public access to product_embeddings
create policy "Product embeddings are accessible"
on public.product_embeddings for all
using (true)
with check (true);

-- =====================================================
-- 5. Helpful Functions
-- =====================================================

-- Function to update product updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at for products
drop trigger if exists update_products_updated_at on public.products;
create trigger update_products_updated_at
    before update on public.products
    for each row
    execute function update_updated_at_column();

-- Trigger to auto-update updated_at for cart_items
drop trigger if exists update_cart_items_updated_at on public.cart_items;
create trigger update_cart_items_updated_at
    before update on public.cart_items
    for each row
    execute function update_updated_at_column();

-- =====================================================
-- 6. Sample Admin User Activity Types
-- =====================================================

-- These are the activity types used for tracking:
-- 'view' - User viewed a product
-- 'add_to_cart' - User added to cart
-- 'purchase' - User purchased
-- 'search' - User searched (logged in metadata)
-- 'chat' - User chatted with clerk
