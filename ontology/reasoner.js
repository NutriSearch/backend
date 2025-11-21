const { DataFactory } = require('n3');
const { namedNode, literal, defaultGraph } = DataFactory;

class OntologyReasoner {
    constructor(ontologyLoader) {
        this.loader = ontologyLoader;
        this.inferredTriples = [];
        this.rules = this.initializeReasoningRules();
    }

    initializeReasoningRules() {
        return {
            // Règle 1: Transitivité des effets santé
            healthEffectTransitivity: {
                condition: async (store) => {
                    const quads = store.getQuads();
                    const results = [];
                    
                    // Si A aEffet B et B aEffet C, alors A aEffet C
                    for (let i = 0; i < quads.length; i++) {
                        for (let j = 0; j < quads.length; j++) {
                            if (quads[i].predicate.value.includes('hasHealthEffect') &&
                                quads[j].predicate.value.includes('hasHealthEffect') &&
                                quads[i].object.value === quads[j].subject.value) {
                                results.push({
                                    subject: quads[i].subject,
                                    predicate: quads[i].predicate,
                                    object: quads[j].object
                                });
                            }
                        }
                    }
                    return results;
                }
            },

            // Règle 2: Complémentarité nutritionnelle
            nutrientComplementarity: {
                condition: async (store) => {
                    const quads = store.getQuads();
                    const complementarityMap = {
                        'Iron': 'VitaminC',
                        'Calcium': 'VitaminD',
                        'FatSolubleVitamins': 'HealthyFats'
                    };
                    
                    const results = [];
                    const foodNutrients = {};

                    // Grouper les nutriments par aliment
                    quads.forEach(quad => {
                        if (quad.predicate.value.includes('hasNutrient')) {
                            const food = quad.subject.value;
                            const nutrient = this.loader.extractLocalName(quad.object.value);
                            
                            if (!foodNutrients[food]) {
                                foodNutrients[food] = new Set();
                            }
                            foodNutrients[food].add(nutrient);
                        }
                    });

                    // Vérifier les complémentarités
                    Object.entries(foodNutrients).forEach(([food, nutrients]) => {
                        nutrients.forEach(nutrient => {
                            const complement = complementarityMap[nutrient];
                            if (complement && nutrients.has(complement)) {
                                results.push({
                                    subject: namedNode(food),
                                    predicate: namedNode('http://www.semanticweb.org/nutrisearch-ontology#hasSynergy'),
                                    object: literal(`Enhanced absorption of ${nutrient} with ${complement}`)
                                });
                            }
                        });
                    });

                    return results;
                }
            },

            // Règle 3: Inférence d'effets anti-inflammatoires
            antiInflammatoryInference: {
                condition: async (store) => {
                    const quads = store.getQuads();
                    const antiInflammatoryNutrients = [
                        'Omega3', 'Curcumin', 'Gingerol', 'Quercetin', 'Resveratrol'
                    ];
                    
                    const results = [];
                    const foodNutrients = {};

                    quads.forEach(quad => {
                        if (quad.predicate.value.includes('hasNutrient')) {
                            const food = quad.subject.value;
                            const nutrient = this.loader.extractLocalName(quad.object.value);
                            
                            if (!foodNutrients[food]) {
                                foodNutrients[food] = [];
                            }
                            foodNutrients[food].push(nutrient);
                        }
                    });

                    // Inférer les effets anti-inflammatoires
                    Object.entries(foodNutrients).forEach(([food, nutrients]) => {
                        const antiInflammatoryCount = nutrients.filter(n => 
                            antiInflammatoryNutrients.includes(n)
                        ).length;
                        
                        if (antiInflammatoryCount >= 2) {
                            results.push({
                                subject: namedNode(food),
                                predicate: namedNode('http://www.semanticweb.org/nutrisearch-ontology#hasHealthEffect'),
                                object: namedNode('http://www.semanticweb.org/nutrisearch-ontology#StrongAntiInflammatory')
                            });
                        } else if (antiInflammatoryCount === 1) {
                            results.push({
                                subject: namedNode(food),
                                predicate: namedNode('http://www.semanticweb.org/nutrisearch-ontology#hasHealthEffect'),
                                object: namedNode('http://www.semanticweb.org/nutrisearch-ontology#MildAntiInflammatory')
                            });
                        }
                    });

                    return results;
                }
            },

            // Règle 4: Classification par densité nutritionnelle
            nutritionalDensityClassification: {
                condition: async (store) => {
                    const quads = store.getQuads();
                    const results = [];
                    const foodMetrics = {};

                    // Calculer la densité nutritionnelle
                    quads.forEach(quad => {
                        const food = quad.subject.value;
                        
                        if (quad.predicate.value.includes('hasNutrient')) {
                            if (!foodMetrics[food]) {
                                foodMetrics[food] = { nutrientCount: 0, micronutrientCount: 0 };
                            }
                            foodMetrics[food].nutrientCount++;
                            
                            const nutrient = this.loader.extractLocalName(quad.object.value);
                            if (['VitaminC', 'VitaminA', 'VitaminE', 'Iron', 'Calcium', 'Magnesium'].includes(nutrient)) {
                                foodMetrics[food].micronutrientCount++;
                            }
                        }
                        
                        if (quad.predicate.value.includes('caloricDensity')) {
                            if (!foodMetrics[food]) {
                                foodMetrics[food] = { nutrientCount: 0, micronutrientCount: 0 };
                            }
                            foodMetrics[food].caloricDensity = parseInt(quad.object.value);
                        }
                    });

                    // Classifier les aliments
                    Object.entries(foodMetrics).forEach(([food, metrics]) => {
                        if (metrics.caloricDensity && metrics.nutrientCount > 0) {
                            const densityScore = metrics.micronutrientCount / metrics.caloricDensity;
                            
                            let classification;
                            if (densityScore > 0.1) {
                                classification = 'HighNutrientDensity';
                            } else if (densityScore > 0.05) {
                                classification = 'MediumNutrientDensity';
                            } else {
                                classification = 'LowNutrientDensity';
                            }
                            
                            results.push({
                                subject: namedNode(food),
                                predicate: namedNode('http://www.semanticweb.org/nutrisearch-ontology#hasNutrientDensity'),
                                object: namedNode(`http://www.semanticweb.org/nutrisearch-ontology#${classification}`)
                            });
                        }
                    });

                    return results;
                }
            }
        };
    }

