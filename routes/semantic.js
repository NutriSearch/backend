const express = require('express');
const router = express.Router();
const semanticController = require('../controllers/semanticController');

// Routes de l'ontologie Protégé
router.get('/search', semanticController.semanticSearch);
router.get('/food/:foodName', semanticController.getFoodDetails);
router.post('/recommendations', semanticController.getHealthRecommendations);
router.get('/stats', semanticController.getOntologyStats);

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

module.exports = router;