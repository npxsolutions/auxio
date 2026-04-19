/**
 * Seed mapping: Shopify product_type / tags / title keywords → Google
 * `google_product_category` ID (Google Shopping taxonomy).
 *
 * Covers ~60 top Shopify product types across apparel, home, electronics,
 * beauty, sports, toys, jewelry, pet, books, automotive, baby, health.
 *
 * Format mirrors seed-amazon-browse-nodes.ts; matcher iterates first-match-wins
 * on exact `shopifyType` (lowercased).
 *
 * Full taxonomy: https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
 */

export interface SeedGoogleCategoryEntry {
  shopifyType: string
  shopifyTagsAll?: string[]
  shopifyTitleKeywords?: string[]
  googleCategoryId: string
  googleCategoryPath: string
  confidence: number
}

export const SEED_GOOGLE_PRODUCT_CATEGORIES: SeedGoogleCategoryEntry[] = [
  // ── Apparel & Accessories ──
  { shopifyType: 'dress',            googleCategoryId: '2271', googleCategoryPath: 'Apparel & Accessories > Clothing > Dresses', confidence: 0.97 },
  { shopifyType: 'dresses',          googleCategoryId: '2271', googleCategoryPath: 'Apparel & Accessories > Clothing > Dresses', confidence: 0.97 },
  { shopifyType: "women's dress",    googleCategoryId: '2271', googleCategoryPath: 'Apparel & Accessories > Clothing > Dresses', confidence: 0.97 },
  { shopifyType: 't-shirt',          googleCategoryId: '212',  googleCategoryPath: 'Apparel & Accessories > Clothing > Shirts & Tops', confidence: 0.95 },
  { shopifyType: 't shirt',          googleCategoryId: '212',  googleCategoryPath: 'Apparel & Accessories > Clothing > Shirts & Tops', confidence: 0.95 },
  { shopifyType: 'tee',              googleCategoryId: '212',  googleCategoryPath: 'Apparel & Accessories > Clothing > Shirts & Tops', confidence: 0.9  },
  { shopifyType: 'top',              googleCategoryId: '212',  googleCategoryPath: 'Apparel & Accessories > Clothing > Shirts & Tops', confidence: 0.85 },
  { shopifyType: 'blouse',           googleCategoryId: '212',  googleCategoryPath: 'Apparel & Accessories > Clothing > Shirts & Tops', confidence: 0.93 },
  { shopifyType: 'shirt',            googleCategoryId: '212',  googleCategoryPath: 'Apparel & Accessories > Clothing > Shirts & Tops', confidence: 0.9  },
  { shopifyType: 'hoodie',           googleCategoryId: '5322', googleCategoryPath: 'Apparel & Accessories > Clothing > Activewear > Sweatshirts', confidence: 0.95 },
  { shopifyType: 'sweatshirt',       googleCategoryId: '5322', googleCategoryPath: 'Apparel & Accessories > Clothing > Activewear > Sweatshirts', confidence: 0.95 },
  { shopifyType: 'jumper',           googleCategoryId: '1594', googleCategoryPath: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', confidence: 0.7  },
  { shopifyType: 'sweater',          googleCategoryId: '1594', googleCategoryPath: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', confidence: 0.8  },
  { shopifyType: 'jacket',           googleCategoryId: '1594', googleCategoryPath: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', confidence: 0.92 },
  { shopifyType: 'coat',             googleCategoryId: '1594', googleCategoryPath: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', confidence: 0.93 },
  { shopifyType: 'jeans',            googleCategoryId: '5322', googleCategoryPath: 'Apparel & Accessories > Clothing > Pants > Jeans', confidence: 0.96 },
  { shopifyType: 'trousers',         googleCategoryId: '2271', googleCategoryPath: 'Apparel & Accessories > Clothing > Pants', confidence: 0.9  },
  { shopifyType: 'pants',            googleCategoryId: '2271', googleCategoryPath: 'Apparel & Accessories > Clothing > Pants', confidence: 0.9  },
  { shopifyType: 'leggings',         googleCategoryId: '212',  googleCategoryPath: 'Apparel & Accessories > Clothing > Activewear > Leggings', confidence: 0.95 },
  { shopifyType: 'shorts',           googleCategoryId: '207',  googleCategoryPath: 'Apparel & Accessories > Clothing > Shorts', confidence: 0.94 },
  { shopifyType: 'skirt',            googleCategoryId: '211',  googleCategoryPath: 'Apparel & Accessories > Clothing > Skirts', confidence: 0.95 },
  { shopifyType: 'swimsuit',         googleCategoryId: '211',  googleCategoryPath: 'Apparel & Accessories > Clothing > Swimwear', confidence: 0.93 },
  { shopifyType: 'bikini',           googleCategoryId: '211',  googleCategoryPath: 'Apparel & Accessories > Clothing > Swimwear', confidence: 0.93 },
  { shopifyType: 'underwear',        googleCategoryId: '208',  googleCategoryPath: 'Apparel & Accessories > Clothing > Underwear & Socks', confidence: 0.9  },
  { shopifyType: 'socks',            googleCategoryId: '208',  googleCategoryPath: 'Apparel & Accessories > Clothing > Underwear & Socks', confidence: 0.95 },
  { shopifyType: 'shoes',            googleCategoryId: '187',  googleCategoryPath: 'Apparel & Accessories > Shoes', confidence: 0.95 },
  { shopifyType: 'sneakers',         googleCategoryId: '187',  googleCategoryPath: 'Apparel & Accessories > Shoes', confidence: 0.95 },
  { shopifyType: 'trainers',         googleCategoryId: '187',  googleCategoryPath: 'Apparel & Accessories > Shoes', confidence: 0.94 },
  { shopifyType: 'boots',            googleCategoryId: '187',  googleCategoryPath: 'Apparel & Accessories > Shoes', confidence: 0.92 },
  { shopifyType: 'sandals',          googleCategoryId: '187',  googleCategoryPath: 'Apparel & Accessories > Shoes', confidence: 0.92 },
  { shopifyType: 'bag',              googleCategoryId: '2216', googleCategoryPath: 'Apparel & Accessories > Handbags, Wallets & Cases > Handbags', confidence: 0.88 },
  { shopifyType: 'handbag',          googleCategoryId: '2216', googleCategoryPath: 'Apparel & Accessories > Handbags, Wallets & Cases > Handbags', confidence: 0.95 },
  { shopifyType: 'backpack',         googleCategoryId: '502',  googleCategoryPath: 'Luggage & Bags > Backpacks', confidence: 0.95 },
  { shopifyType: 'wallet',           googleCategoryId: '2216', googleCategoryPath: 'Apparel & Accessories > Handbags, Wallets & Cases > Wallets', confidence: 0.95 },
  { shopifyType: 'hat',              googleCategoryId: '173',  googleCategoryPath: 'Apparel & Accessories > Clothing Accessories > Hats', confidence: 0.94 },
  { shopifyType: 'cap',              googleCategoryId: '173',  googleCategoryPath: 'Apparel & Accessories > Clothing Accessories > Hats', confidence: 0.9  },
  { shopifyType: 'scarf',            googleCategoryId: '176',  googleCategoryPath: 'Apparel & Accessories > Clothing Accessories > Scarves & Shawls', confidence: 0.94 },
  { shopifyType: 'belt',             googleCategoryId: '169',  googleCategoryPath: 'Apparel & Accessories > Clothing Accessories > Belts', confidence: 0.95 },
  { shopifyType: 'sunglasses',       googleCategoryId: '178',  googleCategoryPath: 'Apparel & Accessories > Clothing Accessories > Sunglasses', confidence: 0.95 },

  // ── Jewelry ──
  { shopifyType: 'jewelry',          googleCategoryId: '188',  googleCategoryPath: 'Apparel & Accessories > Jewelry', confidence: 0.9  },
  { shopifyType: 'jewellery',        googleCategoryId: '188',  googleCategoryPath: 'Apparel & Accessories > Jewelry', confidence: 0.9  },
  { shopifyType: 'necklace',         googleCategoryId: '196',  googleCategoryPath: 'Apparel & Accessories > Jewelry > Necklaces', confidence: 0.95 },
  { shopifyType: 'ring',             googleCategoryId: '200',  googleCategoryPath: 'Apparel & Accessories > Jewelry > Rings', confidence: 0.94 },
  { shopifyType: 'bracelet',         googleCategoryId: '194',  googleCategoryPath: 'Apparel & Accessories > Jewelry > Bracelets', confidence: 0.95 },
  { shopifyType: 'earrings',         googleCategoryId: '195',  googleCategoryPath: 'Apparel & Accessories > Jewelry > Earrings', confidence: 0.95 },
  { shopifyType: 'watch',            googleCategoryId: '201',  googleCategoryPath: 'Apparel & Accessories > Jewelry > Watches', confidence: 0.95 },

  // ── Home & Garden ──
  { shopifyType: 'candle',           googleCategoryId: '588',  googleCategoryPath: 'Home & Garden > Decor > Candles', confidence: 0.95 },
  { shopifyType: 'mug',              googleCategoryId: '674',  googleCategoryPath: 'Home & Garden > Kitchen & Dining > Tableware > Drinkware > Mugs', confidence: 0.93 },
  { shopifyType: 'pillow',           googleCategoryId: '2700', googleCategoryPath: 'Home & Garden > Decor > Throw Pillows', confidence: 0.92 },
  { shopifyType: 'blanket',          googleCategoryId: '601',  googleCategoryPath: 'Home & Garden > Linens & Bedding > Bedding > Blankets', confidence: 0.93 },
  { shopifyType: 'rug',              googleCategoryId: '697',  googleCategoryPath: 'Home & Garden > Decor > Rugs', confidence: 0.95 },
  { shopifyType: 'lamp',             googleCategoryId: '594',  googleCategoryPath: 'Home & Garden > Lighting > Lamps', confidence: 0.94 },
  { shopifyType: 'wall art',         googleCategoryId: '500044', googleCategoryPath: 'Home & Garden > Decor > Artwork', confidence: 0.9  },
  { shopifyType: 'print',            googleCategoryId: '500044', googleCategoryPath: 'Home & Garden > Decor > Artwork > Posters, Prints & Visual Artwork', confidence: 0.75 },

  // ── Health & Beauty ──
  { shopifyType: 'skincare',         googleCategoryId: '2915', googleCategoryPath: 'Health & Beauty > Personal Care > Cosmetics > Skin Care', confidence: 0.9  },
  { shopifyType: 'moisturizer',      googleCategoryId: '2915', googleCategoryPath: 'Health & Beauty > Personal Care > Cosmetics > Skin Care', confidence: 0.9  },
  { shopifyType: 'serum',            googleCategoryId: '2915', googleCategoryPath: 'Health & Beauty > Personal Care > Cosmetics > Skin Care', confidence: 0.85 },
  { shopifyType: 'makeup',           googleCategoryId: '469',  googleCategoryPath: 'Health & Beauty > Personal Care > Cosmetics > Makeup', confidence: 0.93 },
  { shopifyType: 'lipstick',         googleCategoryId: '2915', googleCategoryPath: 'Health & Beauty > Personal Care > Cosmetics > Makeup > Lip Makeup', confidence: 0.95 },
  { shopifyType: 'perfume',          googleCategoryId: '567',  googleCategoryPath: 'Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne', confidence: 0.94 },
  { shopifyType: 'supplement',       googleCategoryId: '491',  googleCategoryPath: 'Health & Beauty > Health Care > Fitness & Nutrition', confidence: 0.88 },
  { shopifyType: 'vitamin',          googleCategoryId: '491',  googleCategoryPath: 'Health & Beauty > Health Care > Fitness & Nutrition', confidence: 0.9  },

  // ── Electronics ──
  { shopifyType: 'phone case',       googleCategoryId: '2116', googleCategoryPath: 'Electronics > Communications > Telephony > Mobile Phone Accessories > Mobile Phone Cases', confidence: 0.95 },
  { shopifyType: 'charger',          googleCategoryId: '5294', googleCategoryPath: 'Electronics > Electronics Accessories > Power', confidence: 0.88 },
  { shopifyType: 'headphones',       googleCategoryId: '139',  googleCategoryPath: 'Electronics > Audio > Audio Components > Headphones', confidence: 0.95 },
  { shopifyType: 'earbuds',          googleCategoryId: '139',  googleCategoryPath: 'Electronics > Audio > Audio Components > Headphones', confidence: 0.94 },
  { shopifyType: 'speaker',          googleCategoryId: '1542', googleCategoryPath: 'Electronics > Audio > Audio Components > Speakers', confidence: 0.92 },
  { shopifyType: 'cable',            googleCategoryId: '5294', googleCategoryPath: 'Electronics > Electronics Accessories > Cables', confidence: 0.88 },

  // ── Toys, Baby, Pets ──
  { shopifyType: 'toy',              googleCategoryId: '1239', googleCategoryPath: 'Toys & Games > Toys', confidence: 0.9  },
  { shopifyType: 'puzzle',           googleCategoryId: '1239', googleCategoryPath: 'Toys & Games > Toys > Puzzles', confidence: 0.94 },
  { shopifyType: 'plush',            googleCategoryId: '1253', googleCategoryPath: 'Toys & Games > Toys > Stuffed Animals', confidence: 0.94 },
  { shopifyType: 'baby',             googleCategoryId: '537',  googleCategoryPath: 'Baby & Toddler', confidence: 0.78 },
  { shopifyType: 'onesie',           googleCategoryId: '5408', googleCategoryPath: 'Baby & Toddler > Baby & Toddler Clothing', confidence: 0.93 },
  { shopifyType: 'pet',              googleCategoryId: '1',    googleCategoryPath: 'Animals & Pet Supplies', confidence: 0.78 },
  { shopifyType: 'dog',              googleCategoryId: '3237', googleCategoryPath: 'Animals & Pet Supplies > Pet Supplies > Dog Supplies', confidence: 0.82 },
  { shopifyType: 'cat',              googleCategoryId: '3367', googleCategoryPath: 'Animals & Pet Supplies > Pet Supplies > Cat Supplies', confidence: 0.82 },

  // ── Sporting Goods ──
  { shopifyType: 'yoga mat',         googleCategoryId: '499792', googleCategoryPath: 'Sporting Goods > Exercise & Fitness > Yoga & Pilates > Yoga Mats', confidence: 0.96 },
  { shopifyType: 'bike',             googleCategoryId: '3391', googleCategoryPath: 'Sporting Goods > Outdoor Recreation > Cycling > Bicycles', confidence: 0.9  },
  { shopifyType: 'dumbbell',         googleCategoryId: '499792', googleCategoryPath: 'Sporting Goods > Exercise & Fitness > Free Weights', confidence: 0.92 },

  // ── Books, Stationery ──
  { shopifyType: 'book',             googleCategoryId: '784',  googleCategoryPath: 'Media > Books', confidence: 0.92 },
  { shopifyType: 'notebook',         googleCategoryId: '2727', googleCategoryPath: 'Office Supplies > General Office Supplies > Paper Products > Notebooks & Notepads', confidence: 0.95 },
  { shopifyType: 'journal',          googleCategoryId: '2727', googleCategoryPath: 'Office Supplies > General Office Supplies > Paper Products > Notebooks & Notepads', confidence: 0.9  },
  { shopifyType: 'pen',              googleCategoryId: '2741', googleCategoryPath: 'Office Supplies > General Office Supplies > Writing & Drawing Instruments', confidence: 0.95 },

  // ── Food & Beverage ──
  { shopifyType: 'coffee',           googleCategoryId: '1868', googleCategoryPath: 'Food, Beverages & Tobacco > Beverages > Coffee', confidence: 0.93 },
  { shopifyType: 'tea',              googleCategoryId: '2073', googleCategoryPath: 'Food, Beverages & Tobacco > Beverages > Tea & Infusions', confidence: 0.93 },
  { shopifyType: 'chocolate',        googleCategoryId: '1876', googleCategoryPath: 'Food, Beverages & Tobacco > Food Items > Candy & Chocolate', confidence: 0.93 },
]

/**
 * First-match-wins lookup by lowercased shopifyType.
 * Returns undefined when no category is mapped — caller should gate publish.
 */
export function matchGoogleCategory(shopifyType: string | undefined | null): SeedGoogleCategoryEntry | undefined {
  if (!shopifyType) return undefined
  const needle = String(shopifyType).toLowerCase().trim()
  if (!needle) return undefined
  return SEED_GOOGLE_PRODUCT_CATEGORIES.find(e => e.shopifyType === needle)
}
