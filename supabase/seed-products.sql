-- Seed data for TrendZone products
-- Run this after creating the schema.

insert into public.products (name, description, price, image_url, category, sizes, tags, metadata)
values
  (
    'Linen Blazer',
    'A lightweight linen blazer perfect for layering. Tailored fit with natural texture for a sophisticated yet relaxed look.',
    189,
    'product-1.jpg',
    'Clothes',
    '["S","M","L","XL"]'::jsonb,
    '["linen","blazer","lightweight","summer","wedding","smart"]'::jsonb,
    '{"season":"summer","occasion":["wedding","smart-casual"],"style":"minimal"}'::jsonb
  ),
  (
    'Classic Sneakers',
    'Minimalist leather sneakers with cushioned insole. Clean lines and premium materials for everyday comfort.',
    129,
    'product-2.jpg',
    'Shoes',
    '["38","39","40","41","42","43","44"]'::jsonb,
    '["sneakers","leather","everyday","casual"]'::jsonb,
    '{"season":["spring","summer","fall"],"occasion":["casual","travel"],"style":"sporty-minimal"}'::jsonb
  ),
  (
    'Canvas Tote',
    'Oversized canvas tote with reinforced handles. Spacious interior with internal pocket for essentials.',
    79,
    'product-3.jpg',
    'Bags',
    '["One Size"]'::jsonb,
    '["tote","bag","canvas","everyday"]'::jsonb,
    '{"season":"all","occasion":["daily","shopping","beach"],"style":"relaxed"}'::jsonb
  ),
  (
    'Wool Overcoat',
    'Double-breasted wool overcoat with satin lining. A timeless silhouette for the colder months.',
    349,
    'product-4.jpg',
    'Clothes',
    '["S","M","L","XL"]'::jsonb,
    '["coat","wool","winter","outerwear"]'::jsonb,
    '{"season":["fall","winter"],"occasion":["work","evening"],"style":"classic"}'::jsonb
  ),
  (
    'Relaxed Trousers',
    'Wide-leg relaxed trousers in organic cotton. Elastic waistband with drawstring for effortless style.',
    119,
    'product-5.jpg',
    'Clothes',
    '["S","M","L","XL"]'::jsonb,
    '["trousers","relaxed","cotton","comfortable"]'::jsonb,
    '{"season":["spring","summer","fall"],"occasion":["casual","travel"],"style":"relaxed"}'::jsonb
  ),
  (
    'Knit Sweater',
    'Chunky knit sweater in a soft wool blend. Ribbed cuffs and hem with relaxed drop-shoulder fit.',
    145,
    'product-6.jpg',
    'Clothes',
    '["S","M","L","XL"]'::jsonb,
    '["sweater","knit","warm","casual"]'::jsonb,
    '{"season":["fall","winter"],"occasion":["casual","weekend"],"style":"cozy"}'::jsonb
  ),
  (
    'Leather Belt',
    'Full-grain leather belt with brushed brass buckle. 3cm width for a refined, versatile accessory.',
    59,
    'product-1.jpg',
    'Accessories',
    '["S","M","L"]'::jsonb,
    '["belt","leather","accessory"]'::jsonb,
    '{"season":"all","occasion":["work","casual"],"style":"classic"}'::jsonb
  ),
  (
    'Silk Scarf',
    'Hand-printed silk scarf with abstract geometric pattern. Lightweight and luxurious drape.',
    89,
    'product-3.jpg',
    'Accessories',
    '["One Size"]'::jsonb,
    '["scarf","silk","accessory","pattern"]'::jsonb,
    '{"season":["spring","fall"],"occasion":["evening","special"],"style":"elegant"}'::jsonb
  ),
  (
    'Chelsea Boots',
    'Classic Chelsea boots in polished leather. Elastic side panels and pull tab for easy on and off.',
    229,
    'product-4.jpg',
    'Shoes',
    '["38","39","40","41","42","43","44"]'::jsonb,
    '["boots","leather","chelsea","winter"]'::jsonb,
    '{"season":["fall","winter"],"occasion":["work","evening"],"style":"classic"}'::jsonb
  ),
  (
    'Crossbody Bag',
    'Compact crossbody bag in pebbled leather. Adjustable strap with zip closure and card slots.',
    139,
    'product-2.jpg',
    'Bags',
    '["One Size"]'::jsonb,
    '["bag","crossbody","leather","compact"]'::jsonb,
    '{"season":"all","occasion":["daily","evening","travel"],"style":"minimal"}'::jsonb
  ),
  (
    'Denim Jacket',
    'Washed denim jacket with brass button closures. Classic fit with chest pockets and adjustable cuffs.',
    179,
    'product-5.jpg',
    'Clothes',
    '["S","M","L","XL"]'::jsonb,
    '["jacket","denim","casual"]'::jsonb,
    '{"season":["spring","fall"],"occasion":["casual","weekend"],"style":"casual"}'::jsonb
  ),
  (
    'Running Sneakers',
    'Performance running sneakers with responsive cushioning. Breathable mesh upper in tonal colorway.',
    159,
    'product-6.jpg',
    'Shoes',
    '["38","39","40","41","42","43","44"]'::jsonb,
    '["sneakers","running","performance"]'::jsonb,
    '{"season":["spring","summer","fall"],"occasion":["running","training"],"style":"sporty"}'::jsonb
  );