    async applyReasoning() {
        console.log('Application du raisonnement sémantique...');
        this.inferredTriples = [];
        
        for (const [ruleName, rule] of Object.entries(this.rules)) {
            try {
                console.log(`Application de la règle: ${ruleName}`);
                const newTriples = await rule.condition(this.loader.store);
                
                newTriples.forEach(triple => {
                    // Vérifier si le triple n'existe pas déjà
                    const exists = this.loader.store.getQuads(
                        triple.subject,
                        triple.predicate,
                        triple.object
                    ).length > 0;
                    
                    if (!exists) {
                        this.loader.store.addQuad(triple);
                        this.inferredTriples.push({
                            triple,
                            rule: ruleName,
                            timestamp: new Date().toISOString()
                        });
                    }
                });
                
                console.log(`Règle ${ruleName}: ${newTriples.length} nouveaux triples inférés`);
            } catch (error) {
                console.error(`Erreur dans la règle ${ruleName}:`, error);
            }
        }
        
        console.log(`Raisonnement terminé. ${this.inferredTriples.length} triples inférés au total.`);
        return this.inferredTriples;
    }

    // Raisonnement pour recommandations personnalisées
    async reasonAboutUserGoals(userProfile, healthGoals) {
        await this.applyReasoning();
        
        const recommendations = [];
        const quads = this.loader.store.getQuads();
        
        // Extraire les aliments et leurs propriétés
        const foods = this.extractFoodProperties(quads);
        
        // Noter chaque aliment selon les objectifs
        Object.entries(foods).forEach(([foodName, foodProps]) => {
            const score = this.calculateGoalScore(foodProps, healthGoals, userProfile);
            
            if (score > 0) {
                recommendations.push({
                    food: foodName,
                    score: score,
                    reasoning: this.generateReasoningExplanation(foodProps, healthGoals),
                    properties: foodProps,
                    matchLevel: this.determineMatchLevel(score)
                });
            }
        });
        
        return recommendations.sort((a, b) => b.score - a.score);
    }

