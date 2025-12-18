const axios = require('axios');

/**
 * AI Service
 * Integrates with multiple AI APIs for nutrition analysis and recommendations
 */
class AIService {
    constructor() {
        this.openaiKey = process.env.OPENAI_API_KEY;
        this.openaiApiUrl = 'https://api.openai.com/v1';
        this.model = process.env.AI_MODEL || 'gpt-3.5-turbo';
        this.useOpenAI = !!this.openaiKey;
    }

    /**
     * Check if AI service is available
     */
    async checkAvailability() {
        if (!this.useOpenAI) {
            console.warn('⚠️ OpenAI API key not configured');
            return false;
        }

        try {
            // Simple validation - won't make actual API call
            if (this.openaiKey.startsWith('sk-')) {
                console.log('✅ OpenAI API configured');
                return true;
            }
            return false;
        } catch (error) {
            console.error('AI Service error:', error.message);
            return false;
        }
    }

    /**
     * Generate nutrition analysis for a user profile
     */
    async analyzeNutritionProfile(userProfile, foods) {
        if (!this.useOpenAI) {
            return this._generateBasicAnalysis(userProfile, foods);
        }

        const prompt = `
        Analyze the following nutritional profile and provide personalized health recommendations:
        
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
        
        Format as JSON with keys: assessment, nutrients_focus, recommendations, risks, tips
        `;

        try {
            const response = await this._callOpenAI(prompt, 0.7);
            return JSON.parse(response);
        } catch (error) {
            console.error('AI analysis error:', error.message);
            return this._generateBasicAnalysis(userProfile, foods);
        }
    }

    /**
     * Generate personalized meal plan
     */
    async generateMealPlan(userProfile, preferences = {}) {
        if (!this.useOpenAI) {
            return this._generateBasicMealPlan(userProfile);
        }

        const prompt = `
        Create a 7-day personalized meal plan for:
        
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
        
        Format as JSON with structure: days[{day, meals[{type, name, calories, nutrients}]}]
        `;

        try {
            const response = await this._callOpenAI(prompt, 0.7);
            return JSON.parse(response);
        } catch (error) {
            console.error('Meal plan generation error:', error.message);
            return this._generateBasicMealPlan(userProfile);
        }
    }

    /**
     * Analyze food image and provide nutrition info (simulated)
     */
    async analyzeFoodImage(imageUrl) {
        if (!this.useOpenAI) {
            return this._generateBasicImageAnalysis();
        }

        const prompt = `
        Analyze this food image and provide:
        1. Food items identified
        2. Estimated portions
        3. Approximate calories per item
        4. Key nutrients
        5. Health rating (1-10)
        
        Format as JSON with keys: items, portions, calories, nutrients, health_rating, recommendations
        `;

        try {
            // Note: This would require OpenAI Vision API
            const response = await this._callOpenAI(prompt, 0.5);
            return JSON.parse(response);
        } catch (error) {
            console.error('Image analysis error:', error.message);
            return null;
        }
    }

    /**
     * Get AI-powered nutrition recommendations
     */
    async getRecommendations(foodList, userHealthGoals = []) {
        if (!this.useOpenAI) {
            return this._generateBasicRecommendations(foodList, userHealthGoals);
        }

        const prompt = `
        Based on these foods and health goals, provide recommendations:
        
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
        
        Format as JSON with keys: prioritize, limit, combinations, gaps, strategy
        `;

        try {
            const response = await this._callOpenAI(prompt, 0.6);
            return JSON.parse(response);
        } catch (error) {
            console.error('Recommendations error:', error.message);
            return this._generateBasicRecommendations(foodList, userHealthGoals);
        }
    }

    /**
     * Chat with nutrition AI assistant
     */
    async chatWithNutritionist(userMessage, conversationHistory = []) {
        if (!this.useOpenAI) {
            return this._generateBasicResponse(userMessage);
        }

        const systemPrompt = `You are a knowledgeable nutrition assistant with expertise in dietetics, health, and food science. 
        Provide evidence-based nutrition advice, personalized recommendations, and answer health-related questions.
        Always encourage consulting with healthcare professionals for serious concerns.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: userMessage }
        ];

        try {
            const response = await axios.post(
                `${this.openaiApiUrl}/chat/completions`,
                {
                    model: this.model,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 500
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.openaiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            const assistantMessage = response.data.choices[0].message.content;
            return {
                message: assistantMessage,
                tokens_used: response.data.usage.total_tokens
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

        const overallScore = Object.values(score).reduce((a, b) => a + b) / Object.keys(score).length;

        return {
            individual_scores: score,
            overall_score: Math.round(overallScore),
            summary: this._getScoreSummary(overallScore),
            recommendations: this._getScoreRecommendations(score, overallScore)
        };
    }

    /**
     * Internal method to call OpenAI API
     */
    async _callOpenAI(prompt, temperature = 0.7) {
        const response = await axios.post(
            `${this.openaiApiUrl}/chat/completions`,
            {
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a nutrition expert. Always respond with valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: temperature,
                max_tokens: 2000
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.openaiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        return response.data.choices[0].message.content;
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
            days: Array(7).fill(null).map((_, i) => ({
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
