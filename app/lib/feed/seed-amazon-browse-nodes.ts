/**
 * Seed mapping: Shopify product_type / tags / title keywords → Amazon browse_node_id.
 *
 * Hand-curated from Amazon US + UK browse-node trees. Covers ~50 top Shopify
 * product types across apparel, home, electronics, beauty, sports, toys,
 * jewelry, pet, books, automotive, baby, and health.
 *
 * Format mirrors seed-ebay-categories.ts; matcher iterates first-match-wins
 * on exact `shopifyType` (lowercased).
 */

export interface SeedAmazonEntry {
  shopifyType: string
  shopifyTagsAll?: string[]
  shopifyTitleKeywords?: string[]
  browseNodeId: string
  browseNodePath: string
  confidence: number
}

export const SEED_AMAZON_BROWSE_NODES: SeedAmazonEntry[] = [
  // Women's apparel
  { shopifyType: 'dress', browseNodeId: '1045024', browseNodePath: 'Clothing > Women > Dresses', confidence: 0.95 },
  { shopifyType: 'dresses', browseNodeId: '1045024', browseNodePath: 'Clothing > Women > Dresses', confidence: 0.95 },
  { shopifyType: "women's dress", browseNodeId: '1045024', browseNodePath: 'Clothing > Women > Dresses', confidence: 0.97 },
  { shopifyType: 'top', browseNodeId: '1048668', browseNodePath: 'Clothing > Women > Tops & Tees', confidence: 0.85 },
  { shopifyType: 'blouse', browseNodeId: '2368341011', browseNodePath: 'Clothing > Women > Blouses & Button-Down Shirts', confidence: 0.95 },
  { shopifyType: 't-shirt', browseNodeId: '1045986', browseNodePath: 'Clothing > Women > T-Shirts', confidence: 0.92 },
  { shopifyType: 'skirt', browseNodeId: '1045991', browseNodePath: 'Clothing > Women > Skirts', confidence: 0.95 },
  { shopifyType: 'jeans', browseNodeId: '1048682', browseNodePath: 'Clothing > Women > Jeans', confidence: 0.95 },
  { shopifyType: 'leggings', browseNodeId: '2368376011', browseNodePath: 'Clothing > Women > Leggings', confidence: 0.95 },
  { shopifyType: 'jacket', browseNodeId: '1045972', browseNodePath: 'Clothing > Women > Coats, Jackets & Vests', confidence: 0.9 },
  // Men's apparel
  { shopifyType: "men's shirt", browseNodeId: '1045730', browseNodePath: 'Clothing > Men > Shirts', confidence: 0.95 },
  { shopifyType: "men's t-shirt", browseNodeId: '1045732', browseNodePath: 'Clothing > Men > T-Shirts & Tanks', confidence: 0.95 },
  { shopifyType: "men's jeans", browseNodeId: '1045732', browseNodePath: 'Clothing > Men > Jeans', confidence: 0.95 },
  { shopifyType: "men's jacket", browseNodeId: '1045736', browseNodePath: 'Clothing > Men > Coats & Jackets', confidence: 0.9 },
  // Shoes
  { shopifyType: 'sneakers', browseNodeId: '679255011', browseNodePath: 'Shoes > Fashion Sneakers', confidence: 0.95 },
  { shopifyType: 'boots', browseNodeId: '679304011', browseNodePath: 'Shoes > Boots', confidence: 0.9 },
  { shopifyType: 'shoes', browseNodeId: '679337011', browseNodePath: 'Shoes', confidence: 0.75 },
  // Bags
  { shopifyType: 'handbag', browseNodeId: '15743251', browseNodePath: 'Luggage > Women > Handbags', confidence: 0.95 },
  { shopifyType: 'backpack', browseNodeId: '360832011', browseNodePath: 'Luggage > Backpacks', confidence: 0.95 },
  { shopifyType: 'wallet', browseNodeId: '9072471011', browseNodePath: 'Luggage > Wallets', confidence: 0.9 },
  // Jewelry
  { shopifyType: 'necklace', browseNodeId: '6463297011', browseNodePath: 'Jewelry > Necklaces', confidence: 0.95 },
  { shopifyType: 'earrings', browseNodeId: '6463300011', browseNodePath: 'Jewelry > Earrings', confidence: 0.95 },
  { shopifyType: 'ring', browseNodeId: '6463303011', browseNodePath: 'Jewelry > Rings', confidence: 0.95 },
  { shopifyType: 'bracelet', browseNodeId: '6463296011', browseNodePath: 'Jewelry > Bracelets', confidence: 0.95 },
  { shopifyType: 'watch', browseNodeId: '6358540011', browseNodePath: 'Watches', confidence: 0.95 },
  // Beauty
  { shopifyType: 'skincare', browseNodeId: '11060451', browseNodePath: 'Beauty > Skin Care', confidence: 0.9 },
  { shopifyType: 'makeup', browseNodeId: '11055981', browseNodePath: 'Beauty > Makeup', confidence: 0.9 },
  { shopifyType: 'fragrance', browseNodeId: '11056091', browseNodePath: 'Beauty > Fragrance', confidence: 0.95 },
  { shopifyType: 'haircare', browseNodeId: '11057241', browseNodePath: 'Beauty > Hair Care', confidence: 0.9 },
  // Home
  { shopifyType: 'candle', browseNodeId: '3734981', browseNodePath: 'Home & Kitchen > Home Decor > Candles & Holders', confidence: 0.9 },
  { shopifyType: 'mug', browseNodeId: '289816', browseNodePath: 'Home & Kitchen > Kitchen & Dining > Mugs', confidence: 0.9 },
  { shopifyType: 'bedding', browseNodeId: '1063252', browseNodePath: 'Home & Kitchen > Bedding', confidence: 0.85 },
  { shopifyType: 'towel', browseNodeId: '1063306', browseNodePath: 'Home & Kitchen > Bath > Towels', confidence: 0.9 },
  { shopifyType: 'rug', browseNodeId: '1063298', browseNodePath: 'Home & Kitchen > Home Decor > Rugs', confidence: 0.9 },
  { shopifyType: 'lamp', browseNodeId: '1063294', browseNodePath: 'Home & Kitchen > Lighting', confidence: 0.85 },
  { shopifyType: 'wall art', browseNodeId: '3736081', browseNodePath: 'Home & Kitchen > Wall Art', confidence: 0.9 },
  { shopifyType: 'cushion', browseNodeId: '1063296', browseNodePath: 'Home & Kitchen > Home Decor > Throw Pillows', confidence: 0.9 },
  // Electronics
  { shopifyType: 'headphones', browseNodeId: '172541', browseNodePath: 'Electronics > Headphones', confidence: 0.95 },
  { shopifyType: 'phone case', browseNodeId: '2407760011', browseNodePath: 'Cell Phones & Accessories > Cases, Holsters & Sleeves', confidence: 0.95 },
  { shopifyType: 'charger', browseNodeId: '2407761011', browseNodePath: 'Cell Phones & Accessories > Chargers & Power Adapters', confidence: 0.9 },
  // Sports / outdoor
  { shopifyType: 'yoga mat', browseNodeId: '3407741', browseNodePath: 'Sports & Outdoors > Yoga Mats', confidence: 0.95 },
  { shopifyType: 'water bottle', browseNodeId: '3407781', browseNodePath: 'Sports & Outdoors > Water Bottles', confidence: 0.9 },
  { shopifyType: 'bike', browseNodeId: '3403201', browseNodePath: 'Sports & Outdoors > Bikes', confidence: 0.9 },
  // Toys / baby
  { shopifyType: 'toy', browseNodeId: '165793011', browseNodePath: 'Toys & Games', confidence: 0.75 },
  { shopifyType: 'plush toy', browseNodeId: '166022011', browseNodePath: 'Toys & Games > Stuffed Animals & Plush Toys', confidence: 0.95 },
  { shopifyType: 'baby clothes', browseNodeId: '1040660', browseNodePath: 'Clothing > Baby', confidence: 0.9 },
  // Pet
  { shopifyType: 'dog toy', browseNodeId: '2975251', browseNodePath: 'Pet Supplies > Dogs > Toys', confidence: 0.95 },
  { shopifyType: 'cat toy', browseNodeId: '2975355', browseNodePath: 'Pet Supplies > Cats > Toys', confidence: 0.95 },
  // Books / stationery
  { shopifyType: 'book', browseNodeId: '283155', browseNodePath: 'Books', confidence: 0.85 },
  { shopifyType: 'notebook', browseNodeId: '1069242', browseNodePath: 'Office Products > Notebooks & Writing Pads', confidence: 0.9 },
  // Automotive
  { shopifyType: 'car accessory', browseNodeId: '15684181', browseNodePath: 'Automotive > Interior Accessories', confidence: 0.8 },
  // Health
  { shopifyType: 'supplement', browseNodeId: '3764441', browseNodePath: 'Health & Household > Vitamins & Dietary Supplements', confidence: 0.9 },
]

export const SEED_AMAZON_BROWSE_NODES_SIZE = SEED_AMAZON_BROWSE_NODES.length
