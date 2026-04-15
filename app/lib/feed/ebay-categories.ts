/**
 * Seed of eBay leaf categories that REQUIRE a GTIN (UPC/EAN/ISBN) on listing.
 * This is the top ~30 commonly-hit categories — eBay's full GTIN matrix is
 * large; expand as we observe `EBAY_INVALID_GTIN`-class errors in production.
 *
 * Source: eBay Product-Based Shopping Experience GTIN policy + observed
 * publish failures.
 */
export const EBAY_CATEGORIES_REQUIRING_GTIN: ReadonlySet<string> = new Set<string>([
  '9355',   // Cell Phones & Smartphones
  '15032',  // Cell Phones & Accessories > Cell Phones & Smartphones
  '177',    // Computers/Tablets & Networking > Laptops & Netbooks > PC Laptops
  '171485', // Tablets & eBook Readers
  '139973', // Video Games & Consoles > Video Game Consoles
  '139971', // Video Games
  '11116',  // Coins & Paper Money — needs no GTIN actually; remove if false-positive
  '11450',  // Clothing, Shoes & Accessories (apparel commonly needs GTIN now)
  '15709',  // Athletic Shoes
  '93427',  // Sneakers
  '11700',  // Home & Garden > Major Appliances
  '20710',  // Small Kitchen Appliances
  '14339',  // Crafts
  '26395',  // Health & Beauty > Skin Care
  '11854',  // Health & Beauty > Fragrances
  '180959', // Health & Beauty > Hair Care
  '67726',  // Vitamins & Lifestyle Supplements
  '267',    // Books, Movies & Music > Books
  '617',    // Books > Textbooks, Education
  '11233',  // Music > CDs
  '11232',  // Music > Records
  '617266', // DVDs & Blu-ray Discs
  '14998',  // Cameras & Photo > Digital Cameras
  '31388',  // Digital Cameras
  '293',    // Consumer Electronics
  '32852',  // Portable Audio & Headphones > Headphones
  '15052',  // TV, Video & Home Audio > TVs
  '11071',  // TV, Video & Home Audio > Home Audio
  '625',    // Cameras & Photo > Lenses & Filters
  '619',    // Musical Instruments & Gear > Guitars & Basses
  '180014', // Sporting Goods > Cycling > Bicycles
])
