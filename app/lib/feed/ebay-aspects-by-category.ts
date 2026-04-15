/**
 * eBay required/recommended aspects by leaf category.
 *
 * Covers the top 50 categories from seed-ebay-categories.ts. Data is drawn from
 * eBay's UK category specifics matrix; extend as more categories are published.
 * Aspect names MUST match eBay's canonical spelling exactly — mismatches are
 * silently dropped by the Inventory API.
 *
 * Shape: Record<categoryId, { required: string[]; recommended: string[] }>
 *
 * Falls back to a generic set when the category is not listed here.
 */

export interface CategoryAspects {
  required: string[]
  recommended: string[]
}

export const EBAY_ASPECTS_BY_CATEGORY: Record<string, CategoryAspects> = {
  // Women's Dresses
  '63861': {
    required: ['Brand', 'Size', 'Colour', 'Department'],
    recommended: ['Material', 'Style', 'Occasion', 'Sleeve Length', 'Pattern', 'Neckline', 'Dress Length'],
  },
  // Women's Tops & Shirts
  '53159': {
    required: ['Brand', 'Size', 'Colour', 'Department'],
    recommended: ['Material', 'Sleeve Length', 'Pattern', 'Neckline', 'Style', 'Fit'],
  },
  // Women's T-Shirts
  '15687': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Sleeve Length', 'Neckline', 'Pattern', 'Department'],
  },
  // Women's Skirts
  '63864': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Style', 'Length', 'Pattern'],
  },
  // Women's Jeans
  '11554': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Style', 'Wash', 'Rise', 'Fit', 'Inseam'],
  },
  // Women's Trousers
  '63863': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Style', 'Fit', 'Rise', 'Pattern'],
  },
  // Women's Leggings
  '169001': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Pattern', 'Activity'],
  },
  // Women's Shorts
  '11555': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Style', 'Fit', 'Rise'],
  },
  // Jumpsuits & Playsuits
  '3009': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Style', 'Occasion', 'Pattern'],
  },
  // Jumpers & Cardigans
  '63866': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Style', 'Neckline', 'Pattern', 'Sleeve Length'],
  },
  // Hoodies & Sweatshirts
  '155226': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Style', 'Features'],
  },
  // Coats, Jackets & Waistcoats
  '63862': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Style', 'Outer Shell Material', 'Lining Material', 'Closure'],
  },
  // Lingerie & Nightwear
  '63853': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Style', 'Type'],
  },
  // Bras
  '11514': {
    required: ['Brand', 'Band Size', 'Cup Size', 'Colour'],
    recommended: ['Material', 'Style', 'Type', 'Features'],
  },
  // Swimwear
  '63867': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Style', 'Type', 'Pattern'],
  },
  // Activewear
  '137084': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Activity', 'Type', 'Features'],
  },
  // Men's Shirts
  '1059': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Size Type', 'Sleeve Length', 'Collar', 'Fit', 'Pattern'],
  },
  // Men's Jeans
  '11483': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Waist Size', 'Inseam', 'Style', 'Wash', 'Fit', 'Rise'],
  },
  // Men's Trousers
  '57989': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Waist Size', 'Inseam', 'Style', 'Fit'],
  },
  // Men's Shorts
  '15689': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Style', 'Waist Size', 'Inseam'],
  },
  // Men's Jumpers & Cardigans
  '11484': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Style', 'Neckline', 'Fit'],
  },
  // Men's Hoodies & Sweatshirts
  '155183': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Style', 'Features'],
  },
  // Men's Coats & Jackets
  '57988': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Style', 'Outer Shell Material', 'Lining Material', 'Closure'],
  },
  // Men's Suits & Tailoring
  '3001': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Chest Size', 'Style', 'Fit', 'Number of Pieces'],
  },
  // Women's Shoes
  '3034': {
    required: ['Brand', 'UK Shoe Size', 'Colour'],
    recommended: ['Upper Material', 'Style', 'Heel Height', 'Heel Style', 'Pattern'],
  },
  // Men's Shoes
  '93427': {
    required: ['Brand', 'UK Shoe Size', 'Colour'],
    recommended: ['Upper Material', 'Style', 'Pattern', 'Features'],
  },
  // Trainers
  '15709': {
    required: ['Brand', 'UK Shoe Size', 'Colour'],
    recommended: ['Upper Material', 'Product Line', 'Model', 'Features', 'Style'],
  },
  // Boots
  '53557': {
    required: ['Brand', 'UK Shoe Size', 'Colour'],
    recommended: ['Upper Material', 'Style', 'Heel Height', 'Shaft Height'],
  },
  // Heels
  '55793': {
    required: ['Brand', 'UK Shoe Size', 'Colour'],
    recommended: ['Upper Material', 'Heel Height', 'Heel Style', 'Style'],
  },
  // Sandals
  '62107': {
    required: ['Brand', 'UK Shoe Size', 'Colour'],
    recommended: ['Upper Material', 'Style', 'Closure'],
  },
  // Women's Bags & Handbags
  '169291': {
    required: ['Brand', 'Colour'],
    recommended: ['Material', 'Style', 'Size', 'Features', 'Pattern'],
  },
  // Purses & Wallets
  '169284': {
    required: ['Brand', 'Colour'],
    recommended: ['Material', 'Style', 'Features'],
  },
  // Sunglasses & Accessories
  '79720': {
    required: ['Brand', 'Frame Colour'],
    recommended: ['Style', 'Frame Material', 'Lens Colour', 'Lens Technology', 'Model'],
  },
  // Fine Necklaces & Pendants
  '164329': {
    required: ['Brand', 'Metal', 'Main Stone'],
    recommended: ['Metal Purity', 'Length', 'Style', 'Main Stone Colour'],
  },
  // Fine Earrings
  '50647': {
    required: ['Brand', 'Metal', 'Main Stone'],
    recommended: ['Metal Purity', 'Style', 'Main Stone Colour', 'Closure'],
  },
  // Fine Rings
  '67681': {
    required: ['Brand', 'Metal', 'Main Stone', 'Ring Size'],
    recommended: ['Metal Purity', 'Style', 'Main Stone Colour'],
  },
  // Fine Bracelets
  '50637': {
    required: ['Brand', 'Metal', 'Main Stone'],
    recommended: ['Metal Purity', 'Length', 'Style', 'Closure'],
  },
  // Watches
  '31387': {
    required: ['Brand', 'Department', 'Display'],
    recommended: ['Movement', 'Case Material', 'Band Material', 'Model', 'Case Colour', 'Dial Colour', 'Features'],
  },
  // Mobile & Smart Phones
  '9355': {
    required: ['Brand', 'Model', 'Storage Capacity', 'Colour', 'Network'],
    recommended: ['Operating System', 'RAM', 'Connectivity', 'Condition'],
  },
  // Phone Cases
  '20349': {
    required: ['Brand', 'Compatible Model', 'Colour'],
    recommended: ['Material', 'Type', 'Features'],
  },
  // Tablets & eReaders
  '171485': {
    required: ['Brand', 'Model', 'Storage Capacity', 'Colour'],
    recommended: ['Operating System', 'Screen Size', 'Connectivity', 'RAM'],
  },
  // PC Laptops & Netbooks
  '177': {
    required: ['Brand', 'Processor', 'RAM Size', 'SSD Capacity', 'Screen Size'],
    recommended: ['Model', 'Operating System', 'GPU', 'Colour', 'Release Year'],
  },
  // Headphones
  '112529': {
    required: ['Brand', 'Type', 'Colour'],
    recommended: ['Connectivity', 'Model', 'Features', 'Features'],
  },
  // Speakers
  '14990': {
    required: ['Brand', 'Type'],
    recommended: ['Connectivity', 'Colour', 'Features', 'Model'],
  },
  // Televisions
  '11071': {
    required: ['Brand', 'Screen Size', 'Resolution'],
    recommended: ['Smart TV', 'Model', 'Display Technology', 'Refresh Rate'],
  },
  // Digital Cameras
  '31388': {
    required: ['Brand', 'Model', 'Type'],
    recommended: ['Megapixels', 'Colour', 'Optical Zoom', 'Features'],
  },
  // Mugs
  '36027': {
    required: ['Brand', 'Material', 'Colour'],
    recommended: ['Style', 'Pattern', 'Features', 'Capacity'],
  },
  // Cookware
  '20625': {
    required: ['Brand', 'Material'],
    recommended: ['Type', 'Colour', 'Features', 'Number of Items'],
  },
  // Bedding
  '20444': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Pattern', 'Thread Count', 'Features'],
  },
  // Rugs
  '20571': {
    required: ['Brand', 'Size', 'Colour'],
    recommended: ['Material', 'Style', 'Shape', 'Pattern'],
  },
  // LEGO
  '19006': {
    required: ['Brand', 'LEGO Theme', 'LEGO Set Number'],
    recommended: ['Age Level', 'Number of Pieces', 'Year'],
  },
  // Books
  '267': {
    required: ['Book Title', 'Author', 'Format', 'Language'],
    recommended: ['Publisher', 'Publication Year', 'Genre', 'ISBN'],
  },
}

/**
 * Generic fallback for categories not yet seeded. Always-required basics that
 * any reasonable eBay listing should carry.
 */
export const GENERIC_ASPECTS: CategoryAspects = {
  required: ['Brand', 'Condition'],
  recommended: ['Colour', 'Size', 'Material', 'Type', 'Style'],
}

export function aspectsForCategory(categoryId: string | null | undefined): CategoryAspects {
  if (!categoryId) return GENERIC_ASPECTS
  return EBAY_ASPECTS_BY_CATEGORY[String(categoryId)] ?? GENERIC_ASPECTS
}
