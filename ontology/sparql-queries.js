class SPARQLQueries {
    constructor() {
        this.queries = {
            // Trouver tous les aliments
            getAllFoods: `
                PREFIX nutrition: <http://www.semanticweb.org/nutrisearch-ontology#>
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                
                SELECT ?food ?type
                WHERE {
                    ?food rdf:type nutrition:Food .
                    OPTIONAL { ?food rdf:type ?type }
                }
            `,

            // Trouver les aliments avec un nutriment spécifique
            getFoodsByNutrient: `
                PREFIX nutrition: <http://www.semanticweb.org/nutrisearch-ontology#>
                
                SELECT ?food ?nutrient
                WHERE {
                    ?food nutrition:hasNutrient ?nutrient .
                    ?nutrient rdf:type nutrition:Nutrient .
                }
            `,

            // Trouver les aliments recommandés pour un effet santé
            getFoodsForHealthEffect: `
                PREFIX nutrition: <http://www.semanticweb.org/nutrisearch-ontology#>
                
                SELECT ?food ?healthEffect
                WHERE {
                    ?food nutrition:hasHealthEffect ?healthEffect .
                    ?healthEffect rdf:type nutrition:HealthEffect .
                }
            `,

            // Obtenir les propriétés complètes d'un aliment
            getFoodDetails: `
                PREFIX nutrition: <http://www.semanticweb.org/nutrisearch-ontology#>
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                
                SELECT ?food ?nutrient ?healthEffect ?caloricDensity ?inflammatoryEffect
                WHERE {
                    ?food rdf:type nutrition:Food .
                    OPTIONAL { ?food nutrition:hasNutrient ?nutrient }
                    OPTIONAL { ?food nutrition:hasHealthEffect ?healthEffect }
                    OPTIONAL { ?food nutrition:caloricDensity ?caloricDensity }
                    OPTIONAL { ?food nutrition:inflammatoryEffect ?inflammatoryEffect }
                }
            `,

            // Trouver des aliments anti-inflammatoires
            getAntiInflammatoryFoods: `
                PREFIX nutrition: <http://www.semanticweb.org/nutrisearch-ontology#>
                
                SELECT ?food ?inflammatoryEffect
                WHERE {
                    ?food nutrition:inflammatoryEffect ?inflammatoryEffect .
                    FILTER (?inflammatoryEffect < 0)
                }
                ORDER BY ?inflammatoryEffect
            `,

            // Aliments riches en antioxydants
            getAntioxidantRichFoods: `
                PREFIX nutrition: <http://www.semanticweb.org/nutrisearch-ontology#>
                
                SELECT ?food ?nutrient
                WHERE {
                    ?food nutrition:hasNutrient ?nutrient .
                    FILTER (CONTAINS(LCASE(STR(?nutrient)), "antioxidant") || 
                            CONTAINS(LCASE(STR(?nutrient)), "vitaminC") ||
                            CONTAINS(LCASE(STR(?nutrient)), "vitaminE"))
                }
            `
        };
    }

    getQuery(name, parameters = {}) {
        let query = this.queries[name];
        
        // Remplacement des paramètres
        Object.entries(parameters).forEach(([key, value]) => {
            query = query.replace(new RegExp(`\\?${key}`, 'g'), value);
        });
        
        return query;
    }

    // Requête dynamique pour les recommandations personnalisées
    createPersonalizedRecommendationQuery(goals, restrictions) {
        return `
            PREFIX nutrition: <http://www.semanticweb.org/nutrisearch-ontology#>
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            
            SELECT ?food ?healthEffect ?inflammatoryEffect
            WHERE {
                ?food rdf:type nutrition:Food .
                ?food nutrition:hasHealthEffect ?healthEffect .
                ?food nutrition:inflammatoryEffect ?inflammatoryEffect .
                
                ${goals.map(goal => 
                    `FILTER (CONTAINS(LCASE(STR(?healthEffect)), "${goal.toLowerCase()}"))`
                ).join('\n                ')}
                
                ${restrictions.length > 0 ? 
                    `FILTER NOT EXISTS {
                        ?food nutrition:hasNutrient ?restrictedNutrient .
                        ${restrictions.map(restriction => 
                            `FILTER (CONTAINS(LCASE(STR(?restrictedNutrient)), "${restriction.toLowerCase()}"))`
                        ).join('\n                        ')}
                    }` : ''
                }
            }
            ORDER BY ?inflammatoryEffect
        `;
    }
}

module.exports = SPARQLQueries;