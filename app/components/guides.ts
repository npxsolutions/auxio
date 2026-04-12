export interface GuideStep {
  title: string
  description: string
}

export interface Guide {
  title: string
  description: string
  steps: GuideStep[]
  tips?: string[]
}

export const guides: Record<string, Guide> = {
  '/dashboard': {
    title: 'Dashboard',
    description: 'Your command centre. See revenue, profit, orders, and channel health at a glance — all in real time.',
    steps: [
      { title: 'Read the KPI cards', description: 'Revenue, profit, orders, and margin update every time you load. Profit is after COGS and platform fees.' },
      { title: 'Check channel health', description: 'Each connected channel shows a health score. Red means action needed — usually a broken auth token or listing error.' },
      { title: 'Review AI suggestions', description: 'The AI Agent card surfaces the top 3 things to act on today, ranked by revenue impact.' },
      { title: 'Spot trends in the chart', description: 'The revenue chart defaults to 30 days. Switch to 7d to catch daily spikes or 90d to see growth trajectory.' },
    ],
    tips: [
      'Dashboard refreshes on every page load — bookmark it as your daily opening tab.',
      'Low margin alert? Head to Costs & Margins to fill in missing COGS.',
    ],
  },

  '/listings': {
    title: 'Listings',
    description: 'All your product listings across every connected channel in one place. Edit once, sync everywhere.',
    steps: [
      { title: 'Filter by channel or status', description: 'Use the top filter bar to narrow down to a specific channel (e.g. eBay) or status (active, draft, error).' },
      { title: 'Open a listing', description: 'Click any row to open the full listing editor. Change title, description, price, and images from one screen.' },
      { title: 'Publish to channels', description: 'Use the Publish button inside a listing to push it to one or more channels simultaneously.' },
      { title: 'Bulk actions', description: 'Tick multiple rows to reprice, relist, or delete in bulk — saves time on large catalogues.' },
    ],
    tips: [
      'Listings with a red dot have a sync error — hover to see what went wrong.',
      'Use the Health score column to find listings with missing images or poor descriptions.',
    ],
  },

  '/listings/[id]': {
    title: 'Listing Editor',
    description: 'Edit every detail of a single listing and control exactly which channels it appears on.',
    steps: [
      { title: 'Edit core details', description: 'Title, description, price, and category are synced to all channels when you save.' },
      { title: 'Manage channel variants', description: 'Each channel can have its own price override, stock allocation, and status without affecting others.' },
      { title: 'AI Optimise', description: 'Hit "AI Optimise" to get a rewritten title and description tuned for search visibility on each platform.' },
      { title: 'View listing health', description: 'The health panel scores your listing out of 100 and tells you exactly what to fix.' },
    ],
    tips: [
      'Price changes take effect immediately on connected channels.',
      'Always fill in the category — listings without one are suppressed on most channels.',
    ],
  },

  '/orders': {
    title: 'Orders',
    description: 'Every order from every channel in one unified view. Track status, despatch, and returns without switching tabs.',
    steps: [
      { title: 'Filter by status', description: 'Use the tabs to switch between pending, processing, despatched, and returned. Pending orders need action first.' },
      { title: 'Search and sort', description: 'Search by order number, customer name, or SKU. Sort by date or value to prioritise high-ticket orders.' },
      { title: 'Mark as despatched', description: 'Click an order and add a tracking number — this updates the status on the originating channel automatically.' },
      { title: 'Handle returns', description: 'Open an order and click "Return" to log it. Stock is added back to inventory automatically.' },
    ],
    tips: [
      'Orders older than 30 days are archived — use the date filter to access them.',
      'Channel column shows the source so you know which fulfilment rules apply.',
    ],
  },

  '/inventory': {
    title: 'Inventory',
    description: 'Real-time stock levels across all channels. Set buffers, get low-stock alerts, and prevent overselling.',
    steps: [
      { title: 'Check stock levels', description: 'The table shows available, reserved (awaiting despatch), and total stock per SKU.' },
      { title: 'Set safety buffers', description: 'Go to Inventory → Buffers to set a minimum stock level. Listings auto-pause when stock hits the buffer.' },
      { title: 'Update stock manually', description: 'Click any SKU to edit the stock count — useful after a stocktake or a goods-in that bypassed your supplier system.' },
      { title: 'Review low-stock alerts', description: 'Items highlighted in amber are within 7 days of stockout based on current sales velocity.' },
    ],
    tips: [
      'Use buffers on your fastest-moving SKUs to avoid negative feedback from overselling.',
      'Connect Purchase Orders to auto-update "incoming stock" dates on this page.',
    ],
  },

  '/inventory/buffers': {
    title: 'Inventory Buffers',
    description: 'Set minimum stock thresholds per SKU. When stock hits the buffer, listings pause automatically to prevent overselling.',
    steps: [
      { title: 'Set a default buffer', description: 'Apply a single buffer value (e.g. 2 units) to all SKUs at once using the "Apply to all" button.' },
      { title: 'Override per SKU', description: 'Fast-moving or fragile items can have a higher buffer — click any row to set a custom value.' },
      { title: 'Enable auto-pause', description: 'Toggle on "Auto-pause listings" so that when stock reaches the buffer, listings go to draft automatically.' },
    ],
    tips: [
      'Buffer of 1 is the minimum — it gives you one unit of headroom if a channel sync is delayed.',
      'High-velocity SKUs (selling 5+ per day) benefit from a buffer of 5–10.',
    ],
  },

  '/channels': {
    title: 'Channels',
    description: 'Connect and manage your sales channels. Each connected channel syncs listings, orders, and inventory in real time.',
    steps: [
      { title: 'Connect a channel', description: 'Click "Connect" next to any channel. You\'ll be redirected to authorise the connection on the channel\'s own platform.' },
      { title: 'Check connection health', description: 'A green dot means syncing. Amber means degraded — usually an expired token. Red means the connection is broken.' },
      { title: 'Reconnect if needed', description: 'Tokens expire on most platforms every 90 days. Click "Reconnect" to refresh without losing your settings.' },
      { title: 'Disconnect safely', description: 'Disconnecting removes the sync but does not delete listings from the channel — they just stop updating.' },
    ],
    tips: [
      'Connect your highest-volume channel first, then add others one by one.',
      'eBay and Amazon require separate seller accounts for each region.',
    ],
  },

  '/analytics': {
    title: 'Analytics',
    description: 'Revenue, orders, and profit trends broken down by channel, time period, and SKU.',
    steps: [
      { title: 'Pick a time period', description: 'Use the period selector (7d / 30d / 90d / 1y) to change the reporting window. All charts update together.' },
      { title: 'Compare channels', description: 'The channel breakdown shows which platforms are driving the most revenue and margin — not just volume.' },
      { title: 'Identify top SKUs', description: 'The top products table shows your best sellers by revenue. Cross-reference with margin to find truly profitable lines.' },
      { title: 'Read the trend chart', description: 'Daily revenue bars show seasonality patterns. Dips on weekends are normal for B2B; spikes often follow promotions.' },
    ],
    tips: [
      'Revenue without COGS data is misleading — fill in costs first for accurate margin stats.',
      'Export the top SKUs table to use in reorder decisions alongside Forecasting.',
    ],
  },

  '/repricing': {
    title: 'Repricing',
    description: 'Automatically adjust prices to stay competitive or protect your margins — rules run on every sync.',
    steps: [
      { title: 'Create a repricing rule', description: 'Click "New Rule" and choose a strategy: match lowest, beat by %, or protect margin floor.' },
      { title: 'Set a floor price', description: 'The floor is the minimum price you\'ll ever sell at. Auxio will never go below it, even in a race to the bottom.' },
      { title: 'Scope the rule', description: 'Apply rules to a specific channel, category, or set of SKUs — or run them globally.' },
      { title: 'Monitor the activity log', description: 'Every price change is logged with the before/after price and the rule that triggered it.' },
    ],
    tips: [
      'Start with a margin-floor rule before enabling competitive repricing — it prevents accidental losses.',
      'Repricing runs on every inventory sync (every 2 hours by default).',
    ],
  },

  '/rules': {
    title: 'Feed Rules',
    description: 'Transform your listing data before it reaches each channel. Remap fields, rewrite titles, filter products, and more.',
    steps: [
      { title: 'Create a rule', description: 'Click "New Rule" and choose a trigger (field, category, channel) and action (set, append, transform, filter).' },
      { title: 'Use AND / OR conditions', description: 'Chain multiple conditions to target exactly the right listings — e.g. "category = Clothing AND price > £20".' },
      { title: 'Preview before activating', description: 'Use the preview panel to see exactly which listings a rule will affect before you turn it on.' },
      { title: 'Schedule rules', description: 'Rules can run continuously or on a schedule — useful for seasonal title changes or promotional pricing windows.' },
    ],
    tips: [
      'Rules run in priority order — drag to reorder if two rules conflict.',
      'Start with title transformation rules to improve search ranking on eBay and Amazon.',
    ],
  },

  '/lookup-tables': {
    title: 'Lookup Tables',
    description: 'Map values from one format to another — e.g. your internal category codes to eBay category IDs.',
    steps: [
      { title: 'Create a table', description: 'Click "New Table", give it a name, and add key→value rows. Tables are referenced inside Feed Rules.' },
      { title: 'Use in a rule', description: 'In a Feed Rule action, choose "Lookup" and reference the table name to dynamically map values.' },
      { title: 'Import via CSV', description: 'For large mappings (e.g. 500 brand names), upload a CSV with two columns: source and target.' },
    ],
    tips: [
      'Common use: map your own size labels (S/M/L) to channel-specific values (Small/Medium/Large).',
      'Lookup tables update live — changes apply on the next sync without recreating rules.',
    ],
  },

  '/suppliers': {
    title: 'Suppliers',
    description: 'Your supplier directory. Track contact details, payment terms, lead times, and total spend per supplier.',
    steps: [
      { title: 'Add a supplier', description: 'Click "Add Supplier" and fill in name, contact, payment terms, and average lead time in days.' },
      { title: 'Link to purchase orders', description: 'Once added, create Purchase Orders against this supplier to track spend and open commitments.' },
      { title: 'Track spend history', description: 'The "Total Spend" column aggregates all received purchase orders — useful for negotiating volume discounts.' },
    ],
    tips: [
      'Set the lead time accurately — it feeds into Forecasting to calculate reorder dates.',
      'Use the notes field to store important things like minimum order quantities or preferred contact times.',
    ],
  },

  '/purchase-orders': {
    title: 'Purchase Orders',
    description: 'Create and track purchase orders from draft to received. Stock levels update automatically when you mark a PO as received.',
    steps: [
      { title: 'Create a PO', description: 'Click "New PO", select a supplier, add line items (SKU, qty, unit cost), and set an expected delivery date.' },
      { title: 'Progress the status', description: 'Move a PO from Draft → Sent → Confirmed → Received as the order progresses. Each step is timestamped.' },
      { title: 'Mark as received', description: 'When goods arrive, click "Mark Received". Stock levels increase immediately across all channels.' },
      { title: 'Track open commitments', description: 'The "Open Value" card shows total spend committed but not yet received — important for cash flow.' },
    ],
    tips: [
      'PO numbers are auto-generated (PO-0001, PO-0002...) but you can override with your supplier\'s reference.',
      'Partially received POs show a split status — useful for split deliveries.',
    ],
  },

  '/forecasting': {
    title: 'Demand Forecasting',
    description: 'See which SKUs are at risk of stockout, when you need to reorder, and how many units to buy — calculated from real sales velocity.',
    steps: [
      { title: 'Read the risk tiers', description: 'Critical (red) = 7 days or less stock. Low (amber) = 7–21 days. OK (green) = 21+ days. Sort by critical first.' },
      { title: 'Check days remaining', description: 'Days Left is calculated from current stock ÷ daily sales rate over the last 90 days.' },
      { title: 'Use Quick PO', description: 'Click "Quick PO" on any critical or low-stock item to instantly create a purchase order with the suggested quantity.' },
      { title: 'Adjust for lead time', description: 'If your supplier takes 14 days, reorder when you have 21+ days of stock left — that\'s a 7-day safety buffer.' },
    ],
    tips: [
      'New products with fewer than 14 days of sales history show as "Insufficient data" — expected.',
      'Daily rate is smoothed over 90 days, so a single flash-sale spike won\'t skew the forecast.',
    ],
  },

  '/advertising': {
    title: 'Advertising & PPC',
    description: 'Track all your paid advertising campaigns across channels. Monitor ACOS, ROAS, and spend in one place.',
    steps: [
      { title: 'Add a campaign', description: 'Click "New Campaign" and enter the channel, campaign name, budget, spend, and revenue generated.' },
      { title: 'Set a target ACOS', description: 'ACOS (Advertising Cost of Sale) = spend ÷ revenue. Set a target per campaign — rows turn red if you exceed it.' },
      { title: 'Monitor blended ROAS', description: 'The summary bar shows blended ROAS across all campaigns — the headline number for advertising efficiency.' },
      { title: 'Update campaign data', description: 'Update spend and revenue figures regularly (weekly minimum). Most channels don\'t have live API sync yet.' },
    ],
    tips: [
      'ACOS of 15–25% is typical for well-optimised ecommerce campaigns.',
      'A high CTR but low CVR usually means your listing page needs work, not the ad itself.',
    ],
  },

  '/bundles': {
    title: 'Bundles & Kitting',
    description: 'Create product bundles from multiple SKUs, track combined COGS, and calculate bundle margin automatically.',
    steps: [
      { title: 'Create a bundle', description: 'Click "New Bundle", give it a name and SKU, set the sell price, then add component items with quantities and unit costs.' },
      { title: 'Check live margin', description: 'The margin calculator updates as you add components — it shows total COGS vs sell price and margin %.' },
      { title: 'Activate the bundle', description: 'Toggle "Active" when the bundle is ready to list. Inactive bundles won\'t appear in channel sync.' },
      { title: 'Link to a listing', description: 'Once active, create a Listing and reference the bundle SKU — stock deduction pulls from all component items.' },
    ],
    tips: [
      'Aim for 30%+ margin on bundles — you\'re doing the picking work so the margin should reflect it.',
      'Bundles with 3+ components often justify a 15–20% price premium over buying items separately.',
    ],
  },

  '/developer': {
    title: 'Developer & API',
    description: 'Generate API keys to access your Auxio data programmatically, and set up webhooks to receive real-time events.',
    steps: [
      { title: 'Create an API key', description: 'Click "New API Key", choose scopes (read/write per resource), and copy the key — it\'s only shown once.' },
      { title: 'Use the key', description: 'Pass the key as a Bearer token: Authorization: Bearer auxio_xxxx. All endpoints return JSON.' },
      { title: 'Set up a webhook', description: 'Add a URL and select the events you want (e.g. order.created, listing.synced). We\'ll POST a signed payload.' },
      { title: 'Verify webhook signatures', description: 'Use the signing secret (whsec_xxxx) to verify the HMAC-SHA256 signature on incoming webhook payloads.' },
    ],
    tips: [
      'Use read-only keys for analytics integrations — only give write scope to trusted internal tools.',
      'Test your webhook endpoint with a tool like webhook.site before pointing it at production.',
    ],
  },

  '/financials': {
    title: 'Financials',
    description: 'Your P&L and cash flow across the last 12 months — calculated from real transactions and purchase orders.',
    steps: [
      { title: 'Read the P&L table', description: 'Each row is a month. Revenue is gross sales. Gross Profit subtracts COGS. Net Profit also subtracts platform fees.' },
      { title: 'Check working capital', description: 'The working capital cards show open PO commitments (cash going out soon) vs last 30 days revenue (cash coming in).' },
      { title: 'Switch to Cash Flow', description: 'The Cash Flow tab shows cumulative net cash position month by month — useful for spotting seasonal cash squeezes.' },
      { title: 'Improve accuracy', description: 'Missing COGS data means Gross Profit is understated. Go to Costs & Margins to fill in unit costs.' },
    ],
    tips: [
      'Share the P&L view with your accountant — it maps cleanly to a management accounts format.',
      'Negative net profit in a month usually means a large PO was placed — check the working capital card.',
    ],
  },

  '/costs': {
    title: 'Costs & Margins',
    description: 'Set the cost price for every product so Auxio can calculate real profit across all reports.',
    steps: [
      { title: 'Fill in missing costs', description: 'Products highlighted in yellow have no cost price set. Click the cost cell and type the value — press Enter to save.' },
      { title: 'Apply a default %', description: 'If you don\'t know exact costs, use "Apply default COGS %" to set a percentage of sell price across all unpriced items.' },
      { title: 'Filter by low margin', description: 'Switch to "Low margin (<15%)" filter to find products that are barely breaking even.' },
      { title: 'Review regularly', description: 'Costs change — especially after supplier price rises. Run through this page quarterly.' },
    ],
    tips: [
      'COGS should include product cost + any import duties or per-unit shipping from supplier.',
      'A 30%+ gross margin on most products gives you room to absorb platform fees and advertising.',
    ],
  },

  '/settings': {
    title: 'Settings',
    description: 'Manage your account profile, notification preferences, and store-level configuration.',
    steps: [
      { title: 'Update your profile', description: 'Change your name, email, and timezone. Timezone affects when daily digest emails are sent.' },
      { title: 'Set notifications', description: 'Choose which events trigger email alerts — low stock, new orders, sync errors, and repricing activity.' },
      { title: 'Configure your store', description: 'Set your default currency, VAT rate, and platform fee % — these are used in all profit calculations.' },
    ],
    tips: [
      'Set your VAT rate correctly — it affects displayed margins if your pricing includes VAT.',
      'Notification overload? Turn off repricing alerts and keep only errors and low-stock.',
    ],
  },

  '/billing': {
    title: 'Billing',
    description: 'Manage your subscription plan, view invoices, and update payment details.',
    steps: [
      { title: 'View your current plan', description: 'Your active plan and renewal date are shown at the top. All features included in your tier are listed below.' },
      { title: 'Upgrade or downgrade', description: 'Click "Change Plan" to switch. Upgrades take effect immediately; downgrades kick in at the next renewal date.' },
      { title: 'Download invoices', description: 'Past invoices are listed with a download link — useful for expense reporting and VAT reclaim.' },
    ],
    tips: [
      'Growth plan unlocks advanced repricing and analytics — worth it from £5k+ GMV/month.',
      'Annual plans save 20% — switch in the billing portal if you\'re past the trial period.',
    ],
  },

  '/agent': {
    title: 'AI Agent',
    description: 'Your autonomous ecommerce assistant. It monitors your store, spots opportunities, and can act on your behalf.',
    steps: [
      { title: 'Review suggestions', description: 'The agent surfaces the top actions by revenue impact — repricing opportunities, stockout risks, listing errors.' },
      { title: 'Approve or dismiss', description: 'Each suggestion has "Approve" (act now) and "Dismiss" (ignore). Approved actions execute immediately.' },
      { title: 'Enable autopilot', description: 'Toggle autopilot to let the agent act on low-risk items automatically — it will still log everything it does.' },
      { title: 'Read the action log', description: 'Every action the agent takes is recorded with a reason and outcome — full audit trail.' },
    ],
    tips: [
      'Start in manual mode (approve each action) until you\'re comfortable with how the agent reasons.',
      'The agent gets smarter as more data flows in — it\'s most useful from month 2 onwards.',
    ],
  },

  '/social-intel': {
    title: 'Social Intelligence',
    description: 'Track competitor activity, trending products, and market signals from social channels.',
    steps: [
      { title: 'Add a competitor or keyword', description: 'Enter a brand name, product keyword, or URL to start tracking. Data is ingested within 24 hours.' },
      { title: 'Read trend signals', description: 'Rising signals mean a product or category is gaining traction — useful for sourcing decisions.' },
      { title: 'Query with AI', description: 'Use the chat interface to ask questions like "What are competitors doing on TikTok this week?" and get a summary.' },
    ],
    tips: [
      'Focus on 3–5 direct competitors rather than broad category keywords for the most useful signals.',
      'Combine with Forecasting — a trending product + low stock = reorder urgently.',
    ],
  },

  '/returns': {
    title: 'Returns',
    description: 'Manage and track product returns across all channels. Log reasons, update stock, and monitor return rates.',
    steps: [
      { title: 'Log a return', description: 'Find the original order, click "Return", select items and a reason code. Stock is updated automatically.' },
      { title: 'Review return reasons', description: 'The reason breakdown shows whether returns are driven by product quality, description mismatch, or delivery issues.' },
      { title: 'Monitor return rate', description: 'High return rates on specific SKUs often point to a listing problem — misleading images or inaccurate descriptions.' },
    ],
    tips: [
      'A return rate above 5% on any SKU is worth investigating — check the listing and customer messages.',
      'Returns from Amazon are processed automatically if you have Amazon connected.',
    ],
  },

  '/shipping': {
    title: 'Shipping',
    description: 'Configure shipping profiles, carrier integrations, and fulfilment rules per channel.',
    steps: [
      { title: 'Set up a shipping profile', description: 'Create profiles for different carrier/service combinations — e.g. Royal Mail 1st Class, DPD Next Day.' },
      { title: 'Map to channels', description: 'Assign a default shipping profile per channel so orders are auto-routed to the right carrier.' },
      { title: 'Configure rules', description: 'Add rules like "orders over £50 → free shipping" or "orders from Scotland → add £3 surcharge".' },
    ],
    tips: [
      'Always have a fallback profile — if no rule matches, orders use the default profile.',
      'Tracked shipping on all orders reduces "not received" disputes dramatically.',
    ],
  },

  '/products': {
    title: 'Products',
    description: 'Your master product catalogue — the source of truth that feeds all channels and listings.',
    steps: [
      { title: 'Browse your catalogue', description: 'Every product synced from connected channels appears here. Use search and filters to find items quickly.' },
      { title: 'Edit product details', description: 'Changes here propagate to all linked listings on next sync — useful for bulk title or description updates.' },
      { title: 'Check duplicate products', description: 'Products with the same EAN or barcode are flagged — merge duplicates to keep inventory counts accurate.' },
    ],
    tips: [
      'Products are different from Listings — a product can have many listings across channels.',
      'Add GTINs (barcodes/EANs) to improve matching accuracy on channels like Amazon and Google Shopping.',
    ],
  },

  '/onboarding': {
    title: 'Getting Started',
    description: 'Welcome to Auxio! Follow these steps to get your store fully set up and syncing.',
    steps: [
      { title: 'Connect your first channel', description: 'Go to Channels and connect eBay, Amazon, Shopify, or wherever you sell most. This imports your listings and orders.' },
      { title: 'Review imported listings', description: 'Head to Listings to check that your products have imported correctly and are all showing as Active.' },
      { title: 'Set cost prices', description: 'Go to Costs & Margins and add COGS for your products — this unlocks real profit tracking across all reports.' },
      { title: 'Set inventory buffers', description: 'Go to Inventory → Buffers and set a minimum stock level to prevent overselling.' },
      { title: 'Explore the dashboard', description: 'Once data is flowing, your Dashboard will start showing real revenue, profit, and order trends.' },
    ],
    tips: [
      'Most sellers are fully set up within 20 minutes of connecting their first channel.',
      'The AI Agent will start surfacing suggestions within 24 hours of your first sync.',
    ],
  },
}

export function getGuide(pathname: string): Guide | null {
  // Exact match first
  if (guides[pathname]) return guides[pathname]

  // Dynamic route match (e.g. /listings/abc123 → /listings/[id])
  const dynamicMap: Record<string, string> = {
    '/listings/': '/listings/[id]',
  }

  for (const [prefix, key] of Object.entries(dynamicMap)) {
    if (pathname.startsWith(prefix) && pathname !== prefix.slice(0, -1)) {
      return guides[key] || null
    }
  }

  return null
}
