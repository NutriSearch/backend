/**
 * Test file for Gemini AI integration
 * Run with: node test-gemini-ai.js
 */

require('dotenv').config();
const AIService = require('./services/aiService');

async function testGeminiIntegration() {
    console.log('🧪 Testing Gemini AI Integration\n');
    
    const aiService = new AIService();
    
    // Test 1: Check availability
    console.log('📝 Test 1: Check Gemini API availability');
    const available = await aiService.checkAvailability();
    console.log(`   Status: ${available ? '✅ Available' : '❌ Not configured'}`);
    
    if (!available) {
        console.log('\n⚠️  Gemini API not configured.');
        console.log('   Please set GEMINI_API_KEY in your .env file');
        console.log('   Get your key from: https://aistudio.google.com/app/apikey\n');
        return;
    }
    
    console.log('\n');
    
    // Test 2: Nutrition Analysis
    console.log('📝 Test 2: Nutrition Analysis');
    const userProfile = {
        age: 30,
        weight: 75,
        height: 175,
        activityLevel: 'moderate',
        goals: ['weight loss', 'energy boost'],
        restrictions: ['gluten']
    };
    
    const foods = [
        { name: 'Salmon', calories: 280, nutrients: ['Omega-3', 'Protein', 'Vitamin D'] },
        { name: 'Broccoli', calories: 30, nutrients: ['Vitamin C', 'Fiber', 'Calcium'] },
        { name: 'Avocado', calories: 160, nutrients: ['Healthy fats', 'Potassium', 'Fiber'] }
    ];
    
    try {
        const analysis = await aiService.analyzeNutritionProfile(userProfile, foods);
        console.log('   ✅ Analysis received:');
        console.log(`      Assessment: ${analysis.assessment}`);
        console.log(`      Tips: ${analysis.tips.slice(0, 2).join(', ')}`);
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('\n');
    
    // Test 3: Meal Plan Generation
    console.log('📝 Test 3: Meal Plan Generation');
    try {
        const mealPlan = await aiService.generateMealPlan(userProfile, { dietType: 'balanced' });
        console.log('   ✅ Meal plan generated:');
        if (mealPlan.days && mealPlan.days[0]) {
            console.log(`      Day: ${mealPlan.days[0].day}`);
            console.log(`      Meals: ${mealPlan.days[0].meals.length} meals planned`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('\n');
    
    // Test 4: Recommendations
    console.log('📝 Test 4: AI Recommendations');
    try {
        const recommendations = await aiService.getRecommendations(foods, ['heart health', 'digestion']);
        console.log('   ✅ Recommendations received:');
        console.log(`      Prioritize: ${recommendations.prioritize.join(', ')}`);
        console.log(`      Strategy: ${recommendations.strategy}`);
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('\n');
    
    // Test 5: Chat
    console.log('📝 Test 5: Chat with Nutritionist');
    try {
        const chat = await aiService.chatWithNutritionist('What are the best foods for muscle building?', []);
        console.log('   ✅ Chat response received:');
        console.log(`      "${chat.message.substring(0, 100)}..."`);
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('\n✅ Gemini integration tests completed!\n');
}

testGeminiIntegration().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
