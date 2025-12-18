#!/usr/bin/env node

/**
 * Test Fuseki & AI Integration
 * Tests both Fuseki SPARQL server and AI API integration
 */

const http = require('http');

function makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: `/api/semantic${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', reject);
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function testIntegration() {
    console.log('🧪 Testing Fuseki & AI Integration\n');
    
    // Wait for server
    await new Promise(r => setTimeout(r, 1000));

    try {
        // Test 1: Check integration status
        console.log('📝 Test 1: Check Service Integration Status');
        const statusRes = await makeRequest('/integration-status');
        console.log(`   Status: ${statusRes.status}`);
        if (statusRes.data.services) {
            console.log(`   Fuseki: ${statusRes.data.services.fuseki.available ? '✅' : '⚠️'}`);
            console.log(`   AI: ${statusRes.data.services.ai.available ? '✅' : '⚠️'}`);
        }
        console.log('');

        // Test 2: Advanced Semantic Search (Fuseki)
        console.log('📝 Test 2: Advanced Semantic Search');
        const searchRes = await makeRequest('/advanced-search?healthGoal=immune&minCalories=50&maxCalories=200');
        console.log(`   Status: ${searchRes.status}`);
        console.log(`   Source: ${searchRes.data.source}`);
        if (searchRes.data.data) {
            console.log(`   Results: ${searchRes.data.data.results ? searchRes.data.data.results.length : 0} items`);
        }
        console.log('');

        // Test 3: Nutrition Analysis (AI)
        console.log('📝 Test 3: AI Nutrition Analysis');
        const analysisRes = await makeRequest('/nutrition-analysis', 'POST', {
            userProfile: {
                age: 30,
                weight: 70,
                height: 175,
                activityLevel: 'moderate',
                goals: ['weight_loss', 'muscle_gain'],
                restrictions: ['dairy']
            },
            foods: [
                { name: 'Apple', calories: 95, nutrients: ['Fiber', 'VitaminC'] },
                { name: 'Chicken', calories: 165, nutrients: ['Protein', 'B12'] }
            ]
        });
        console.log(`   Status: ${analysisRes.status}`);
        console.log(`   Source: ${analysisRes.data.source}`);
        if (analysisRes.data.analysis) {
            console.log(`   Assessment: ${analysisRes.data.analysis.assessment}`);
        }
        console.log('');

        // Test 4: AI Meal Plan Generation
        console.log('📝 Test 4: Generate Meal Plan (AI)');
        const mealPlanRes = await makeRequest('/meal-plan', 'POST', {
            userProfile: {
                age: 25,
                weight: 65,
                height: 170,
                goals: ['wellness'],
                restrictions: []
            },
            preferences: {
                dietType: 'balanced',
                calorieTarget: 2000
            }
        });
        console.log(`   Status: ${mealPlanRes.status}`);
        if (mealPlanRes.data.mealPlan && mealPlanRes.data.mealPlan.days) {
            console.log(`   Days Generated: ${mealPlanRes.data.mealPlan.days.length}`);
            console.log(`   Sample: ${mealPlanRes.data.mealPlan.days[0]?.day || 'N/A'}`);
        }
        console.log('');

        // Test 5: AI Recommendations
        console.log('📝 Test 5: AI Food Recommendations');
        const recsRes = await makeRequest('/ai-recommendations', 'POST', {
            foods: [
                { name: 'Broccoli', nutrients: ['VitaminC', 'Fiber', 'Calcium'] },
                { name: 'Salmon', nutrients: ['Omega3', 'Protein', 'VitaminD'] },
                { name: 'Spinach', nutrients: ['Iron', 'VitaminK', 'Folate'] }
            ],
            healthGoals: ['immunity', 'bone_health', 'energy']
        });
        console.log(`   Status: ${recsRes.status}`);
        if (recsRes.data.recommendations) {
            console.log(`   Prioritize: ${recsRes.data.recommendations.prioritize?.slice(0, 2).join(', ') || 'N/A'}`);
        }
        console.log('');

        // Test 6: Nutrition Score
        console.log('📝 Test 6: Calculate Nutrition Score');
        const scoreRes = await makeRequest('/nutrition-score', 'POST', {
            dailyIntake: {
                proteins: 55,
                carbs: 280,
                fats: 70,
                fiber: 28,
                vitamins: true,
                minerals: true
            }
        });
        console.log(`   Status: ${scoreRes.status}`);
        if (scoreRes.data.score) {
            console.log(`   Overall Score: ${scoreRes.data.score.overall_score}`);
            console.log(`   Summary: ${scoreRes.data.score.summary}`);
        }
        console.log('');

        // Test 7: Chat with Nutritionist
        console.log('📝 Test 7: Chat with AI Nutritionist');
        const chatRes = await makeRequest('/chat', 'POST', {
            message: 'What are good sources of plant-based protein?',
            conversationHistory: []
        });
        console.log(`   Status: ${chatRes.status}`);
        if (chatRes.data.response) {
            console.log(`   Response: ${chatRes.data.response.message?.substring(0, 100)}...`);
        }
        console.log('');

        // Test 8: Fuseki Stats
        console.log('📝 Test 8: Get Fuseki Dataset Statistics');
        const statsRes = await makeRequest('/fuseki-stats');
        console.log(`   Status: ${statsRes.status}`);
        if (statsRes.data.stats) {
            console.log(`   Stats Available: ${Object.keys(statsRes.data.stats).length > 0 ? 'Yes' : 'No'}`);
        }
        console.log('');

        console.log('✅ All integration tests completed!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testIntegration();
