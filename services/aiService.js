const axios = require('axios');

/**
 * AI Service
 * Integrates with Google Gemini API for nutrition analysis and recommendations
 */
class AIService {
    constructor() {
        this.geminiKey = process.env.GEMINI_API_KEY;
        this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.model = process.env.AI_MODEL || 'gemini-flash-latest';
        this.useGemini = !!this.geminiKey;
        
        // Rate limiting: 60 requests per minute = 1 request per second
        this.lastRequestTime = 0;
        this.minRequestInterval = 1000; // milliseconds between requests
    }

    /**
     * Rate limit helper - ensure minimum time between API calls
     */
    async _rateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
            const waitTime = this.minRequestInterval - timeSinceLastRequest;
            console.log(`⏳ Rate limiting: waiting ${waitTime}ms before next API call`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
    }

    /**
     * Check if AI service is available
     */
    async checkAvailability() {
        if (!this.useGemini) {
            console.warn('⚠️ Gemini API key not configured');
            return false;
        }

        try {
            // Simple validation - check if key exists
            if (this.geminiKey && this.geminiKey.length > 0) {
                console.log('✅ Gemini API configured');
                return true;
            }
            return false;
        } catch (error) {
            console.error('AI Service error:', error.message);
            return false;
        }
    }

    /**
     * Safe JSON parsing with cleanup
     */
    _parseGeminiJSON(text) {
        try {
            // Remove markdown code blocks
            let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            return JSON.parse(cleaned);
        } catch (error) {
            console.error('JSON parse error:', error.message);
            console.error('Raw text:', text.substring(0, 200));
            
            // Try to fix common JSON issues
            try {
                // Remove incomplete trailing content
                let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                // Find last complete closing brace/bracket
                const lastBrace = cleaned.lastIndexOf('}');
                const lastBracket = cleaned.lastIndexOf(']');
                const cutoff = Math.max(lastBrace, lastBracket);
                
                if (cutoff > 0) {
                    cleaned = cleaned.substring(0, cutoff + 1);
                    return JSON.parse(cleaned);
                }
            } catch (retryError) {
                console.error('Retry parse also failed');
            }
            
            throw error;
        }
    }

    /**
     * Generate nutrition analysis for a user profile
     */
    async analyzeNutritionProfile(userProfile, foods) {
        if (!this.useGemini) {
            return this._generateBasicAnalysis(userProfile, foods);
        }

        const prompt = `Analyze the following nutritional profile and provide personalized health recommendations in JSON format:

User Profile:
- Age: ${userProfile.age}
- Weight: ${userProfile.weight} kg
- Height: ${userProfile.height} cm
- Activity Level: ${userProfile.activityLevel}
- Health Goals: ${userProfile.goals.join(', ')}
- Dietary Restrictions: ${userProfile.restrictions.join(', ') || 'None'}

Current Foods Consumed:
${foods.map(f => `- ${f.name}: ${f.calories} kcal, ${f.nutrients.join(', ')}`).join('\n')}

Provide:
1. Overall nutritional assessment
2. Key nutrients to focus on
3. Specific food recommendations
4. Health risk areas
5. 3 actionable tips

Respond with ONLY valid JSON (no markdown, no extra text) with keys: assessment, nutrients_focus, recommendations, risks, tips`;

        try {
            const response = await this._callGemini(prompt, 0.7);
            return this._parseGeminiJSON(response);
        } catch (error) {
            console.error('AI analysis error:', error.message);
            if (error.response) {
                console.error('API Response:', error.response.data);
            }
            return this._generateBasicAnalysis(userProfile, foods);
        }
    }

    /**
     * Generate personalized meal plan
     */
    async generateMealPlan(userProfile, preferences = {}) {
        if (!this.useGemini) {
            return this._generateBasicMealPlan(userProfile);
        }

        const prompt = `Create a 7-day personalized meal plan in JSON format:

User Profile:
- Age: ${userProfile.age}
- Goal: ${userProfile.goals.join(', ')}
- Dietary Type: ${preferences.dietType || 'balanced'}
- Calorie Target: ${preferences.calorieTarget || 'standard'}
- Restrictions: ${userProfile.restrictions.join(', ') || 'None'}

Requirements:
- Include breakfast, lunch, dinner, and 2 snacks per day
- Provide estimated calories per meal
- Include key nutrients
- Make it varied and realistic

Respond with ONLY valid JSON (no markdown, no extra text) with structure: {days: [{day: string, meals: [{type: string, name: string, calories: number, nutrients: string[]}]}]}`;

        try {
            const response = await this._callGemini(prompt, 0.7);
            return this._parseGeminiJSON(response);
        } catch (error) {
            console.error('Meal plan generation error:', error.message);
            if (error.response) {
                console.error('API Response:', error.response.data);
            }
            return this._generateBasicMealPlan(userProfile);
        }
    }