    extractFoodProperties(quads) {
        const foods = {};
        
        quads.forEach(quad => {
            const foodName = this.loader.extractLocalName(quad.subject.value);
            
            if (!foods[foodName]) {
                foods[foodName] = {
                    nutrients: new Set(),
                    healthEffects: new Set(),
                    properties: {}
                };
            }
            
            if (quad.predicate.value.includes('hasNutrient')) {
                const nutrient = this.loader.extractLocalName(quad.object.value);
                foods[foodName].nutrients.add(nutrient);
            }
            
            if (quad.predicate.value.includes('hasHealthEffect')) {
                const effect = this.loader.extractLocalName(quad.object.value);
                foods[foodName].healthEffects.add(effect);
            }
            
            if (quad.predicate.value.includes('hasNutrientDensity')) {
                foods[foodName].properties.nutrientDensity = 
                    this.loader.extractLocalName(quad.object.value);
            }
            
            if (quad.predicate.value.includes('inflammatoryEffect')) {
                foods[foodName].properties.inflammatoryEffect = parseInt(quad.object.value);
            }
            
            if (quad.predicate.value.includes('caloricDensity')) {
                foods[foodName].properties.caloricDensity = parseInt(quad.object.value);
            }
        });
        
        // Convertir les Sets en Arrays
        Object.keys(foods).forEach(foodName => {
            foods[foodName].nutrients = Array.from(foods[foodName].nutrients);
            foods[foodName].healthEffects = Array.from(foods[foodName].healthEffects);
        });
        
        return foods;
    }

    calculateGoalScore(foodProps, healthGoals, userProfile) {
        let score = 0;
        const weights = this.getGoalWeights(healthGoals);
        
        // Score basé sur les effets santé
        foodProps.healthEffects.forEach(effect => {
            const effectName = effect.toLowerCase();
            healthGoals.forEach(goal => {
                if (effectName.includes(goal.toLowerCase())) {
                    score += weights.healthEffects * 2;
                }
            });
        });
        
        // Score basé sur les nutriments
        foodProps.nutrients.forEach(nutrient => {
            const nutrientName = nutrient.toLowerCase();
            healthGoals.forEach(goal => {
                if (this.nutrientSupportsGoal(nutrientName, goal)) {
                    score += weights.nutrients;
                }
            });
        });
        
        // Score basé sur la densité nutritionnelle
        if (foodProps.properties.nutrientDensity) {
            const density = foodProps.properties.nutrientDensity.toLowerCase();
            if (density.includes('high')) score += weights.nutrientDensity;
            if (density.includes('medium')) score += weights.nutrientDensity * 0.5;
        }
        
        // Ajustement selon le profil utilisateur
        score = this.adjustForUserProfile(score, foodProps, userProfile);
        
        return score;
    }

    getGoalWeights(healthGoals) {
        return {
            healthEffects: 3,
            nutrients: 2,
            nutrientDensity: 1.5,
            synergy: 1
        };
    }

    nutrientSupportsGoal(nutrient, goal) {
        const supportMap = {
            'energy': ['bvitamin', 'iron', 'magnesium', 'coenzyme'],
            'cognitive': ['omega3', 'phosphatidyl', 'choline', 'antioxidant'],
            'anti-inflammatory': ['omega3', 'curcumin', 'gingerol', 'quercetin'],
            'digestive': ['fiber', 'probiotic', 'enzyme', 'prebiotic'],
            'immune': ['vitaminc', 'vitamind', 'zinc', 'selenium']
        };
        
        return supportMap[goal] && 
               supportMap[goal].some(supporter => nutrient.includes(supporter));
    }

