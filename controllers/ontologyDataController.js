// controllers/ontologyDataController.js
const ProtegeOntologyLoader = require('../ontology/protege-loader');

const ontologyLoader = new ProtegeOntologyLoader();
let ontologyReady = false;

const initializeOntology = async () => {
    if (!ontologyReady) {
        await ontologyLoader.loadOntology();
        ontologyReady = true;
    }
};

/**
 * Transform OWL/RDF data into frontend ontologyData.js format
 * Returns: { nodes: [...], relations: [...] }
 */
exports.getOntologyData = async (req, res) => {
    try {
        await initializeOntology();
        
        const quads = ontologyLoader.store.getQuads();
        const nodes = [];
        const relations = [];
        const nodeMap = new Map(); // Track unique nodes
        let nodeIdCounter = 1;

        // Helper to get or create node ID
        const getNodeId = (iri, type) => {
            const localName = ontologyLoader.extractLocalName(iri);
            const key = `${type}_${localName}`;
            if (!nodeMap.has(key)) {
                const nodeId = `${type.toLowerCase().replace(/\s+/g, '_')}_${nodeIdCounter++}`;
                nodeMap.set(key, { id: nodeId, iri, localName, type });
            }
            return nodeMap.get(key).id;
        };

        // Step 1: Extract all entities (foods, nutrients, health effects)
        const entities = {
            foods: new Map(),
            nutrients: new Map(),
            healthEffects: new Map(),
            users: new Map(),
            profiles: new Map(),
            diets: new Map(),
            conditions: new Map(),
            recommendations: new Map()
        };

        quads.forEach(quad => {
            const subject = quad.subject.value;
            const predicate = quad.predicate.value;
            const object = quad.object.value;
            const subjectName = ontologyLoader.extractLocalName(subject);

            // Identify Foods
            if (predicate.includes('type') && object.includes('Food') && !subject.includes('Class')) {
                if (!entities.foods.has(subject)) {
                    entities.foods.set(subject, {
                        iri: subject,
                        name: subjectName,
                        label: subjectName,
                        nutrients: [],
                        healthEffects: [],
                        properties: {}
                    });
                }
            }

            // Identify Nutrients
            if (predicate.includes('type') && object.includes('Nutrient')) {
                if (!entities.nutrients.has(subject)) {
                    entities.nutrients.set(subject, {
                        iri: subject,
                        name: subjectName,
                        label: subjectName,
                        properties: {}
                    });
                }
            }

            // Identify Health Effects
            if (predicate.includes('type') && object.includes('HealthEffect')) {
                if (!entities.healthEffects.has(subject)) {
                    entities.healthEffects.set(subject, {
                        iri: subject,
                        name: subjectName,
                        label: subjectName,
                        properties: {}
                    });
                }
            }

            // Extract labels
            if (predicate.includes('label')) {
                const label = object.replace(/"/g, '');
                if (entities.foods.has(subject)) {
                    entities.foods.get(subject).label = label;
                } else if (entities.nutrients.has(subject)) {
                    entities.nutrients.get(subject).label = label;
                } else if (entities.healthEffects.has(subject)) {
                    entities.healthEffects.get(subject).label = label;
                }
            }

            // Extract properties (caloricDensity, inflammatoryEffect, etc.)
            if (predicate.includes('caloricDensity') || predicate.includes('inflammatoryEffect') || 
                predicate.includes('glycemicIndex')) {
                const propName = ontologyLoader.extractLocalName(predicate);
                const value = parseInt(object) || object;
                if (entities.foods.has(subject)) {
                    entities.foods.get(subject).properties[propName] = value;
                }
            }
        });

        // Step 2: Extract relations
        quads.forEach(quad => {
            const subject = quad.subject.value;
            const predicate = quad.predicate.value;
            const object = quad.object.value;

            // hasNutrient relation
            if (predicate.includes('hasNutrient') && entities.foods.has(subject)) {
                entities.foods.get(subject).nutrients.push(object);
            }

            // hasHealthEffect relation
            if (predicate.includes('hasHealthEffect') && entities.foods.has(subject)) {
                entities.foods.get(subject).healthEffects.push(object);
            }
        });

        // Step 3: Create nodes array for frontend
        // Add a default user
        nodes.push({
            id: 'user_1',
            label: 'Jean Dupont',
            type: 'Utilisateur',
            attributes: {
                nom: 'Jean Dupont',
                age: 45,
                email: 'jean.dupont@email.com'
            }
        });

        // Add foods
        entities.foods.forEach((food, iri) => {
            const foodId = getNodeId(iri, 'Aliment');
            nodes.push({
                id: foodId,
                label: food.label,
                type: 'Aliment',
                subType: 'Food',
                attributes: {
                    nom: food.label,
                    calories: food.properties.caloricDensity || 0,
                    proteines: food.properties.protein || 0,
                    glucides: food.properties.carbohydrates || 0,
                    lipides: food.properties.fat || 0,
                    fibres: food.properties.fiber || 0,
                    scoreDurabilite: food.properties.sustainabilityScore || 7.0,
                    estBio: food.properties.organic || false,
                    saisonRecolte: food.properties.season || 'toute l\'année',
                    origine: food.properties.origin || 'France'
                }
            });

            // Add relations for this food
            food.nutrients.forEach(nutrientIri => {
                const nutrientId = getNodeId(nutrientIri, 'Nutriment');
                relations.push({
                    source: foodId,
                    target: nutrientId,
                    label: 'contient',
                    type: 'contient',
                    attributes: {
                        quantite: 100,
                        unite: 'mg pour 100g'
                    }
                });
            });

            food.healthEffects.forEach(effectIri => {
                const effectId = getNodeId(effectIri, 'Effet Santé');
                relations.push({
                    source: foodId,
                    target: effectId,
                    label: 'a pour effet',
                    type: 'hasHealthEffect'
                });
            });

            // User consumes food
            relations.push({
                source: 'user_1',
                target: foodId,
                label: 'mange',
                type: 'mange',
                attributes: {
                    frequence: 'quotidienne',
                    portion: '100g'
                }
            });
        });

        // Add nutrients
        entities.nutrients.forEach((nutrient, iri) => {
            const nutrientId = getNodeId(iri, 'Nutriment');
            nodes.push({
                id: nutrientId,
                label: nutrient.label,
                type: 'Nutriment',
                subType: 'Vitamin',
                attributes: {
                    nom: nutrient.label,
                    unite: 'mg',
                    apportJournalierRecommande: 80,
                    role: 'Soutien nutritionnel',
                    typeNutriment: 'vitamine'
                }
            });
        });

        // Add health effects
        entities.healthEffects.forEach((effect, iri) => {
            const effectId = getNodeId(iri, 'Effet Santé');
            nodes.push({
                id: effectId,
                label: effect.label,
                type: 'Effet Santé',
                attributes: {
                    nom: effect.label,
                    description: effect.label,
                    priorite: 'haute'
                }
            });
        });

        // Add sample health profile
        nodes.push({
            id: 'health_profile_1',
            label: 'Profil Santé de Jean',
            type: 'Profil Santé',
            attributes: {
                poids: 78.5,
                taille: 175,
                imc: 25.6,
                niveauActivite: 'modéré',
                objectifSante: 'perte de poids'
            }
        });

        relations.push({
            source: 'user_1',
            target: 'health_profile_1',
            label: 'a pour profil',
            type: 'aPourProfil'
        });

        // Add sample diet
        nodes.push({
            id: 'diet_1',
            label: 'Régime Méditerranéen',
            type: 'Régime Alimentaire',
            attributes: {
                nom: 'Régime Méditerranéen',
                description: 'Régime basé sur les habitudes alimentaires des pays méditerranéens',
                type: 'équilibré',
                caloriesJournalieres: 2000
            }
        });

        relations.push({
            source: 'user_1',
            target: 'diet_1',
            label: 'suit le régime',
            type: 'suitLeRegime'
        });

        const response = {
            nodes,
            relations,
            metadata: {
                totalNodes: nodes.length,
                totalRelations: relations.length,
                nodeTypes: [...new Set(nodes.map(n => n.type))],
                relationTypes: [...new Set(relations.map(r => r.type))],
                generatedAt: new Date().toISOString(),
                source: 'OWL Ontology Parser'
            }
        };

        res.json({
            status: 'success',
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Error generating ontology data:', error);
        res.status(500).json({
            status: 'error',
            success: false,
            message: error.message || 'Failed to generate ontology data'
        });
    }
};

/**
 * Get ontology data in simplified format for visualization
 */
exports.getOntologyGraph = async (req, res) => {
    try {
        await initializeOntology();
        
        const foodsWithDetails = ontologyLoader.getFoodWithNutrients();
        const stats = ontologyLoader.getOntologyStats();

        res.json({
            status: 'success',
            success: true,
            data: {
                foods: Object.entries(foodsWithDetails).map(([name, details]) => ({
                    name,
                    label: details.label,
                    nutrients: details.nutrients,
                    healthEffects: details.healthEffects,
                    properties: details.properties
                })),
                stats
            }
        });

    } catch (error) {
        console.error('Error generating ontology graph:', error);
        res.status(500).json({
            status: 'error',
            success: false,
            message: error.message || 'Failed to generate ontology graph'
        });
    }
};

module.exports = exports;
