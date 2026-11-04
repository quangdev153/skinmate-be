/**
 * Làm sạch và tách chuỗi thành phần từ văn bản OCR
 */
exports.parseIngredientsText = (rawText) => {
  if (!rawText) return [];

  // Tách theo dấu phẩy, chấm phẩy, hoặc xuống dòng
  const rawList = rawText
    .replace(/ingredients\s*:/i, '')
    .split(/[,;\n•]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1 && !/^\d+$/.test(item));

  // Loại bỏ trùng lặp
  return [...new Set(rawList)];
};