const ProtegeOntologyLoader = require('../ontology/protege-loader');
const SPARQLQueries = require('../ontology/sparql-queries');
const SemanticFood = require('../models/SemanticFood');

// Initialiser les composants
const ontologyLoader = new ProtegeOntologyLoader();
const sparqlQueries = new SPARQLQueries();

// Variable pour suivre l'état de l'ontologie
let ontologyReady = false;

const initializeOntology = async () => {
    if (!ontologyReady) {
        await ontologyLoader.loadOntology();
        ontologyReady = true;
        console.log('Ontologie Protégé initialisée avec succès');
    }
};

exports.semanticSearch = async (req, res) => {
    try {
        await initializeOntology();
        
        const { q: query, category, healthGoal, nutrient } = req.query;
        
        let sparqlQuery;
        let results;

        if (healthGoal) {
            // Recherche par objectif de santé
            sparqlQuery = `
                PREFIX nutrition: <http://www.semanticweb.org/nutrition-ontology#>
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                
                SELECT DISTINCT ?food ?healthEffect
                WHERE {
                    ?food rdf:type nutrition:Food .
                    ?food nutrition:hasHealthEffect ?healthEffect .
                    FILTER (CONTAINS(LCASE(STR(?healthEffect)), "${healthGoal.toLowerCase()}"))
                }
                ORDER BY ?food
            `;
        } else if (nutrient) {
            // Recherche par nutriment
            sparqlQuery = `
                PREFIX nutrition: <http://www.semanticweb.org/nutrition-ontology#>
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                
                SELECT DISTINCT ?food ?nutrient
                WHERE {
                    ?food rdf:type nutrition:Food .
                    ?food nutrition:hasNutrient ?nutrient .
                    FILTER (CONTAINS(LCASE(STR(?nutrient)), "${nutrient.toLowerCase()}"))
                }
                ORDER BY ?food
            `;
        } else if (query) {
            // Recherche textuelle générale
            sparqlQuery = `
                PREFIX nutrition: <http://www.semanticweb.org/nutrition-ontology#>
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                
                SELECT DISTINCT ?food ?label ?type
                WHERE {
                    ?food rdf:type nutrition:Food .
                    OPTIONAL { ?food rdfs:label ?label }
                    OPTIONAL { ?food rdf:type ?type }
                    FILTER (
                        CONTAINS(LCASE(STR(?food)), "${query.toLowerCase()}") ||
                        (BOUND(?label) && CONTAINS(LCASE(?label), "${query.toLowerCase()}"))
                    )
                }
                ORDER BY ?food
            `;
        } else {
            // Tous les aliments
            sparqlQuery = sparqlQueries.getQuery('getAllFoods');
        }
        
        results = await ontologyLoader.querySPARQL(sparqlQuery);
        
        // Formater les résultats
        const formattedResults = results.results.bindings.map(item => {
            const formattedItem = { iri: item.food.value };
            
            // Extraire le nom local
            formattedItem.name = ontologyLoader.extractLocalName(item.food.value);
            
            // Ajouter les propriétés disponibles
            if (item.healthEffect) {
                formattedItem.healthEffect = ontologyLoader.extractLocalName(item.healthEffect.value);
            }
            if (item.nutrient) {
                formattedItem.nutrient = ontologyLoader.extractLocalName(item.nutrient.value);
            }
            if (item.label) {
                formattedItem.label = item.label.value;
            }
            if (item.type) {
                formattedItem.type = ontologyLoader.extractLocalName(item.type.value);
            }
            
            return formattedItem;
        });
        
        res.json({
            status: 'success',
            data: {
                query: query || healthGoal || nutrient || 'all foods',
                results: formattedResults,
                count: formattedResults.length,
                sparqlQuery: sparqlQuery
            }
        });
    } catch (error) {
        console.error('Erreur dans semanticSearch:', error);
        res.status(500).json({
            status: 'error',
            message: error.message,
            details: 'Erreur lors de la recherche sémantique'
        });
    }
};