    /**
     * Analyze food image and provide nutrition info (simulated)
     */
    async analyzeFoodImage(imageUrl) {
        if (!this.useGemini) {
            return this._generateBasicImageAnalysis();
        }

        const prompt = `Analyze this food image and provide nutrition info in JSON format:
1. Food items identified
2. Estimated portions
3. Approximate calories per item
4. Key nutrients
5. Health rating (1-10)

Respond with ONLY valid JSON (no markdown, no extra text) with keys: items, portions, calories, nutrients, health_rating, recommendations`;

        try {
            const response = await this._callGemini(prompt, 0.5);
            return this._parseGeminiJSON(response);
        } catch (error) {
            console.error('Image analysis error:', error.message);
            return null;
        }
    }

    /**
     * Get AI-powered nutrition recommendations
     */
    async getRecommendations(foodList, userHealthGoals = []) {
        if (!this.useGemini) {
            return this._generateBasicRecommendations(foodList, userHealthGoals);
        }

        const prompt = `Based on these foods and health goals, provide recommendations in JSON format:

Available Foods:
${foodList.map(f => `- ${f.name}: ${f.nutrients.join(', ')}`).join('\n')}

Health Goals:
${userHealthGoals.join('\n') || 'General wellness'}

Provide:
1. Top 3 foods to prioritize
2. Foods to limit
3. Complementary food combinations
4. Nutritional gaps to address
5. Weekly nutrition strategy

Respond with ONLY valid JSON (no markdown, no extra text) with keys: prioritize, limit, combinations, gaps, strategy`;

        try {
            const response = await this._callGemini(prompt, 0.6);
            return this._parseGeminiJSON(response);
        } catch (error) {
            console.error('Recommendations error:', error.message);
            return this._generateBasicRecommendations(foodList, userHealthGoals);
        }
    }

    /**
     * Chat with nutrition AI assistant
     */
    async chatWithNutritionist(userMessage, conversationHistory = []) {
        if (!this.useGemini) {
            return this._generateBasicResponse(userMessage);
        }

        const systemPrompt = `You are a knowledgeable nutrition assistant with expertise in dietetics, health, and food science. 
Provide evidence-based nutrition advice, personalized recommendations, and answer health-related questions.
Always encourage consulting with healthcare professionals for serious concerns.`;

        const messages = [
            { role: 'user', content: userMessage }
        ];

        try {
            const response = await this._callGeminiChat(userMessage, conversationHistory, systemPrompt);
            return {
                message: response,
                tokens_used: 0
            };
        } catch (error) {
            console.error('Chat error:', error.message);
            return {
                message: this._generateBasicResponse(userMessage),
                error: 'Using fallback response'
            };
        }
    }

    /**
     * Calculate nutrition score based on diet
     */
    async calculateNutritionScore(dailyIntake) {
        const score = {
            proteins: this._scoreNutrient(dailyIntake.proteins, { target: 50, min: 40, max: 60 }),
            carbs: this._scoreNutrient(dailyIntake.carbs, { target: 300, min: 200, max: 400 }),
            fats: this._scoreNutrient(dailyIntake.fats, { target: 65, min: 50, max: 80 }),
            fiber: this._scoreNutrient(dailyIntake.fiber, { target: 25, min: 20, max: 35 }),
            vitamins: dailyIntake.vitamins ? 80 : 50,
            minerals: dailyIntake.minerals ? 80 : 50
        };

        const overallScore = Object.values(score).reduce((a, b) => a + b, 0) / Object.keys(score).length;

        return {
            individual_scores: score,
            overall_score: Math.round(overallScore),
            summary: this._getScoreSummary(overallScore),
            recommendations: this._getScoreRecommendations(score, overallScore)
        };
    }

