/**
 * Debug script for Gemini API
 * Run with: node debug-gemini.js
 */

require('dotenv').config();
const axios = require('axios');

async function debugGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.AI_MODEL || 'gemini-flash-latest';
    
    console.log('🔍 Debugging Gemini Configuration\n');
    console.log(`API Key: ${apiKey ? '✅ Set (length: ' + apiKey.length + ')' : '❌ Not set'}`);
    console.log(`Model: ${model}\n`);
    
    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in .env file');
        return;
    }
    
    console.log('📤 Testing simple API call...\n');
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    try {
        const response = await axios.post(
            url,
            {
                contents: [{
                    parts: [{
                        text: 'Say "Hello from Gemini" in JSON format with a key "message"'
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 100
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );
        
        console.log('✅ API Response received!\n');
        console.log('Response structure:', JSON.stringify(response.data, null, 2));
        
        if (response.data.candidates && response.data.candidates[0]?.content?.parts?.[0]?.text) {
            console.log('\n📝 Text content:');
            console.log(response.data.candidates[0].content.parts[0].text);
        }
        
    } catch (error) {
        console.error('❌ API Error:\n');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error message:', error.message);
        }
    }
}

debugGemini();