    adjustForUserProfile(score, foodProps, userProfile) {
        // Ajustements selon les restrictions alimentaires
        if (userProfile.restrictions) {
            userProfile.restrictions.forEach(restriction => {
                if (this.foodContainsRestriction(foodProps, restriction)) {
                    score = 0; // Éliminer si restriction
                }
            });
        }
        
        // Ajustement selon les préférences
        if (userProfile.preferences) {
            userProfile.preferences.forEach(preference => {
                if (this.foodMatchesPreference(foodProps, preference)) {
                    score *= 1.2; // Bonus pour préférence
                }
            });
        }
        
        return score;
    }

    foodContainsRestriction(foodProps, restriction) {
        const restrictionMap = {
            'gluten': ['wheat', 'barley', 'rye', 'gluten'],
            'dairy': ['milk', 'cheese', 'yogurt', 'dairy', 'lactose'],
            'vegan': ['meat', 'dairy', 'egg', 'honey', 'gelatin'],
            'low-carb': ['sugar', 'carbohydrate', 'grain', 'bread']
        };
        
        const restrictions = restrictionMap[restriction];
        if (!restrictions) return false;
        
        return restrictions.some(restrict => 
            foodProps.nutrients.some(nutrient => 
                nutrient.toLowerCase().includes(restrict)
            ) || foodProps.healthEffects.some(effect =>
                effect.toLowerCase().includes(restrict)
            )
        );
    }

    foodMatchesPreference(foodProps, preference) {
        const preferenceMap = {
            'plant-based': ['plant', 'vegetable', 'fruit', 'legume'],
            'high-protein': ['protein', 'amino', 'muscle'],
            'low-calorie': ['lowcalorie', 'light', 'lean']
        };
        
        const preferences = preferenceMap[preference];
        if (!preferences) return false;
        
        return preferences.some(pref =>
            foodProps.healthEffects.some(effect =>
                effect.toLowerCase().includes(pref)
            )
        );
    }

    generateReasoningExplanation(foodProps, healthGoals) {
        const explanations = [];
        
        healthGoals.forEach(goal => {
            const matchingEffects = foodProps.healthEffects.filter(effect =>
                effect.toLowerCase().includes(goal.toLowerCase())
            );
            
            const matchingNutrients = foodProps.nutrients.filter(nutrient =>
                this.nutrientSupportsGoal(nutrient.toLowerCase(), goal)
            );
            
            if (matchingEffects.length > 0) {
                explanations.push(`Supports ${goal} through: ${matchingEffects.join(', ')}`);
            }
            
            if (matchingNutrients.length > 0) {
                explanations.push(`Contains ${matchingNutrients.join(', ')} for ${goal}`);
            }
        });
        
        if (foodProps.properties.nutrientDensity) {
            explanations.push(`Nutrient density: ${foodProps.properties.nutrientDensity}`);
        }
        
        return explanations;
    }

    determineMatchLevel(score) {
        if (score >= 8) return 'excellent';
        if (score >= 5) return 'good';
        if (score >= 3) return 'moderate';
        return 'low';
    }

    // Méthode pour obtenir les explications du raisonnement
    getReasoningExplanation() {
        return {
            totalInferredTriples: this.inferredTriples.length,
            rulesApplied: Object.keys(this.rules),
            lastReasoningTimestamp: new Date().toISOString(),
            inferredTriplesByRule: this.groupTriplesByRule()
        };
    }

    groupTriplesByRule() {
        const grouped = {};
        this.inferredTriples.forEach(item => {
            if (!grouped[item.rule]) {
                grouped[item.rule] = [];
            }
            grouped[item.rule].push({
                subject: item.triple.subject.value,
                predicate: item.triple.predicate.value,
                object: item.triple.object.value
            });
        });
        return grouped;
    }

    // Réinitialiser le raisonnement
    clearInferences() {
        this.inferredTriples.forEach(triple => {
            this.loader.store.removeQuad(triple.triple);
        });
        this.inferredTriples = [];
    }
}

module.exports = OntologyReasoner;