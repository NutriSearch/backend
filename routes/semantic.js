const express = require('express');
const router = express.Router();
const semanticController = require('../controllers/semanticController');

// Routes de l'ontologie Protégé
router.get('/search', semanticController.semanticSearch);
router.get('/food/:foodName', semanticController.getFoodDetails);
router.post('/recommendations', semanticController.getHealthRecommendations);
router.get('/stats', semanticController.getOntologyStats);

// NEW: Ontology data as JSON (compatible with frontend ontologyData.js)
const ontologyDataController = require('../controllers/ontologyDataController');
router.get('/ontology-data', ontologyDataController.getOntologyData);
router.get('/ontology-graph', ontologyDataController.getOntologyGraph);

// Exploration de l'ontologie
router.get('/classes', async (req, res) => {
    try {
        const ontologyLoader = require('../ontology/protege-loader');
        const loader = new ontologyLoader();
        await loader.loadOntology();
        
        // Extraire les classes de l'ontologie
        const quads = loader.store.getQuads();
        const classes = new Set();
        
        quads.forEach(quad => {
            if (quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
                quad.object.value === 'http://www.w3.org/2002/07/owl#Class') {
                classes.add(loader.extractLocalName(quad.subject.value));
            }
        });
        
        res.json({
            status: 'success',
            data: Array.from(classes)
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

router.post('/semantic-foods', semanticController.createSemanticFood);
router.get('/semantic-foods', semanticController.getSemanticFoods);
router.get('/semantic-foods/sustainable', semanticController.getSustainableFoods);
router.get('/semantic-foods/:id', semanticController.getSemanticFood);
router.post('/recommendations/semantic', semanticController.getFoodRecommendations);

// ===== FUSEKI & AI INTEGRATION ROUTES =====
const fusekiAiController = require('../controllers/fusekiAiController');

// Fuseki SPARQL endpoints
router.get('/advanced-search', fusekiAiController.advancedSemanticSearch);
router.get('/nutritional-profile/:foodName', fusekiAiController.getNutritionalProfile);
router.get('/fuseki-stats', fusekiAiController.getFusekiStats);

// AI-powered endpoints
router.post('/nutrition-analysis', fusekiAiController.getNutritionAnalysis);
router.post('/meal-plan', fusekiAiController.generateMealPlan);
router.post('/ai-recommendations', fusekiAiController.getAIRecommendations);
router.post('/nutrition-score', fusekiAiController.calculateNutritionScore);
router.post('/chat', fusekiAiController.chatWithNutritionist);

// Service status
router.get('/integration-status', fusekiAiController.checkIntegrationStatus);

module.exports = router;