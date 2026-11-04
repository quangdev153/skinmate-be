/**
 * Skin Knowledge Base: Skin Profiles, Condition Dictionaries & Conflict Matrix
 * According to Specification (UC: Skin Routine & Analysis)
 */

const SKIN_DICTIONARY = {
  Da_Dau: {
    id: 'Da_Dau',
    label: 'Da Dầu',
    aliases: ['oily', 'da_dau', 'da dầu', 'oily_skin'],
    dos: ['Niacinamide', 'BHA', 'Clay', 'Zinc PCA', 'Salicylic Acid'],
    donts: ['Mineral Oil', 'Shea Butter', 'Coconut Oil'],
  },
  Da_Kho: {
    id: 'Da_Kho',
    label: 'Da Khô',
    aliases: ['dry', 'da_kho', 'da khô', 'dry_skin'],
    dos: ['Hyaluronic Acid', 'Ceramide', 'Glycerin', 'Shea Butter', 'B5'],
    donts: ['Alcohol Denat', 'Strong Sulfate'],
  },
  Da_Hon_Hop: {
    id: 'Da_Hon_Hop',
    label: 'Da Hỗn Hợp',
    aliases: ['combination', 'da_hon_hop', 'da hỗn hợp', 'combo_skin'],
    dos: ['Niacinamide', 'Hyaluronic Acid', 'Salicylic Acid', 'B5'],
    donts: ['Mineral Oil', 'Heavy Oil'],
  },
  Da_Nhay_Cam: {
    id: 'Da_Nhay_Cam',
    label: 'Da Nhạy Cảm',
    aliases: ['sensitive', 'da_nhay_cam', 'da nhạy cảm', 'sensitive_skin'],
    dos: ['Centella', 'B5', 'Ceramide', 'Chamomile'],
    donts: ['Fragrance', 'Alcohol Denat', 'Retinol', 'AHA', 'BHA'],
  },
  Da_Thuong: {
    id: 'Da_Thuong',
    label: 'Da Thường',
    aliases: ['normal', 'da_thuong', 'da thường', 'normal_skin'],
    dos: ['Hyaluronic Acid', 'Vitamin C', 'Peptides', 'Niacinamide'],
    donts: [],
  },
};

const CONDITION_DICTIONARY = {
  Kich_Ung: {
    id: 'Kich_Ung',
    code: 'kich_ung',
    label: 'Kích ứng',
    therapy: ['B5', 'Ceramide', 'Centella'],
    forbidden: ['AHA', 'BHA', 'Retinol', 'Vitamin C'],
    reasonTemplate: 'Làn da đang Kích Ứng cần ngưng các hoạt chất treatment mạnh ({forbidden}) và bổ sung {therapy} để làm dịu và phục hồi màng bảo vệ.',
  },
  Noi_Mun: {
    id: 'Noi_Mun',
    code: 'noi_mun',
    label: 'Nổi mụn',
    therapy: ['Salicylic Acid', 'Tea Tree', 'Benzoyl Peroxide'],
    forbidden: ['Silicone', 'Mineral Oil', 'Heavy Oil'],
    reasonTemplate: 'Làn da đang Nổi Mụn cần hỗ trợ kháng khuẩn, giảm viêm với {therapy} và tránh các chất gây bít tắc như {forbidden}.',
  },
  Kho_Rat: {
    id: 'Kho_Rat',
    code: 'kho_rat',
    label: 'Khô rát',
    therapy: ['B5', 'Ceramide', 'Hyaluronic Acid', 'Glycerin'],
    forbidden: ['BHA', 'AHA', 'Retinol', 'Alcohol Denat'],
    reasonTemplate: 'Làn da đang Khô Rát cần cấp ẩm sâu và làm dịu khẩn cấp bằng {therapy}, tạm thời lùi lại các hoạt chất tẩy tế bào chết ({forbidden}).',
  },
  Bong_Dau: {
    id: 'Bong_Dau',
    code: 'bong_dau',
    label: 'Bóng dầu',
    therapy: ['Niacinamide', 'BHA', 'Zinc PCA', 'Clay'],
    forbidden: ['Mineral Oil', 'Shea Butter', 'Coconut Oil'],
    reasonTemplate: 'Làn da đang Bóng Dầu được tối ưu hóa với {therapy} giúp kiểm soát bã nhờn thông thoáng lỗ chân lông, tránh thành phần bết dính {forbidden}.',
  },
  Binh_Thuong: {
    id: 'Binh_Thuong',
    code: 'binh_thuong',
    label: 'Bình thường',
    therapy: ['Hyaluronic Acid', 'Niacinamide', 'Peptides'],
    forbidden: [],
    reasonTemplate: 'Nền da hôm nay khỏe mạnh, tiếp tục duy trì chu trình dưỡng ẩm và bảo vệ hàng ngày với {therapy}.',
  },
};

const CONFLICT_MATRIX = {
  AHA: ['Retinol', 'BHA', 'Vitamin C'],
  BHA: ['Retinol', 'AHA'],
  Retinol: ['AHA', 'BHA', 'Benzoyl Peroxide', 'Vitamin C'],
  'Benzoyl Peroxide': ['Retinol', 'Vitamin C'],
  'Vitamin C': ['AHA', 'BHA', 'Retinol', 'Benzoyl Peroxide'],
};

