// ─────────────────────────────────────────────
//  Lead Scanner — Configuration
//  Set GOOGLE_PLACES_KEY in your environment
//  or paste it directly in API_KEY below.
// ─────────────────────────────────────────────

module.exports = {

  API_KEY: process.env.GOOGLE_PLACES_KEY || '',

  // ── Business categories to scan ──────────────
  categories: [
    {
      name: 'Restaurant / Café',
      queries: ['restaurant', 'cafe', 'dhaba', 'biryani house', 'cloud kitchen'],
    },
    {
      name: 'Boutique / Fashion',
      queries: ['boutique', 'saree shop', 'ethnic wear store', 'handloom shop', 'kurta store'],
    },
    {
      name: 'Clinic / Healthcare',
      queries: ['clinic', 'diagnostic centre', 'physiotherapy centre', 'dental clinic', 'nursing home'],
    },
    {
      name: 'Salon / Spa / Beauty',
      queries: ['beauty salon', 'hair salon', 'spa', 'beauty parlour'],
    },
    {
      name: 'Jewellery',
      queries: ['jewellery shop', 'jewelers', 'gold ornaments shop', 'silver jewellery store'],
    },
    {
      name: 'Real Estate',
      queries: ['real estate agent', 'property dealer', 'housing builder', 'flat broker'],
    },
    {
      name: 'Yoga / Wellness',
      queries: ['yoga studio', 'yoga class', 'wellness centre', 'meditation centre'],
    },
    {
      name: 'Gym / Fitness',
      queries: ['gym', 'fitness centre', 'fitness studio'],
    },
    {
      name: 'Coaching / Education',
      queries: ['coaching centre', 'tuition centre', 'tutorial', 'IIT coaching'],
    },
    {
      name: 'Sweet Shop / Bakery',
      queries: ['sweet shop', 'mishti shop', 'bakery', 'mithai shop'],
    },
  ],

  // ── Cities and their neighbourhoods ───────────
  cities: {
    Kolkata: [
      'Behala Kolkata',
      'Tollygunge Kolkata',
      'Ballygunge Kolkata',
      'Alipore Kolkata',
      'Gariahat Kolkata',
      'New Town Kolkata',
      'Salt Lake City Kolkata',
      'Garia Kolkata',
      'Jadavpur Kolkata',
      'Park Street Kolkata',
      'Shyambazar Kolkata',
      'Hatibagan Kolkata',
      'Lake Town Kolkata',
      'Dum Dum Kolkata',
      'Rajarhat Kolkata',
    ],
    Gurugram: [
      'Sector 14 Gurugram',
      'Sector 29 Gurugram',
      'DLF Phase 1 Gurugram',
      'DLF Phase 4 Gurugram',
      'Sohna Road Gurugram',
      'MG Road Gurugram',
      'Sector 56 Gurugram',
      'Palam Vihar Gurugram',
      'South City Gurugram',
      'Nirvana Country Gurugram',
    ],
    Hyderabad: [
      'Banjara Hills Hyderabad',
      'Jubilee Hills Hyderabad',
      'Madhapur Hyderabad',
      'Gachibowli Hyderabad',
      'Kondapur Hyderabad',
      'Kukatpally Hyderabad',
      'Secunderabad Hyderabad',
      'Himayatnagar Hyderabad',
      'Ameerpet Hyderabad',
      'Miyapur Hyderabad',
    ],
    Bangalore: [
      'Indiranagar Bangalore',
      'Koramangala Bangalore',
      'Jayanagar Bangalore',
      'HSR Layout Bangalore',
      'Whitefield Bangalore',
      'Marathahalli Bangalore',
      'JP Nagar Bangalore',
      'Malleshwaram Bangalore',
      'Rajajinagar Bangalore',
      'Yelahanka Bangalore',
    ],
  },

  // Cities to scan (set to null to scan all)
  // e.g. SCAN_CITIES: ['Kolkata', 'Gurugram']
  SCAN_CITIES: null,

  // ── Scoring weights ────────────────────────────
  scoring: {
    NO_WEBSITE:          50,
    WEAK_WEBSITE:        35,   // Facebook / JustDial / IndiaMart / Sulekha only
    TEMPLATE_WEBSITE:    15,   // Wix / Blogspot — poor quality
    OWN_GOOD_SITE:        0,
    REVIEWS_300_PLUS:    30,
    REVIEWS_100_TO_299:  20,
    REVIEWS_50_TO_99:    10,
    REVIEWS_25_TO_49:     5,
    RATING_4_5_PLUS:     15,
    RATING_4_0_PLUS:     10,
  },

  MIN_REVIEWS:          25,
  MIN_SCORE:            40,
  MAX_RESULTS_PER_QUERY: 20,
  API_DELAY_MS:         250,
  WEBSITE_TIMEOUT_MS:   7000,

  // Hard budget cap — scan stops if estimated cost exceeds this.
  // Google's free tier is $200/month. Keeping this at $15 means
  // you can run the full scan ~13 times per month and never pay.
  BUDGET_LIMIT_USD: 15,
};
