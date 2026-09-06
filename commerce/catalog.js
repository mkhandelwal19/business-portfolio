/* =============================================================================
   commerce/catalog.js — the product catalogue
   -----------------------------------------------------------------------------
   Static for the demo, and deliberately shaped like a database row rather than
   like display copy, so moving it to Supabase later is a change of source and
   not a rewrite of every page.

   Money is in PAISE, always, as integers. Never floats: 0.1 + 0.2 is not 0.3 in
   binary floating point, and a store that gets a rupee wrong on one order in a
   thousand is a store nobody trusts twice.

   GST is stored per product because it genuinely differs — handicrafts are
   mostly 12%, textiles under ₹1,000 are 5%, and getting that wrong is a
   compliance problem, not a rounding one. Indian retail prices are quoted
   INCLUSIVE of GST, so `price` is what the customer pays and the tax is backed
   out of it for the invoice.
   ========================================================================== */
window.CATALOG = (function () {
  'use strict';

  var P = '../assets/photos/';

  var PRODUCTS = [
    {
      sku: 'DHK-NANDI-01', name: 'Dhokra Nandi', cat: 'metalwork',
      price: 345000, mrp: 398000, gst: 12, hsn: '7419',
      photo: 'ecommerce-28', stock: 6, rating: 4.8, reviews: 34,
      craft: 'Dhokra lost-wax casting', origin: 'Bikna, Bankura',
      blurb: 'Cast in a single pour by the lost-wax method, so no two are identical. The ridged surface is the wax thread the caster wound by hand, left deliberately visible.',
      variants: [
        { id: 'sm', label: 'Small · 4 in', delta: 0 },
        { id: 'md', label: 'Medium · 7 in', delta: 96000 },
        { id: 'lg', label: 'Large · 11 in', delta: 245000 }
      ]
    },
    {
      sku: 'KTH-STOLE-02', name: 'Kantha stole', cat: 'textiles',
      price: 289000, mrp: 320000, gst: 5, hsn: '6214',
      photo: 'ecommerce-30', stock: 12, rating: 4.9, reviews: 61,
      craft: 'Kantha running stitch', origin: 'Shantiniketan, Birbhum',
      blurb: 'Roughly forty thousand running stitches worked over tussar. Held to the light the stitch lines shift colour, which is the whole point of doing it by hand.',
      variants: [
        { id: 'indigo', label: 'Indigo', delta: 0 },
        { id: 'madder', label: 'Madder red', delta: 0 },
        { id: 'ochre',  label: 'Ochre', delta: 0 }
      ]
    },
    {
      sku: 'TER-HORSE-03', name: 'Bankura horse', cat: 'terracotta',
      price: 165000, mrp: 189000, gst: 12, hsn: '6913',
      photo: 'ecommerce-19', stock: 18, rating: 4.7, reviews: 47,
      craft: 'Panchmura terracotta', origin: 'Panchmura, Bankura',
      blurb: 'The state emblem of West Bengal handicraft, thrown in sections and joined before firing. Fired in an open kiln, which is why the colour varies down the neck.',
      variants: [
        { id: 'sm', label: 'Small · 6 in', delta: 0 },
        { id: 'md', label: 'Medium · 12 in', delta: 84000 },
        { id: 'lg', label: 'Large · 18 in', delta: 210000 }
      ]
    },
    {
      sku: 'PAT-SCROLL-04', name: 'Patachitra scroll', cat: 'art',
      price: 520000, mrp: 585000, gst: 12, hsn: '9701',
      photo: 'ecommerce-24', stock: 3, rating: 5.0, reviews: 12,
      craft: 'Patachitra, natural pigment', origin: 'Naya, Pingla',
      blurb: 'Painted with pigment the artist grinds themselves — turmeric, indigo, burnt clay, bound with tamarind seed gum. Sold with the song that goes with it, recorded.',
      variants: [{ id: 'std', label: 'Single panel · 36 in', delta: 0 }]
    },
    {
      sku: 'BRS-DIYA-05', name: 'Brass diya, set of five', cat: 'metalwork',
      price: 142000, mrp: 168000, gst: 12, hsn: '7419',
      photo: 'ecommerce-22', stock: 24, rating: 4.6, reviews: 88,
      craft: 'Sheet brass, hand-spun', origin: 'Khagra, Murshidabad',
      blurb: 'Spun on a foot lathe rather than pressed, which leaves the faint concentric tooling you can feel with a thumbnail. Weighted so they sit still on an uneven floor.',
      variants: [
        { id: 'plain', label: 'Plain', delta: 0 },
        { id: 'etched', label: 'Hand-etched rim', delta: 38000 }
      ]
    },
    {
      sku: 'JAM-SAREE-06', name: 'Jamdani saree', cat: 'textiles',
      price: 1240000, mrp: 1390000, gst: 5, hsn: '5407',
      photo: 'ecommerce-10', stock: 4, rating: 4.9, reviews: 23,
      craft: 'Jamdani, discontinuous weft', origin: 'Dhaniakhali, Hooghly',
      blurb: 'Around eleven weeks on the loom. The motif is not printed or embroidered — it is woven in as a separate weft, one pick at a time, from memory.',
      variants: [
        { id: 'white', label: 'Off-white · red border', delta: 0 },
        { id: 'grey',  label: 'Steel grey · gold border', delta: 60000 }
      ]
    },
    {
      sku: 'WOD-OWL-07', name: 'Wooden owl pair', cat: 'woodwork',
      price: 98000, mrp: 118000, gst: 12, hsn: '4420',
      photo: 'ecommerce-14', stock: 21, rating: 4.5, reviews: 52,
      craft: 'Carved and painted gamhar wood', origin: 'Natungram, Purba Bardhaman',
      blurb: 'The Natungram owl, carved from a single block and painted in the six colours the village has used for generations. Traditionally given in pairs, never singly.',
      variants: [
        { id: 'sm', label: 'Small · 4 in', delta: 0 },
        { id: 'md', label: 'Medium · 8 in', delta: 62000 }
      ]
    },
    {
      sku: 'SHO-DECOR-08', name: 'Shola pith garland', cat: 'decor',
      price: 76000, mrp: 92000, gst: 12, hsn: '4602',
      photo: 'ecommerce-15', stock: 30, rating: 4.4, reviews: 29,
      craft: 'Shola pith', origin: 'Murshidabad',
      blurb: 'Cut from the pith of a marsh plant that grows white and weightless. Used on wedding crowns for centuries; keep it dry and it outlasts the marriage photographs.',
      variants: [{ id: 'std', label: 'Single strand · 4 ft', delta: 0 }]
    },
    {
      sku: 'CAN-BASKET-09', name: 'Cane storage basket', cat: 'woodwork',
      price: 124000, mrp: 145000, gst: 12, hsn: '4602',
      photo: 'ecommerce-00', stock: 15, rating: 4.6, reviews: 41,
      craft: 'Split cane, coiled', origin: 'Cooch Behar',
      blurb: 'Coiled rather than woven, which is slower and much stronger. Takes a loaded weight of about twelve kilos without the base bowing.',
      variants: [
        { id: 'md', label: 'Medium', delta: 0 },
        { id: 'lg', label: 'Large', delta: 46000 }
      ]
    },
    {
      sku: 'BNG-GLASS-10', name: 'Glass bangle set', cat: 'decor',
      price: 54000, mrp: 68000, gst: 12, hsn: '7018',
      photo: 'ecommerce-23', stock: 40, rating: 4.3, reviews: 96,
      craft: 'Lampworked glass', origin: 'Howrah',
      blurb: 'Drawn over a flame and joined by hand, so the seam sits slightly proud. Twelve to a set, sized properly rather than the one-size-fits-nobody standard.',
      variants: [
        { id: '2-4', label: '2.4 in', delta: 0 },
        { id: '2-6', label: '2.6 in', delta: 0 },
        { id: '2-8', label: '2.8 in', delta: 0 }
      ]
    },
    {
      sku: 'PEA-WALL-11', name: 'Peacock wall piece', cat: 'decor',
      price: 218000, mrp: 249000, gst: 12, hsn: '4420',
      photo: 'ecommerce-20', stock: 9, rating: 4.7, reviews: 18,
      craft: 'Painted wood inlay', origin: 'Nabadwip, Nadia',
      blurb: 'Inlaid rather than painted flat — each feather is a separate piece of wood set into the ground, which is why it catches light along the edges.',
      variants: [{ id: 'std', label: 'One piece · 22 in', delta: 0 }]
    },
    {
      sku: 'BRS-IDOL-12', name: 'Brass figurine', cat: 'metalwork',
      price: 386000, mrp: 440000, gst: 12, hsn: '7419',
      photo: 'ecommerce-32', stock: 7, rating: 4.8, reviews: 26,
      craft: 'Sand-cast brass, hand-finished', origin: 'Khagra, Murshidabad',
      blurb: 'Sand cast, then filed and burnished by hand for two full days. The finish is the labour; the casting itself takes an afternoon.',
      variants: [
        { id: 'sm', label: 'Small · 5 in', delta: 0 },
        { id: 'md', label: 'Medium · 9 in', delta: 128000 }
      ]
    },
    {
      sku: 'WOD-PANEL-13', name: 'Carved wall panel', cat: 'woodwork',
      price: 645000, mrp: 720000, gst: 12, hsn: '4420',
      photo: 'ecommerce-01', stock: 2, rating: 5.0, reviews: 8,
      craft: 'Relief carving, seasoned mango', origin: 'Nabadwip, Nadia',
      blurb: 'Cut from a single seasoned board, so it will not open along a joint in a Kolkata monsoon. Roughly six weeks of carving.',
      variants: [{ id: 'std', label: 'One panel · 48 x 18 in', delta: 0 }]
    },
    {
      sku: 'TER-LAMP-14', name: 'Terracotta lamp', cat: 'terracotta',
      price: 89000, mrp: 105000, gst: 12, hsn: '6913',
      photo: 'ecommerce-16', stock: 26, rating: 4.5, reviews: 37,
      craft: 'Wheel-thrown, hand-painted', origin: 'Panchmura, Bankura',
      blurb: 'Thrown on a wheel, pierced while still leather-hard, then painted after firing. The pierce pattern throws a specific shadow — that is the object, really.',
      variants: [
        { id: 'plain', label: 'Unpainted', delta: 0 },
        { id: 'paint', label: 'Hand-painted', delta: 24000 }
      ]
    }
  ];

  var CATEGORIES = [
    { id: 'all',        label: 'Everything' },
    { id: 'metalwork',  label: 'Metalwork' },
    { id: 'textiles',   label: 'Textiles' },
    { id: 'terracotta', label: 'Terracotta' },
    { id: 'woodwork',   label: 'Wood & cane' },
    { id: 'art',        label: 'Art' },
    { id: 'decor',      label: 'Decor' }
  ];

  /* Photo helpers. The store uses the same derivative sets as the rest of the
     site rather than shipping 1200px originals into a 300px grid tile. */
  function img(p, tier) { return P + (tier ? tier + '/' : '') + p + '.webp'; }

  function bySku(sku) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].sku === sku) return PRODUCTS[i];
    return null;
  }

  /* Price for a specific variant, in paise. */
  function priceOf(product, variantId) {
    var v = null;
    for (var i = 0; i < product.variants.length; i++) {
      if (product.variants[i].id === variantId) { v = product.variants[i]; break; }
    }
    return product.price + (v ? v.delta : 0);
  }

  return {
    products: PRODUCTS,
    categories: CATEGORIES,
    bySku: bySku,
    priceOf: priceOf,
    img: img
  };
})();
