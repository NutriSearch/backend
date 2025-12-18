const FusekiService = require('../services/fusekiService');
const AIService = require('../services/aiService');

// Initialize services
const fusekiService = new FusekiService();
const aiService = new AIService();

/**
 * Advanced Semantic Search with Fuseki
 */
exports.advancedSemanticSearch = async (req, res) => {
    try {
        const isAvailable = await fusekiService.checkAvailability();
        
        if (!isAvailable) {
            return res.status(503).json({
                status: 'warning',
                message: 'Fuseki server not available, using local SPARQL engine',
                fallback: true
            });
        }

        const { query, category, healthGoal, minCalories, maxCalories } = req.query;
        
        const filterCriteria = {
            healthGoal: healthGoal || query,
            minCalories: minCalories ? parseInt(minCalories) : null,
            maxCalories: maxCalories ? parseInt(maxCalories) : null
        };

        const results = await fusekiService.queryFoodsWithReasoning(filterCriteria);

        res.json({
            status: 'success',
            source: 'fuseki',
            data: results.results,
            executionTime: results.executionTime
        });
    } catch (error) {
        console.error('Advanced search error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Advanced search failed',
            error: error.message
        });
    }
};

/**
 * Get nutritional profile via Fuseki
 */
exports.getNutritionalProfile = async (req, res) => {
    try {
        const isAvailable = await fusekiService.checkAvailability();
        
        if (!isAvailable) {
            return res.status(503).json({
                status: 'warning',
                message: 'Fuseki server not available'
            });
        }

        const { foodName } = req.params;
        const foodIri = `http://www.semanticweb.org/nutrisearch-ontology#${foodName}`;

        const results = await fusekiService.queryNutritionalProfile(foodIri);

        res.json({
            status: 'success',
            food: foodName,
            profile: results.results.bindings,
            executionTime: results.executionTime
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get nutritional profile',
            error: error.message
        });
    }
};

/**
 * Get AI-powered nutrition analysis
 */
exports.getNutritionAnalysis = async (req, res) => {
    try {
        const { userProfile, foods } = req.body;

        if (!userProfile) {
            return res.status(400).json({
                status: 'error',
                message: 'userProfile is required'
            });
        }

        const analysis = await aiService.analyzeNutritionProfile(userProfile, foods || []);

        res.json({
            status: 'success',
            source: 'ai',
            analysis: analysis
        });
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate nutrition analysis',
            error: error.message
        });
    }
};

/**
 * Generate personalized meal plan via AI
 */
exports.generateMealPlan = async (req, res) => {
    try {
        const { userProfile, preferences } = req.body;

        if (!userProfile) {
            return res.status(400).json({
                status: 'error',
                message: 'userProfile is required'
            });
        }

        const mealPlan = await aiService.generateMealPlan(userProfile, preferences || {});

        res.json({
            status: 'success',
            source: 'ai',
            mealPlan: mealPlan
        });
    } catch (error) {
        console.error('Meal plan error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate meal plan',
            error: error.message
        });
    }
};

/**
 * Get AI recommendations for foods
 */
exports.getAIRecommendations = async (req, res) => {
    try {
        const { foods, healthGoals } = req.body;

        if (!foods || !Array.isArray(foods)) {
            return res.status(400).json({
                status: 'error',
                message: 'foods array is required'
            });
        }

        const recommendations = await aiService.getRecommendations(foods, healthGoals || []);

        res.json({
            status: 'success',
            source: 'ai',
            recommendations: recommendations
        });
    } catch (error) {
        console.error('Recommendations error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate recommendations',
            error: error.message
        });
    }
};

/**
 * Calculate nutrition score
 */
exports.calculateNutritionScore = async (req, res) => {
    try {
        const { dailyIntake } = req.body;

        if (!dailyIntake) {
            return res.status(400).json({
                status: 'error',
                message: 'dailyIntake is required'
            });
        }

        const score = await aiService.calculateNutritionScore(dailyIntake);

        res.json({
            status: 'success',
            score: score
        });
    } catch (error) {
        console.error('Score calculation error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to calculate score',
            error: error.message
        });
    }
};

/**
 * Chat with nutrition assistant
 */
exports.chatWithNutritionist = async (req, res) => {
    try {
        const { message, conversationHistory } = req.body;

        if (!message) {
            return res.status(400).json({
                status: 'error',
                message: 'message is required'
            });
        }

        const response = await aiService.chatWithNutritionist(message, conversationHistory || []);

        res.json({
            status: 'success',
            source: 'ai',
            response: response
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to process chat message',
            error: error.message
        });
    }
};

/**
 * Get Fuseki dataset statistics
 */
exports.getFusekiStats = async (req, res) => {
    try {
        const isAvailable = await fusekiService.checkAvailability();
        
        if (!isAvailable) {
            return res.status(503).json({
                status: 'warning',
                message: 'Fuseki server not available'
            });
        }

        const stats = await fusekiService.getDatasetStats();

        res.json({
            status: 'success',
            stats: stats.results.bindings[0] || {}
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get Fuseki stats',
            error: error.message
        });
    }
};

/**
 * Health check for both services
 */
exports.checkIntegrationStatus = async (req, res) => {
    try {
        const fusekiAvailable = await fusekiService.checkAvailability();
        const aiAvailable = await aiService.checkAvailability();

        res.json({
            status: 'success',
            services: {
                fuseki: {
                    available: fusekiAvailable,
                    endpoint: fusekiService.sparqlEndpoint
                },
                ai: {
                    available: aiAvailable,
                    model: aiService.model
                }
            }
        });
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to check service status',
            error: error.message
        });
    }
};
