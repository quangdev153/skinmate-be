const test = require('node:test');
const assert = require('node:assert/strict');
const {
  SKIN_DICTIONARY,
  CONDITION_DICTIONARY,
  CONFLICT_MATRIX,
  analyzeIngredientConflicts,
  analyzeSkinSuitability,
  analyzeConditionSuitability,
  normalizeIngredient,
} = require('./skinDictionaries');

// ==========================================
// 5.1 TEST SKIN DICTIONARY
// ==========================================
test('5.1.1 Skin Dictionary: Da dầu - Cấm Mineral Oil & Shea Butter', () => {
  const result = analyzeSkinSuitability('Da_Dau', ['Mineral Oil', 'Shea Butter', 'Niacinamide']);
  assert.equal(result.warnings.length, 2);
  assert.equal(result.warnings.some(w => w.ingredient === 'Mineral Oil'), true);
  assert.equal(result.warnings.some(w => w.ingredient === 'Shea Butter'), true);
});

test('5.1.2 Skin Dictionary: Da khô - Cấm Alcohol Denat', () => {
  const result = analyzeSkinSuitability('Da_Kho', ['Alcohol Denat', 'Hyaluronic Acid']);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].ingredient, 'Alcohol Denat');
});

test('5.1.3 Skin Dictionary: Da hỗn hợp - Cấm Mineral Oil', () => {
  const result = analyzeSkinSuitability('Da_Hon_Hop', ['Mineral Oil', 'B5']);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].ingredient, 'Mineral Oil');
});

test('5.1.4 Skin Dictionary: Da nhạy cảm - Cấm Fragrance, Retinol, AHA, BHA', () => {
  const result = analyzeSkinSuitability('Da_Nhay_Cam', ['Fragrance', 'Retinol', 'Centella']);
  assert.equal(result.warnings.length, 2);
  assert.equal(result.warnings.some(w => w.ingredient === 'Fragrance'), true);
  assert.equal(result.warnings.some(w => w.ingredient === 'Retinol'), true);
});

test('5.1.5 Skin Dictionary: Da thường - Không có thành phần cấm kỵ', () => {
  const result = analyzeSkinSuitability('Da_Thuong', ['Hyaluronic Acid', 'Vitamin C', 'Peptides']);
  assert.equal(result.warnings.length, 0);
});

// ==========================================
// 5.2 TEST CONDITION DICTIONARY
// ==========================================
test('5.2.1 Condition Dictionary: Kích ứng - Cấm AHA, BHA, Retinol, Vitamin C', () => {
  const result = analyzeConditionSuitability(['kich_ung'], ['AHA', 'BHA', 'Retinol', 'Vitamin C', 'B5']);
  assert.equal(result.warnings.length, 4);
  const forbidden = CONDITION_DICTIONARY.Kich_Ung.forbidden;
  assert.deepEqual(forbidden, ['AHA', 'BHA', 'Retinol', 'Vitamin C']);
  assert.deepEqual(CONDITION_DICTIONARY.Kich_Ung.therapy, ['B5', 'Ceramide', 'Centella']);
});

test('5.2.2 Condition Dictionary: Nổi mụn - Cấm Silicone, Mineral Oil', () => {
  const result = analyzeConditionSuitability(['noi_mun'], ['Silicone', 'Mineral Oil', 'Salicylic Acid']);
  assert.equal(result.warnings.length, 2);
  assert.deepEqual(CONDITION_DICTIONARY.Noi_Mun.forbidden, ['Silicone', 'Mineral Oil', 'Heavy Oil']);
  assert.deepEqual(CONDITION_DICTIONARY.Noi_Mun.therapy, ['Salicylic Acid', 'Tea Tree', 'Benzoyl Peroxide']);
});

test('5.2.3 Condition Dictionary: Khô rát - Cấm BHA, AHA, Retinol', () => {
  const result = analyzeConditionSuitability(['kho_rat'], ['Salicylic Acid', 'Glycolic Acid', 'Ceramide']);
  assert.equal(result.warnings.length, 2); // Salicylic Acid -> BHA, Glycolic Acid -> AHA
  assert.deepEqual(CONDITION_DICTIONARY.Kho_Rat.therapy, ['B5', 'Ceramide', 'Hyaluronic Acid', 'Glycerin']);
});

test('5.2.4 Condition Dictionary: Bóng dầu - Cấm Mineral Oil, Shea Butter', () => {
  const result = analyzeConditionSuitability(['bong_dau'], ['Mineral Oil', 'Shea Butter', 'Clay']);
  assert.equal(result.warnings.length, 2);
  assert.deepEqual(CONDITION_DICTIONARY.Bong_Dau.therapy, ['Niacinamide', 'BHA', 'Zinc PCA', 'Clay']);
});

test('5.2.5 Condition Dictionary: Bình thường - Không có thành phần cấm kỵ', () => {
  const result = analyzeConditionSuitability(['binh_thuong'], ['Hyaluronic Acid', 'Niacinamide', 'Peptides']);
  assert.equal(result.warnings.length, 0);
  assert.deepEqual(CONDITION_DICTIONARY.Binh_Thuong.therapy, ['Hyaluronic Acid', 'Niacinamide', 'Peptides']);
});

// ==========================================
// 5.3 TEST CONFLICT MATRIX
// ==========================================
test('5.3.1 Conflict Matrix: AHA + Retinol -> Conflict', () => {
  const result = analyzeIngredientConflicts(['AHA'], ['Retinol']);
  assert.equal(result.hasConflict, true);
  assert.equal(result.conflicts.length > 0, true);
});

test('5.3.2 Conflict Matrix: AHA + BHA -> Conflict', () => {
  const result = analyzeIngredientConflicts(['AHA'], ['BHA']);
  assert.equal(result.hasConflict, true);
});

test('5.3.3 Conflict Matrix: AHA + Vitamin C -> Conflict', () => {
  const result = analyzeIngredientConflicts(['AHA'], ['Vitamin C']);
  assert.equal(result.hasConflict, true);
});

test('5.3.4 Conflict Matrix: BHA + Retinol -> Conflict', () => {
  const result = analyzeIngredientConflicts(['BHA'], ['Retinol']);
  assert.equal(result.hasConflict, true);
});

test('5.3.5 Conflict Matrix: BHA + AHA -> Conflict', () => {
  const result = analyzeIngredientConflicts(['BHA'], ['Glycolic Acid']); // Glycolic Acid normalizes to AHA
  assert.equal(result.hasConflict, true);
});

test('5.3.6 Conflict Matrix: Retinol + Benzoyl Peroxide -> Conflict', () => {
  const result = analyzeIngredientConflicts(['Retinol'], ['Benzoyl Peroxide']);
  assert.equal(result.hasConflict, true);
});

test('5.3.7 Conflict Matrix: Vitamin C + Retinol -> Conflict', () => {
  const result = analyzeIngredientConflicts(['Vitamin C'], ['Retinol']);
  assert.equal(result.hasConflict, true);
});

test('5.3.8 Conflict Matrix: Niacinamide + B5 -> Không Conflict', () => {
  const result = analyzeIngredientConflicts(['Niacinamide'], ['B5']);
  assert.equal(result.hasConflict, false);
  assert.equal(result.conflicts.length, 0);
});
