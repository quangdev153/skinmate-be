const mongoose = require('mongoose');
const Ingredient = require('../models/Ingredient');
const ingredientList = require('./ingredientData.json');

const seedIngredients = async () => {
    try {
        const count = await Ingredient.countDocuments();
        if (count === 0) {
            await Ingredient.insertMany(ingredientList);
            console.log('[SkinMate] Seeder: Seeded default Skin_Dictionary ingredients successfully.');
        }
    } catch (err) {
        console.error('[SkinMate] Seeder error seeding ingredients:', err.message);
    }
};

module.exports = seedIngredients;