// Aliases map for matching ingredient strings
const INGREDIENT_CANONICAL_MAP = {
  aha: 'AHA',
  'glycolic acid': 'AHA',
  'lactic acid': 'AHA',
  'mandelic acid': 'AHA',
  bha: 'BHA',
  'salicylic acid': 'BHA',
  retinol: 'Retinol',
  retinoid: 'Retinol',
  tretinoin: 'Retinol',
  adapalene: 'Retinol',
  'vitamin c': 'Vitamin C',
  'ascorbic acid': 'Vitamin C',
  'l-ascorbic acid': 'Vitamin C',
  'benzoyl peroxide': 'Benzoyl Peroxide',
  b5: 'B5',
  panthenol: 'B5',
  'pro-vitamin b5': 'B5',
  ceramide: 'Ceramide',
  centella: 'Centella',
  'centella asiatica': 'Centella',
  'rau má': 'Centella',
  niacinamide: 'Niacinamide',
  'hyaluronic acid': 'Hyaluronic Acid',
  ha: 'Hyaluronic Acid',
  'tea tree': 'Tea Tree',
  'tràm trà': 'Tea Tree',
  clay: 'Clay',
  'đất sét': 'Clay',
  'zinc pca': 'Zinc PCA',
  'mineral oil': 'Mineral Oil',
  'dầu khoáng': 'Mineral Oil',
  'shea butter': 'Shea Butter',
  'bơ hạt mỡ': 'Shea Butter',
  'coconut oil': 'Coconut Oil',
  'dầu dừa': 'Coconut Oil',
  silicone: 'Silicone',
  'dimethicone': 'Silicone',
};

function normalizeIngredient(rawName) {
  if (!rawName || typeof rawName !== 'string') return null;
  const cleaned = rawName.toLowerCase().trim();
  for (const [key, canonical] of Object.entries(INGREDIENT_CANONICAL_MAP)) {
    if (cleaned === key || cleaned.includes(key)) {
      return canonical;
    }
  }
  return rawName.trim();
}

/**
 * Check pairwise conflicts between existing ingredients in a routine and incoming ingredients.
 */
function analyzeIngredientConflicts(existingIngredients = [], newIngredients = []) {
  const normalizedExisting = existingIngredients
    .map(normalizeIngredient)
    .filter(Boolean);
  const normalizedNew = newIngredients
    .map(normalizeIngredient)
    .filter(Boolean);

  const conflicts = [];

  for (const newIng of normalizedNew) {
    const forbiddenWithNew = CONFLICT_MATRIX[newIng] || [];
    for (const existIng of normalizedExisting) {
      if (forbiddenWithNew.includes(existIng)) {
        conflicts.push({
          incoming: newIng,
          existing: existIng,
          reason: `${newIng} xung đột và tương kỵ mạnh với ${existIng} khi dùng trong cùng một chu trình, dễ gây kích ứng, đỏ rát và mất tác dụng.`
        });
      }
    }
  }

  // Also check self-conflicts if multiple new ingredients conflict with each other
  for (let i = 0; i < normalizedNew.length; i++) {
    for (let j = i + 1; j < normalizedNew.length; j++) {
      const a = normalizedNew[i];
      const b = normalizedNew[j];
      if (CONFLICT_MATRIX[a]?.includes(b)) {
        conflicts.push({
          incoming: a,
          existing: b,
          reason: `${a} tương kỵ với ${b} ngay trong sản phẩm/nhóm sản phẩm vừa chọn.`
        });
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Check skin profile suitability (Skin_Dictionary)
 */
function analyzeSkinSuitability(skinType, ingredients = []) {
  if (!skinType) return { warnings: [] };
  const normalizedType = Object.values(SKIN_DICTIONARY).find(item =>
    item.aliases.includes(skinType.toLowerCase().trim()) || item.id === skinType
  );
  if (!normalizedType) return { warnings: [] };

  const warnings = [];
  const normalizedIngs = ingredients.map(normalizeIngredient).filter(Boolean);

  for (const ing of normalizedIngs) {
    if (normalizedType.donts.includes(ing)) {
      warnings.push({
        ingredient: ing,
        skinType: normalizedType.label,
        message: `Hoạt chất ${ing} không khuyến nghị cho làn ${normalizedType.label} vì có thể gây bít tắc hoặc kích ứng.`
      });
    }
  }

  return {
    skinTypeLabel: normalizedType.label,
    dos: normalizedType.dos,
    donts: normalizedType.donts,
    warnings,
  };
}

/**
 * Check condition suitability (Condition_Dictionary)
 */
function analyzeConditionSuitability(conditions = [], ingredients = []) {
  const warnings = [];
  const normalizedIngs = ingredients.map(normalizeIngredient).filter(Boolean);

  for (const condKey of conditions) {
    const condition = Object.values(CONDITION_DICTIONARY).find(
      c => c.code === condKey || c.id === condKey || c.label.toLowerCase() === condKey.toLowerCase()
    );
    if (!condition) continue;

    for (const ing of normalizedIngs) {
      if (condition.forbidden.includes(ing)) {
        warnings.push({
          condition: condition.label,
          ingredient: ing,
          message: `Trạng thái ${condition.label} hiện tại cấm kỵ dùng ${ing}.`
        });
      }
    }
  }

  return { warnings };
}

module.exports = {
  SKIN_DICTIONARY,
  CONDITION_DICTIONARY,
  CONFLICT_MATRIX,
  normalizeIngredient,
  analyzeIngredientConflicts,
  analyzeSkinSuitability,
  analyzeConditionSuitability,
};

