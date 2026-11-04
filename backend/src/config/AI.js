require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

if (!process.env.GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY in .env file');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

module.exports = ai;
