-- Additional seed data for TrendZone products
-- Run this after seed-products.sql to add 10 more products

INSERT INTO public.products (name, description, price, image_url, category, sizes, tags, metadata)
VALUES
  (
    'Cashmere Cardigan',
    'Luxuriously soft cashmere cardigan with mother-of-pearl buttons. Relaxed fit with ribbed trim for a refined layering piece.',
    249,
    'product-1.jpg',
    'Clothes',
    '["XS","S","M","L","XL"]'::jsonb,
    '["cashmere","cardigan","luxury","layering","soft"]'::jsonb,
    '{"season":["fall","winter"],"occasion":["work","evening","date-night"],"style":"elegant"}'::jsonb
  ),
  (
    'Leather Loafers',
    'Italian leather penny loafers with hand-stitched details. Memory foam insole for all-day comfort and sophistication.',
    199,
    'product-2.jpg',
    'Shoes',
    '["38","39","40","41","42","43","44","45"]'::jsonb,
    '["loafers","leather","italian","formal","comfortable"]'::jsonb,
    '{"season":["spring","summer","fall"],"occasion":["work","smart-casual","wedding"],"style":"classic"}'::jsonb
  ),
  (
    'Structured Backpack',
    'Minimalist leather backpack with padded laptop compartment. Water-resistant lining with magnetic closures.',
    189,
    'product-3.jpg',
    'Bags',
    '["One Size"]'::jsonb,
    '["backpack","leather","laptop","work","travel"]'::jsonb,
    '{"season":"all","occasion":["work","travel","daily"],"style":"modern-minimal"}'::jsonb
  ),
  (
    'Linen Shirt Dress',
    'Effortless linen shirt dress with self-tie belt. Relaxed A-line silhouette perfect for warm weather styling.',
    159,
    'product-4.jpg',
    'Clothes',
    '["XS","S","M","L","XL"]'::jsonb,
    '["dress","linen","summer","effortless","versatile"]'::jsonb,
    '{"season":"summer","occasion":["brunch","vacation","casual"],"style":"relaxed-chic"}'::jsonb
  ),
  (
    'Aviator Sunglasses',
    'Classic aviator sunglasses with polarized lenses. Gold-tone metal frame with adjustable nose pads for perfect fit.',
    129,
    'product-5.jpg',
    'Accessories',
    '["One Size"]'::jsonb,
    '["sunglasses","aviator","polarized","summer","classic"]'::jsonb,
    '{"season":["spring","summer"],"occasion":["daily","travel","beach"],"style":"timeless"}'::jsonb
  ),
  (
    'Merino Wool Turtleneck',
    'Fine-gauge merino wool turtleneck in a flattering slim fit. Lightweight warmth with a polished, refined look.',
    135,
    'product-6.jpg',
    'Clothes',
    '["XS","S","M","L","XL"]'::jsonb,
    '["turtleneck","merino","wool","layering","winter"]'::jsonb,
    '{"season":["fall","winter"],"occasion":["work","date-night","smart-casual"],"style":"sophisticated"}'::jsonb
  ),
  (
    'Suede Ankle Boots',
    'Soft suede ankle boots with block heel and side zip. Versatile design transitions seamlessly from day to night.',
    219,
    'product-1.jpg',
    'Shoes',
    '["36","37","38","39","40","41","42"]'::jsonb,
    '["boots","suede","ankle","heel","versatile"]'::jsonb,
    '{"season":["fall","winter","spring"],"occasion":["work","evening","date-night"],"style":"chic"}'::jsonb
  ),
  (
    'Minimalist Watch',
    'Swiss movement watch with sapphire crystal face. Genuine leather strap with clean dial design.',
    275,
    'product-2.jpg',
    'Accessories',
    '["One Size"]'::jsonb,
    '["watch","minimalist","swiss","leather","luxury"]'::jsonb,
    '{"season":"all","occasion":["work","formal","daily"],"style":"modern-classic"}'::jsonb
  ),
  (
    'Cotton Chinos',
    'Tailored cotton chinos with stretch for comfort. Flat front design with clean lines for a versatile wardrobe staple.',
    99,
    'product-3.jpg',
    'Clothes',
    '["28","30","32","34","36","38"]'::jsonb,
    '["chinos","cotton","stretch","tailored","everyday"]'::jsonb,
    '{"season":["spring","summer","fall"],"occasion":["work","casual","smart-casual"],"style":"classic"}'::jsonb
  ),
  (
    'Weekend Duffle Bag',
    'Waxed canvas duffle with leather trim. Spacious main compartment with shoe pocket and removable shoulder strap.',
    169,
    'product-4.jpg',
    'Bags',
    '["One Size"]'::jsonb,
    '["duffle","travel","weekend","canvas","leather"]'::jsonb,
    '{"season":"all","occasion":["travel","weekend","gym"],"style":"heritage"}'::jsonb
  );
