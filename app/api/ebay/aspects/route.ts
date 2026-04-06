import { type NextRequest, NextResponse } from 'next/server'
import { getEbayAppToken } from '@/app/lib/ebay-app-token'

// Plain-English descriptions for common eBay item specific fields.
// Shown below each field label so sellers understand what to enter.
const ASPECT_DESCRIPTIONS: Record<string, string> = {
  'Brand':                           "The brand or manufacturer. e.g. 'Sony', 'Nike', 'Unbranded'",
  'Colour':                          "The main colour of the item. e.g. 'Black', 'Navy Blue', 'Multicolour'",
  'Color':                           "The main colour of the item. e.g. 'Black', 'Navy Blue', 'Multicolour'",
  'Size':                            "The size of the item. Format varies by category — e.g. 'M', 'L', '32', '10 UK'",
  'Size Type':                       "Whether sizing is standard, petite, plus, tall, etc.",
  'Department':                      "The intended audience. e.g. 'Men', 'Women', 'Boys', 'Girls', 'Unisex Adults'",
  'Material':                        "The main material. e.g. 'Cotton', 'Leather', 'Stainless Steel', 'Polyester'",
  'Type':                            "A sub-type that narrows down the specific style within this category",
  'Style':                           "The design style or occasion. e.g. 'Casual', 'Formal', 'Vintage', 'Sporty'",
  'Theme':                           "A decorative theme. e.g. 'Floral', 'Abstract', 'Animal Print', 'Geometric'",
  'Pattern':                         "The surface pattern. e.g. 'Plain', 'Striped', 'Checked', 'Floral', 'Printed'",
  'MPN':                             "Manufacturer Part Number — the unique code the maker uses to identify this product",
  'EAN':                             "European Article Number — the 13-digit barcode printed on the product or packaging",
  'UPC':                             "Universal Product Code — the 12-digit barcode, mainly used in North America",
  'ISBN':                            "International Standard Book Number — for books only",
  'Country/Region of Manufacture':   "Where the item was made. e.g. 'United Kingdom', 'China', 'Germany'",
  'Custom Bundle':                   "Select Yes if this listing bundles multiple different items sold together",
  'Modified Item':                   "Select Yes if the item has been altered from its original manufactured state",
  'Non-Domestic Product':            "Select Yes if the item was not originally manufactured for the UK market",
  'Vintage':                         "Select Yes if the item is 20+ years old and considered vintage",
  'Features':                        "Notable features or selling points. e.g. 'Waterproof', 'Wireless', 'Anti-Slip'",
  'Sport':                           "The sport or activity this item is designed for",
  'Season':                          "The season this item suits. e.g. 'Summer', 'Winter', 'All Season'",
  'Occasion':                        "The occasion this item is suited for. e.g. 'Casual', 'Wedding', 'Work'",
  'Neckline':                        "The neckline style. e.g. 'V-Neck', 'Crew Neck', 'Boat Neck', 'Turtleneck'",
  'Sleeve Length':                   "e.g. 'Short Sleeve', 'Long Sleeve', '3/4 Sleeve', 'Sleeveless'",
  'Closure':                         "How the item fastens. e.g. 'Zip', 'Button', 'Hook & Eye', 'Velcro', 'Slip On'",
  'Lining':                          "Whether the item has an internal lining. e.g. 'Lined', 'Unlined', 'Partially Lined'",
  'Fabric Type':                     "The fabric construction. e.g. 'Woven', 'Knitted', 'Jersey', 'Denim'",
  'Fit':                             "The cut of the garment. e.g. 'Slim Fit', 'Regular', 'Relaxed', 'Oversized'",
  'Garment Care':                    "Washing instructions. e.g. 'Machine Washable', 'Hand Wash Only', 'Dry Clean Only'",
  'Compatible Brand':                "Brands this item is compatible with or designed to fit",
  'Compatible Model':                "Specific models this part or accessory fits",
  'Shoe Width':                      "The width fitting. e.g. 'Standard (D)', 'Wide (E)', 'Extra Wide (EEE)'",
  'Upper Material':                  "The material used for the upper part of the shoe. e.g. 'Leather', 'Canvas', 'Mesh'",
  'Sole Material':                   "The sole material. e.g. 'Rubber', 'Leather', 'Synthetic'",
  'Heel Height':                     "e.g. 'Flat (under 1\")', 'Low (1–3cm)', 'Mid (3–7cm)', 'High (8cm+)'",
  'Heel Type':                       "The heel shape. e.g. 'Block', 'Stiletto', 'Wedge', 'Kitten', 'Cone'",
  'Toe Style':                       "The toe shape. e.g. 'Round Toe', 'Pointed Toe', 'Square Toe', 'Open Toe'",
  'Connectivity':                    "How the device connects. e.g. 'USB-C', 'Bluetooth', 'Wi-Fi', 'HDMI'",
  'Storage Capacity':                "Data storage size. e.g. '128GB', '256GB', '1TB', '2TB'",
  'Screen Size':                     "Diagonal screen measurement. e.g. '15.6\"', '27\"', '13 inches'",
  'Operating System':                "The OS the device runs. e.g. 'Windows 11', 'Android 14', 'macOS Sonoma'",
  'Processor':                       "The CPU model. e.g. 'Intel Core i7-13th Gen', 'Apple M3', 'AMD Ryzen 7'",
  'RAM':                             "Amount of memory. e.g. '8GB', '16GB', '32GB'",
  'Resolution':                      "Screen or camera resolution. e.g. '1920x1080 (Full HD)', '4K (3840x2160)'",
  'Model':                           "The specific model name or number. e.g. 'iPhone 15 Pro', 'MacBook Air M3'",
  'Room':                            "The room this item is designed for. e.g. 'Living Room', 'Bedroom', 'Kitchen'",
  'Antique':                         "Select Yes if the item is 100+ years old",
  'Finish':                          "The surface finish. e.g. 'Matte', 'Gloss', 'Brushed', 'Chrome', 'Polished'",
  'Shape':                           "The shape of the item. e.g. 'Round', 'Square', 'Rectangular', 'Oval'",
  'Capacity':                        "The volume or capacity. e.g. '500ml', '1 Litre', '2.5L', '10 Litres'",
  'Format':                          "Physical or digital format. e.g. 'Blu-ray', 'DVD', 'Paperback', 'Hardback'",
  'Region':                          "Regional encoding or market. e.g. 'UK', 'PAL', 'Region 2', 'All Regions'",
  'Edition':                         "Specific edition or version. e.g. 'Collector\'s Edition', '1st Edition', 'Special Edition'",
  'Language':                        "The language of the content. e.g. 'English', 'French', 'Spanish'",
  'Genre':                           "The genre. e.g. 'Rock', 'Fiction', 'Action', 'Documentary', 'Comedy'",
  'Artist':                          "The artist, band, or performer name",
  'Author':                          "The author of the book or written work",
  'Publisher':                       "The publisher of the book, game, or software",
  'Platform':                        "The gaming platform. e.g. 'PlayStation 5', 'Xbox Series X', 'Nintendo Switch', 'PC'",
  'Certificate':                     "Age rating. e.g. 'U', 'PG', '12', '15', '18', 'BBFC Exempt'",
  'Handmade':                        "Select Yes if the item was handcrafted rather than mass-produced",
  'Character':                       "The character depicted or featured. e.g. 'Spider-Man', 'Mickey Mouse'",
  'Character Family':                "The franchise or universe. e.g. 'Star Wars', 'Marvel', 'Disney'",
  'Vehicle Type':                    "Type of vehicle. e.g. 'Car', 'Motorcycle', 'Van', 'Truck', 'Bicycle'",
  'Year':                            "The year of manufacture or the year range the part is compatible with",
  'Make':                            "The vehicle manufacturer. e.g. 'Ford', 'BMW', 'Toyota', 'Volkswagen'",
  'Placement on Vehicle':            "Where on the vehicle this part installs. e.g. 'Front Left', 'Rear', 'Driver Side'",
  'Warranty':                        "Warranty period offered. e.g. '12 Months', '2 Years', 'No Warranty'",
  'Width':                           "The width measurement. Include the unit — e.g. '45cm', '18 inches'",
  'Height':                          "The height measurement. Include the unit — e.g. '120cm', '4 feet'",
  'Length':                          "The length measurement. Include the unit — e.g. '200cm', '6 feet'",
  'Depth':                           "The depth or thickness. Include the unit — e.g. '5cm', '2 inches'",
  'Weight':                          "The item weight. Include the unit — e.g. '1.5kg', '500g', '3 lbs'",
  'Power':                           "Power rating. e.g. '1200W', '60W', '2200W'",
  'Voltage':                         "Operating voltage. e.g. '220–240V', '110V', '12V DC'",
  'Number of Pieces':                "How many individual pieces are included in this listing",
  'Number of Items in Set':          "Total count of items in this set or pack",
  'Set Includes':                    "List what's included. e.g. 'Duvet, 2 Pillow Cases, 2 Fitted Sheets'",
  'Unit Type':                       "Unit of measurement for pricing. e.g. 'Per Item', 'Per Kg', 'Per Litre'",
  'Unit Quantity':                   "The number of units in this listing",
  'Sub-Type':                        "A more specific classification within the main type",
  'Original/Reproduction':           "Whether this is an original piece or a reproduction/replica",
  'Surface Finish':                  "The surface treatment. e.g. 'Painted', 'Primed', 'Anodised', 'Powder Coated'",
  'Director':                        "The director of the film or TV production",
  'Label':                           "The record label that released the music",
}

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get('categoryId')

  if (!categoryId) {
    return NextResponse.json({ aspects: [] })
  }

  try {
    const token = await getEbayAppToken()

    const res = await fetch(
      `https://api.ebay.com/commerce/taxonomy/v1/category_tree/3/get_item_aspects_for_category?category_id=${categoryId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!res.ok) {
      console.error('eBay aspects fetch failed:', res.status)
      return NextResponse.json({ aspects: [] })
    }

    const data = await res.json()

    const aspects = (data.aspects || [])
      .filter((a: any) => a.aspectConstraint?.aspectUsage !== 'OPTIONAL')
      .map((a: any) => ({
        name:        a.aspectName,
        usage:       (a.aspectConstraint?.aspectUsage || 'OPTIONAL') as 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL',
        required:    a.aspectConstraint?.aspectUsage === 'REQUIRED',
        mode:        (a.aspectConstraint?.aspectMode || 'FREE_TEXT') as 'FREE_TEXT' | 'SELECTION_ONLY' | 'FREE_TEXT_AND_SELECTION',
        cardinality: (a.aspectConstraint?.itemToAspectCardinality || 'SINGLE') as 'SINGLE' | 'MULTI',
        values:      (a.aspectValues || []).map((v: any) => v.localizedValue).slice(0, 80),
        type:        a.aspectConstraint?.aspectDataType || 'STRING',
        description: ASPECT_DESCRIPTIONS[a.aspectName] || null,
      }))
      .sort((a: any, b: any) => {
        const order = { REQUIRED: 0, RECOMMENDED: 1, OPTIONAL: 2 }
        return (order[a.usage as keyof typeof order] ?? 2) - (order[b.usage as keyof typeof order] ?? 2)
      })

    return NextResponse.json({ aspects })
  } catch (err: any) {
    console.error('eBay aspects error:', err.message)
    return NextResponse.json({ aspects: [] })
  }
}
