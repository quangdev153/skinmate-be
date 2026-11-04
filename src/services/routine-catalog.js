const EXTERNAL_RECOMMENDATIONS = [
  { productName: 'Serum La Roche-Posay Hyalu B5', brand: 'La Roche-Posay', productType: 'serum', productIcon: 'serum', ingredients: ['B5', 'Panthenol', 'Hyaluronic Acid'], stepKey: 'treat' },
  { productName: 'Kem Dưỡng Bioderma Cicabio Crème', brand: 'Bioderma', productType: 'cream', productIcon: 'tuyp', ingredients: ['Centella', 'Zinc PCA', 'Glycerin'], stepKey: 'moisturize' },
  { productName: 'Kem Dưỡng Illiyoon Ceramide Ato Concentrate Cream', brand: 'Illiyoon', productType: 'cream', productIcon: 'hu', ingredients: ['Ceramide', 'Glycerin', 'B5'], stepKey: 'moisturize' },
  { productName: 'Serum Klairs Midnight Blue Youth Activating Drop', brand: 'Dear Klairs', productType: 'serum', productIcon: 'serum', ingredients: ['Centella', 'Peptides', 'B5'], stepKey: 'treat' },
  { productName: 'Gel Chấm Mụn Klenzit-C / Megaduo Gel', brand: 'Megaduo', productType: 'treatment', productIcon: 'tuyp_xanh', ingredients: ['Salicylic Acid', 'Azelaic Acid'], stepKey: 'treat' },
  { productName: 'Serum The Ordinary Niacinamide 10% + Zinc 1%', brand: 'The Ordinary', productType: 'serum', productIcon: 'serum', ingredients: ['Niacinamide', 'Zinc PCA'], stepKey: 'treat' },
];

// Suggested plans are existing user drafts, not fabricated active routines.
const PREBUILT_TEMPLATES = [];
module.exports = { EXTERNAL_RECOMMENDATIONS, PREBUILT_TEMPLATES };