exports.getFoodDetails = async (req, res) => {
    try {
        await initializeOntology();
        
        const { foodName } = req.params;
        
        // Requête SPARQL pour obtenir tous les détails d'un aliment
        const sparqlQuery = `
            PREFIX nutrition: <http://www.semanticweb.org/nutrition-ontology#>
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            
            SELECT ?property ?value ?valueType
            WHERE {
                {
                    nutrition:${foodName} ?property ?value .
                    BIND("object" as ?valueType)
                }
                UNION
                {
                    nutrition:${foodName} ?property ?value .
                    FILTER (isLiteral(?value))
                    BIND("data" as ?valueType)
                }
            }
            ORDER BY ?property
        `;
        
        const results = await ontologyLoader.querySPARQL(sparqlQuery);
        
        if (results.results.bindings.length === 0) {
            // Essayer une autre approche si la première échoue
            const alternativeResults = await ontologyLoader.querySPARQL(`
                PREFIX nutrition: <http://www.semanticweb.org/nutrition-ontology#>
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                
                SELECT ?p ?o
                WHERE {
                    ?s ?p ?o .
                    FILTER (STRENDS(STR(?s), "#${foodName}"))
                }
            `);
            
            if (alternativeResults.results.bindings.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: `Aliment '${foodName}' non trouvé dans l'ontologie`
                });
            }
            
            results.results.bindings = alternativeResults.results.bindings;
        }
        
        // Structurer les résultats
        const details = {
            name: foodName,
            nutrients: [],
            healthEffects: [],
            properties: {},
            classes: []
        };
        
        results.results.bindings.forEach(item => {
            const property = ontologyLoader.extractLocalName(item.property.value);
            const value = item.value.value;
            const valueType = item.valueType ? item.valueType.value : 'unknown';
            
            switch(property) {
                case 'hasNutrient':
                    details.nutrients.push(ontologyLoader.extractLocalName(value));
                    break;
                case 'hasHealthEffect':
                    details.healthEffects.push(ontologyLoader.extractLocalName(value));
                    break;
                case 'type':
                case 'rdfType':
                    if (value.includes('Food')) {
                        details.classes.push(ontologyLoader.extractLocalName(value));
                    }
                    break;
                case 'caloricDensity':
                case 'inflammatoryEffect':
                case 'glycemicIndex':
                    details.properties[property] = parseInt(value) || value;
                    break;
                default:
                    if (valueType === 'data') {
                        details.properties[property] = value;
                    }
            }
        });
        
        // Appliquer le raisonnement pour obtenir des inférences supplémentaires
        const inferences = ontologyLoader.reasoner ? 
            await ontologyLoader.reasoner.applyReasoning() : [];
        
        res.json({
            status: 'success',
            data: {
                food: details,
                rawTriples: results.results.bindings,
                inferences: inferences.slice(0, 10) // Limiter les inférences affichées
            }
        });
    } catch (error) {
        console.error('Erreur dans getFoodDetails:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.getHealthRecommendations = async (req, res) => {
    try {
        await initializeOntology();
        
        const { goals, restrictions = [], userProfile = {} } = req.body;
        
        if (!goals || !Array.isArray(goals) || goals.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Le paramètre "goals" est requis et doit être un tableau non vide'
            });
        }
        
        // Utiliser le reasoner pour des recommandations avancées
        let recommendations;
        if (ontologyLoader.reasoner) {
            recommendations = await ontologyLoader.reasoner.reasonAboutUserGoals(
                userProfile, 
                goals
            );
        } else {
            // Fallback vers SPARQL simple
            const sparqlQuery = sparqlQueries.createPersonalizedRecommendationQuery(goals, restrictions);
            const results = await ontologyLoader.querySPARQL(sparqlQuery);
            recommendations = this.formatSPARQLRecommendations(results, goals);
        }
        
        res.json({
            status: 'success',
            data: {
                goals,
                restrictions,
                userProfile,
                recommendations: recommendations.slice(0, 20), // Limiter le nombre
                totalCount: recommendations.length,
                reasoning: ontologyLoader.reasoner ? 
                    ontologyLoader.reasoner.getReasoningExplanation() : 
                    'Reasoner non disponible - utilisation SPARQL simple'
            }
        });
    } catch (error) {
        console.error('Erreur dans getHealthRecommendations:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.getOntologyStats = async (req, res) => {
    try {
        await initializeOntology();
        
        // Utiliser la nouvelle méthode getOntologyStats du loader
        const stats = ontologyLoader.getOntologyStats();
        
        res.json({
            status: 'success',
            data: stats
        });
    } catch (error) {
        console.error('Erreur dans getOntologyStats:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.exploreOntology = async (req, res) => {
    try {
        await initializeOntology();
        
        const { type } = req.query; // 'classes', 'properties', 'individuals'
        
        const quads = ontologyLoader.store.getQuads();
        const exploration = {
            classes: new Set(),
            objectProperties: new Set(),
            dataProperties: new Set(),
            individuals: new Set()
        };
        
        quads.forEach(quad => {
            const subject = quad.subject.value;
            const predicate = quad.predicate.value;
            const object = quad.object.value;
            
            // Classes
            if (object === 'http://www.w3.org/2002/07/owl#Class') {
                exploration.classes.add(ontologyLoader.extractLocalName(subject));
            }
            
            // Propriétés objet
            if (object === 'http://www.w3.org/2002/07/owl#ObjectProperty') {
                exploration.objectProperties.add(ontologyLoader.extractLocalName(subject));
            }
            
            // Propriétés données
            if (object === 'http://www.w3.org/2002/07/owl#DatatypeProperty') {
                exploration.dataProperties.add(ontologyLoader.extractLocalName(subject));
            }
            
            // Individus (aliments, nutriments, etc.)
            if (subject.includes(ontologyLoader.baseIRI) && 
                !predicate.includes('type') && 
                !object.includes('Class') && 
                !object.includes('Property')) {
                exploration.individuals.add(ontologyLoader.extractLocalName(subject));
            }
        });
        
        // Convertir les Sets en Arrays
        const result = {};
        Object.keys(exploration).forEach(key => {
            result[key] = Array.from(exploration[key]);
        });
        
        res.json({
            status: 'success',
            data: result
        });
    } catch (error) {
        console.error('Erreur dans exploreOntology:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Méthode utilitaire pour formater les recommandations SPARQL
exports.formatSPARQLRecommendations = (sparqlResults, goals) => {
    const recommendations = {};
    
    sparqlResults.results.bindings.forEach(item => {
        if (item.food) {
            const foodName = ontologyLoader.extractLocalName(item.food.value);
            
            if (!recommendations[foodName]) {
                recommendations[foodName] = {
                    healthEffects: [],
                    score: 0
                };
            }
            
            if (item.healthEffect) {
                const effect = ontologyLoader.extractLocalName(item.healthEffect.value);
                recommendations[foodName].healthEffects.push(effect);
                
                // Calculer un score simple basé sur la correspondance avec les objectifs
                goals.forEach(goal => {
                    if (effect.toLowerCase().includes(goal.toLowerCase())) {
                        recommendations[foodName].score += 2;
                    }
                });
            }
            
            if (item.inflammatoryEffect) {
                const effect = parseInt(item.inflammatoryEffect.value);
                if (effect < 0) {
                    recommendations[foodName].score += 1; // Bonus anti-inflammatoire
                }
            }
        }
    });
    
    // Convertir en tableau et trier par score
    return Object.entries(recommendations)
        .map(([food, data]) => ({
            food,
            score: data.score,
            healthEffects: data.healthEffects,
            matchLevel: data.score >= 3 ? 'high' : data.score >= 1 ? 'medium' : 'low'
        }))
        .sort((a, b) => b.score - a.score);
};

exports.createSemanticFood = async (req, res) => {
    try {
        const semanticFood = await SemanticFood.create(req.body);
        
        res.status(201).json({
            status: 'success',
            data: {
                food: semanticFood
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.getSemanticFoods = async (req, res) => {
    try {
        const { nutrient, healthEffect, season, sustainability, goal } = req.query;
        let query = {};
        
        // Filtres basés sur les relations sémantiques
        if (nutrient) {
            query['semanticRelations'] = {
                $elemMatch: {
                    relationType: 'hasNutrient',
                    target: nutrient
                }
            };
        }
        
        if (healthEffect) {
            query['semanticRelations'] = {
                $elemMatch: {
                    relationType: 'hasHealthEffect', 
                    target: healthEffect
                }
            };
        }
        
        if (season) {
            query['ecologicalContext.seasonality.season'] = season;
        }
        
        if (sustainability) {
            query['ecologicalContext.sustainabilityScore'] = { $gte: parseInt(sustainability) };
        }
        
        let foods;
        if (goal) {
            // Utiliser la méthode de recherche par objectif de bien-être
            foods = await SemanticFood.findByWellbeingGoal(goal);
        } else {
            foods = await SemanticFood.find(query);
        }
        
        res.json({
            status: 'success',
            results: foods.length,
            data: {
                foods
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.getSemanticFood = async (req, res) => {
    try {
        const food = await SemanticFood.findById(req.params.id);
        
        if (!food) {
            return res.status(404).json({
                status: 'error',
                message: 'Aliment sémantique non trouvé'
            });
        }
        
        res.json({
            status: 'success',
            data: {
                food
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.getFoodRecommendations = async (req, res) => {
    try {
        const { goals, restrictions = [], preferences = [] } = req.body;
        
        let query = { status: 'active' };
        
        // Appliquer les restrictions
        if (restrictions.length > 0) {
            query['semanticRelations'] = {
                $not: {
                    $elemMatch: {
                        target: { $in: restrictions }
                    }
                }
            };
        }
        
        const allFoods = await SemanticFood.find(query);
        
        // Calculer les scores pour chaque aliment
        const recommendations = allFoods.map(food => {
            const score = food.calculateWellbeingScore(goals);
            
            // Bonus pour les préférences
            let preferenceBonus = 0;
            preferences.forEach(preference => {
                if (food.semanticTags.includes(preference)) {
                    preferenceBonus += 5;
                }
            });
            
            return {
                food: food.name,
                score: score + preferenceBonus,
                ontologicalClass: food.ontologicalClass,
                nutrients: food.nutrients,
                healthEffects: food.healthEffects,
                sustainabilityScore: food.ecologicalContext.sustainabilityScore,
                reasoning: food.semanticTags.filter(tag => 
                    goals.some(goal => tag.includes(goal.toLowerCase()))
                )
            };
        }).filter(rec => rec.score > 0)
          .sort((a, b) => b.score - a.score);
        
        res.json({
            status: 'success',
            data: {
                goals,
                recommendations: recommendations.slice(0, 10), // Top 10
                totalConsidered: allFoods.length
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.getSustainableFoods = async (req, res) => {
    try {
        const { minScore = 7 } = req.query;
        
        const sustainableFoods = await SemanticFood.findSustainableFoods(parseInt(minScore));
        
        res.json({
            status: 'success',
            data: {
                sustainableFoods,
                averageScore: sustainableFoods.reduce((acc, food) => 
                    acc + food.ecologicalContext.sustainabilityScore, 0) / sustainableFoods.length
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

module.exports = exports;