-- Supabase schema for TrendZone AI Shopkeeper
-- Run this in the Supabase SQL editor for your project.

-- Enable pgvector for semantic search (RAG)
create extension if not exists vector;

-- PRODUCTS
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  category text not null,
  sizes jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  stock integer not null default 0 check (stock >= 0),
  tags jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_price_idx on public.products (price);
create index if not exists products_tags_gin_idx on public.products using gin (tags);

-- CART ITEMS (guest + authenticated)
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid references auth.users(id),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cart_items_session_idx on public.cart_items (session_id);
create index if not exists cart_items_user_idx on public.cart_items (user_id);

-- ORDERS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  session_id text not null,
  total numeric(10,2) not null check (total >= 0),
  status text not null default 'pending',
  shipping_address jsonb not null default '{}'::jsonb,
  coupon_code text,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id);
create index if not exists orders_session_idx on public.orders (session_id);

-- ORDER ITEMS
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  size text not null,
  quantity integer not null check (quantity > 0),
  price numeric(10,2) not null check (price >= 0)
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- COUPONS (for Haggle mode)
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage','fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  min_purchase numeric(10,2) check (min_purchase >= 0),
  max_discount numeric(10,2) check (max_discount >= 0),
  valid_from timestamptz default now(),
  valid_until timestamptz,
  usage_limit integer,
  used_count integer not null default 0,
  created_by_agent boolean not null default false,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists coupons_code_idx on public.coupons (code);

-- USER ACTIVITY (for recommendations)
create table if not exists public.user_activity (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid references auth.users(id),
  activity_type text not null,
  product_id uuid references public.products(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_activity_session_idx on public.user_activity (session_id);
create index if not exists user_activity_user_idx on public.user_activity (user_id);
create index if not exists user_activity_type_idx on public.user_activity (activity_type);

-- EMBEDDINGS (RAG / semantic search)
create table if not exists public.product_embeddings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  embedding vector(768), -- adjust dimensions to match Gemini embedding size
  text_content text not null,
  created_at timestamptz not null default now()
);

create index if not exists product_embeddings_product_idx on public.product_embeddings (product_id);
create index if not exists product_embeddings_vector_idx on public.product_embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

