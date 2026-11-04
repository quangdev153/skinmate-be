const Collection = require('../models/Collection');
const defaultIngredients = require('../seeder/ingredientData.json');

/**
 * Tính điểm % phù hợp của sản phẩm với hồ sơ da hiện tại
 */
const calculateProductScore = (product, skinProfile) => {
    let score = 75; // Điểm cơ sở
    const skinType = (skinProfile?.skinType || 'normal').toLowerCase();
    const allergies = (skinProfile?.allergies || []).map(a => a.toLowerCase().trim());
    const concerns = (skinProfile?.currentConcerns || []).map(c => c.toLowerCase().trim());

    const productIngredients = (product.ingredients || []).map(i => i.toLowerCase().trim());
    const productType = (product.productType || '').toLowerCase();

    // 1. Kiểm tra dị ứng cá nhân
    for (const allergy of allergies) {
        if (!allergy) continue;
        const matched = productIngredients.some(ing => ing.includes(allergy) || allergy.includes(ing));
        if (matched) {
            return 25; // Có thành phần gây dị ứng => điểm rớt thê thảm
        }
    }

    // 2. Tra cứu từ điển Hoạt chất
    defaultIngredients.forEach(item => {
        const itemAliases = [item.name.toLowerCase(), ...(item.aliases || []).map(a => a.toLowerCase())];
        const isPresent = productIngredients.some(ing => itemAliases.some(alias => ing.includes(alias) || alias.includes(ing)));

        if (isPresent) {
            // Có trong danh sách khuyên dùng (Do's)
            if (item.dos && item.dos.includes(skinType)) {
                score += 10;
            }
            // Có trong danh sách cấm kỵ (Don'ts)
            if (item.donts && item.donts.includes(skinType)) {
                score -= 25;
            }
            // Giải quyết vấn đề da hiện tại (concerns)
            if (item.targetConcerns && item.targetConcerns.some(c => concerns.includes(c))) {
                score += 8;
            }
        }
    });

    // 3. Đánh giá kết cấu sản phẩm dựa trên loại da
    if (skinType === 'oily' || skinType === 'combination') {
        if (['cream', 'oil'].includes(productType)) {
            score -= 20; // Da dầu dùng kem đặc hoặc dầu dễ bí tắc
        } else if (['serum', 'toner', 'cleanser'].includes(productType)) {
            score += 10;
        }
    } else if (skinType === 'dry') {
        if (['cream', 'oil', 'moisturizer'].includes(productType)) {
            score += 18; // Da khô hợp kem dưỡng ẩm dày
        } else if (['exfoliant'].includes(productType)) {
            score -= 10;
        }
    } else if (skinType === 'sensitive') {
        if (['treatment', 'exfoliant'].includes(productType)) {
            score -= 15;
        }
    }

    // Giới hạn điểm từ 15 đến 98
    return Math.max(15, Math.min(98, score));
};

/**
 * Đánh giá lại toàn bộ tủ đồ của user khi đổi loại da
 */
const reEvaluateCloset = async (userId, newSkinProfile) => {
    const products = await Collection.find({ userId });
    let updatedCount = 0;
    const reEvaluatedList = [];

    for (const prod of products) {
        const oldScore = prod.analysisResult?.contextualScore || 70;
        const newScore = calculateProductScore(prod, newSkinProfile);

        prod.analysisResult = {
            ...prod.analysisResult,
            contextualScore: newScore,
        };
        await prod.save();
        updatedCount++;

        reEvaluatedList.push({
            productId: prod._id,
            productName: prod.productName,
            oldScore,
            newScore,
        });
    }

    return {
        updatedCount,
        reEvaluatedList,
    };
};

module.exports = {
    calculateProductScore,
    reEvaluateCloset,
};