    /**
     * Internal method to call Gemini API
     */
    async _callGemini(prompt, temperature = 0.7) {
        if (!this.geminiKey) {
            throw new Error('Gemini API key is not configured');
        }

        // Apply rate limiting
        await this._rateLimit();

        const url = `${this.geminiApiUrl}/${this.model}:generateContent?key=${this.geminiKey}`;
        
        try {
            const response = await axios.post(
                url,
                {
                    contents: [
                        {
                            parts: [
                                {
                                    text: `You are a nutrition expert. Always respond with valid JSON only.\n\n${prompt}`
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: temperature,
                        maxOutputTokens: 2000
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            if (response.data.candidates && response.data.candidates[0]?.content?.parts?.[0]?.text) {
                let text = response.data.candidates[0].content.parts[0].text;
                // Clean up markdown code blocks if present
                text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                return text;
            }
            throw new Error('Invalid Gemini response format');
        } catch (error) {
            if (error.response?.status === 403) {
                console.error('❌ Gemini API Authentication Error (403):');
                console.error('   Your API key may be invalid or expired');
                console.error('   Get a new key at: https://aistudio.google.com/app/apikey');
                throw new Error('Gemini API key authentication failed - please verify your GEMINI_API_KEY');
            }
            throw error;
        }

        if (response.data.candidates && response.data.candidates[0]?.content?.parts?.[0]?.text) {
            let text = response.data.candidates[0].content.parts[0].text;
            // Clean up markdown code blocks if present
            text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            return text;
        }
        throw new Error('Invalid Gemini response format');
    }

    /**
     * Internal method to call Gemini Chat API
     */
    async _callGeminiChat(userMessage, conversationHistory = [], systemPrompt = '') {
        if (!this.geminiKey) {
            throw new Error('Gemini API key is not configured');
        }

        // Apply rate limiting
        await this._rateLimit();

        const contents = [];
        
        // Add conversation history
        conversationHistory.forEach(msg => {
            contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        });
        
        // Add current user message
        contents.push({
            role: 'user',
            parts: [{ text: userMessage }]
        });

        const url = `${this.geminiApiUrl}/${this.model}:generateContent?key=${this.geminiKey}`;

        try {
            const response = await axios.post(
                url,
                {
                    systemInstruction: {
                        parts: [{ text: systemPrompt }]
                    },
                    contents: contents,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            if (response.data.candidates && response.data.candidates[0]?.content?.parts?.[0]?.text) {
                return response.data.candidates[0].content.parts[0].text;
            }
            
            // Log the actual response for debugging
            console.error('Unexpected Gemini chat response structure:', JSON.stringify(response.data, null, 2));
            throw new Error('Invalid Gemini response format');
        } catch (error) {
            if (error.response?.status === 403) {
                console.error('❌ Gemini API Authentication Error (403):');
                console.error('   Your API key may be invalid or expired');
                console.error('   Get a new key at: https://aistudio.google.com/app/apikey');
                throw new Error('Gemini API key authentication failed - please verify your GEMINI_API_KEY');
            }
            if (error.message === 'Invalid Gemini response format') {
                throw error;
            }
            console.error('Gemini chat API error:', error.message);
            throw error;
        }
    }

    /**
     * Fallback: Generate basic analysis without AI
     */
    _generateBasicAnalysis(userProfile, foods) {
        return {
            assessment: 'Standard nutritional assessment',
            nutrients_focus: ['Protein', 'Fiber', 'Vitamins'],
            recommendations: foods.slice(0, 3).map(f => `Include ${f.name} regularly`),
            risks: 'Please configure AI for detailed risk analysis',
            tips: [
                'Increase water intake',
                'Balance macronutrients',
                'Include variety of colors in meals'
            ]
        };
    }

    /**
     * Fallback: Generate basic meal plan
     */
    _generateBasicMealPlan(userProfile) {
        return {
            days: new Array(7).fill(null).map((_, i) => ({
                day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i],
                meals: [
                    { type: 'breakfast', name: 'Oatmeal with fruits', calories: 350 },
                    { type: 'lunch', name: 'Grilled chicken with vegetables', calories: 600 },
                    { type: 'dinner', name: 'Salmon with rice', calories: 550 },
                    { type: 'snack', name: 'Greek yogurt', calories: 150 }
                ]
            }))
        };
    }

    /**
     * Fallback: Generate basic image analysis
     */
    _generateBasicImageAnalysis() {
        return {
            items: ['Unable to analyze - AI not configured'],
            portions: 'Unknown',
            calories: 'Estimate needed',
            nutrients: [],
            health_rating: null,
            recommendations: 'Configure AI service for image analysis'
        };
    }

    /**
     * Fallback: Generate basic recommendations
     */
    _generateBasicRecommendations(foodList, goals) {
        return {
            prioritize: foodList.slice(0, 3).map(f => f.name),
            limit: [],
            combinations: 'Enable AI for smart combinations',
            gaps: 'Configure AI for detailed analysis',
            strategy: 'Balanced, varied diet with all food groups'
        };
    }

    /**
     * Fallback: Generate basic response
     */
    _generateBasicResponse(message) {
        if (message.toLowerCase().includes('calor')) {
            return 'Calorie needs vary by individual. Consult a nutritionist for personalized guidance.';
        }
        if (message.toLowerCase().includes('protein')) {
            return 'Protein is essential for muscle and tissue health. Aim for 0.8-1g per kg of body weight.';
        }
        return 'That\'s a great nutrition question! For detailed analysis, please enable AI service with API key.';
    }

    /**
     * Score a nutrient against target
     */
    _scoreNutrient(actual, target) {
        if (!actual) return 50;
        const diff = Math.abs(actual - target.target);
        const maxDiff = Math.max(target.target - target.min, target.max - target.target);
        return Math.max(50, 100 - (diff / maxDiff) * 50);
    }

    /**
     * Get score summary
     */
    _getScoreSummary(score) {
        if (score >= 80) return 'Excellent nutritional balance';
        if (score >= 60) return 'Good nutritional balance with room for improvement';
        if (score >= 40) return 'Needs nutritional improvement';
        return 'Significant nutritional adjustments needed';
    }

    /**
     * Get score recommendations
     */
    _getScoreRecommendations(scores, overall) {
        const recs = [];
        if (scores.proteins < 60) recs.push('Increase protein intake');
        if (scores.fiber < 60) recs.push('Increase fiber intake');
        if (scores.vitamins < 60) recs.push('Add more vitamin-rich foods');
        if (overall < 60) recs.push('Consider consulting a nutritionist');
        return recs;
    }
}

module.exports = AIService;
