/**
 * Seed mapping: Shopify product_type / tags / title keywords → Etsy taxonomy_id.
 *
 * Drawn from Etsy's public taxonomy tree. Etsy taxonomy IDs are stable across
 * markets. Covers ~50 top Shopify types that dominate Etsy merchant inventory
 * (handmade, jewelry, art, home, craft supplies, apparel).
 *
 * Format mirrors seed-ebay-categories.ts; first-match-wins on exact `shopifyType`.
 */

export interface SeedEtsyEntry {
  shopifyType: string
  shopifyTagsAll?: string[]
  shopifyTitleKeywords?: string[]
  taxonomyId: string
  taxonomyPath: string
  confidence: number
}

export const SEED_ETSY_TAXONOMIES: SeedEtsyEntry[] = [
  // Jewelry
  { shopifyType: 'necklace', taxonomyId: '388', taxonomyPath: 'Jewellery > Necklaces', confidence: 0.97 },
  { shopifyType: 'pendant', taxonomyId: '391', taxonomyPath: 'Jewellery > Necklaces > Pendants', confidence: 0.95 },
  { shopifyType: 'earrings', taxonomyId: '382', taxonomyPath: 'Jewellery > Earrings', confidence: 0.97 },
  { shopifyType: 'stud earrings', taxonomyId: '386', taxonomyPath: 'Jewellery > Earrings > Stud Earrings', confidence: 0.96 },
  { shopifyType: 'ring', taxonomyId: '401', taxonomyPath: 'Jewellery > Rings', confidence: 0.97 },
  { shopifyType: 'bracelet', taxonomyId: '340', taxonomyPath: 'Jewellery > Bracelets', confidence: 0.97 },
  { shopifyType: 'anklet', taxonomyId: '337', taxonomyPath: 'Jewellery > Anklets', confidence: 0.95 },
  { shopifyType: 'brooch', taxonomyId: '344', taxonomyPath: 'Jewellery > Brooches', confidence: 0.95 },
  { shopifyType: 'cufflinks', taxonomyId: '376', taxonomyPath: 'Jewellery > Cufflinks & Tie Clips', confidence: 0.95 },
  // Art & prints
  { shopifyType: 'print', taxonomyId: '76', taxonomyPath: 'Art & Collectibles > Prints', confidence: 0.9 },
  { shopifyType: 'art print', taxonomyId: '77', taxonomyPath: 'Art & Collectibles > Prints > Digital Prints', confidence: 0.95 },
  { shopifyType: 'painting', taxonomyId: '71', taxonomyPath: 'Art & Collectibles > Painting', confidence: 0.93 },
  { shopifyType: 'photograph', taxonomyId: '74', taxonomyPath: 'Art & Collectibles > Photography', confidence: 0.93 },
  { shopifyType: 'illustration', taxonomyId: '65', taxonomyPath: 'Art & Collectibles > Drawing & Illustration', confidence: 0.93 },
  { shopifyType: 'sculpture', taxonomyId: '79', taxonomyPath: 'Art & Collectibles > Sculpture', confidence: 0.93 },
  // Home
  { shopifyType: 'candle', taxonomyId: '891', taxonomyPath: 'Home & Living > Home Decor > Candles', confidence: 0.96 },
  { shopifyType: 'mug', taxonomyId: '891', taxonomyPath: 'Home & Living > Kitchen & Dining > Drink & Barware > Mugs', confidence: 0.95 },
  { shopifyType: 'wall art', taxonomyId: '967', taxonomyPath: 'Home & Living > Home Decor > Wall Decor', confidence: 0.92 },
  { shopifyType: 'cushion', taxonomyId: '898', taxonomyPath: 'Home & Living > Home Decor > Pillows & Pillow Covers', confidence: 0.95 },
  { shopifyType: 'rug', taxonomyId: '909', taxonomyPath: 'Home & Living > Rugs', confidence: 0.95 },
  { shopifyType: 'blanket', taxonomyId: '858', taxonomyPath: 'Home & Living > Bedding > Blankets & Throws', confidence: 0.95 },
  { shopifyType: 'coaster', taxonomyId: '903', taxonomyPath: 'Home & Living > Kitchen & Dining > Drink & Barware > Coasters', confidence: 0.95 },
  // Apparel
  { shopifyType: 't-shirt', taxonomyId: '309', taxonomyPath: 'Clothing > Unisex Adult Clothing > Tops & Tees > T-shirts', confidence: 0.93 },
  { shopifyType: "women's t-shirt", taxonomyId: '1214', taxonomyPath: "Clothing > Women's > Tops & Tees > T-shirts", confidence: 0.95 },
  { shopifyType: "men's t-shirt", taxonomyId: '471', taxonomyPath: "Clothing > Men's > Tops & Tees > T-shirts", confidence: 0.95 },
  { shopifyType: 'hoodie', taxonomyId: '1203', taxonomyPath: "Clothing > Unisex > Hoodies & Sweatshirts", confidence: 0.95 },
  { shopifyType: 'sweater', taxonomyId: '1216', taxonomyPath: "Clothing > Women's > Sweaters", confidence: 0.9 },
  { shopifyType: 'dress', taxonomyId: '1200', taxonomyPath: "Clothing > Women's > Dresses", confidence: 0.95 },
  { shopifyType: 'skirt', taxonomyId: '1226', taxonomyPath: "Clothing > Women's > Skirts", confidence: 0.95 },
  // Accessories
  { shopifyType: 'hat', taxonomyId: '253', taxonomyPath: 'Accessories > Hats & Caps', confidence: 0.93 },
  { shopifyType: 'scarf', taxonomyId: '273', taxonomyPath: 'Accessories > Scarves & Wraps', confidence: 0.93 },
  { shopifyType: 'gloves', taxonomyId: '251', taxonomyPath: 'Accessories > Gloves & Mittens', confidence: 0.93 },
  { shopifyType: 'handbag', taxonomyId: '267', taxonomyPath: 'Bags & Purses > Handbags', confidence: 0.95 },
  { shopifyType: 'tote bag', taxonomyId: '272', taxonomyPath: 'Bags & Purses > Totes', confidence: 0.95 },
  { shopifyType: 'wallet', taxonomyId: '284', taxonomyPath: 'Bags & Purses > Wallets & Money Clips', confidence: 0.93 },
  // Craft supplies
  { shopifyType: 'bead', taxonomyId: '169', taxonomyPath: 'Craft Supplies & Tools > Beads, Gems & Cabochons', confidence: 0.9 },
  { shopifyType: 'fabric', taxonomyId: '183', taxonomyPath: 'Craft Supplies & Tools > Fabric', confidence: 0.9 },
  { shopifyType: 'yarn', taxonomyId: '213', taxonomyPath: 'Craft Supplies & Tools > Yarn & Fiber', confidence: 0.92 },
  { shopifyType: 'buttons', taxonomyId: '173', taxonomyPath: 'Craft Supplies & Tools > Sewing Notions > Buttons', confidence: 0.9 },
  { shopifyType: 'svg', taxonomyId: '234', taxonomyPath: 'Craft Supplies & Tools > Digital > Clip Art & Image Files', confidence: 0.93 },
  // Weddings
  { shopifyType: 'wedding invitation', taxonomyId: '595', taxonomyPath: 'Weddings > Invitations & Paper > Invitations', confidence: 0.95 },
  { shopifyType: 'bridal', taxonomyId: '569', taxonomyPath: 'Weddings > Accessories', confidence: 0.8 },
  // Bath & beauty
  { shopifyType: 'soap', taxonomyId: '108', taxonomyPath: 'Bath & Beauty > Bath & Body > Soaps', confidence: 0.95 },
  { shopifyType: 'bath bomb', taxonomyId: '105', taxonomyPath: 'Bath & Beauty > Bath & Body > Bath Bombs', confidence: 0.95 },
  { shopifyType: 'lip balm', taxonomyId: '129', taxonomyPath: 'Bath & Beauty > Makeup > Lips > Lip Balm', confidence: 0.95 },
  // Toys & entertainment
  { shopifyType: 'plush toy', taxonomyId: '994', taxonomyPath: 'Toys & Games > Stuffed Animals & Plushies', confidence: 0.95 },
  { shopifyType: 'puzzle', taxonomyId: '989', taxonomyPath: 'Toys & Games > Puzzles', confidence: 0.95 },
  // Pet
  { shopifyType: 'pet bandana', taxonomyId: '1509', taxonomyPath: 'Pet Supplies > Pet Clothing', confidence: 0.9 },
  { shopifyType: 'pet collar', taxonomyId: '1513', taxonomyPath: 'Pet Supplies > Collars & Leads', confidence: 0.93 },
  // Stationery / paper
  { shopifyType: 'sticker', taxonomyId: '847', taxonomyPath: 'Paper & Party Supplies > Paper > Stickers, Labels & Tags', confidence: 0.95 },
  { shopifyType: 'greeting card', taxonomyId: '828', taxonomyPath: 'Paper & Party Supplies > Paper > Greetings Cards', confidence: 0.95 },
  { shopifyType: 'planner', taxonomyId: '840', taxonomyPath: 'Paper & Party Supplies > Paper > Planners & Agendas', confidence: 0.93 },
]

export const SEED_ETSY_TAXONOMIES_SIZE = SEED_ETSY_TAXONOMIES.length
