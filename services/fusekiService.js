const axios = require('axios');

/**
 * Fuseki SPARQL Service
 * Integrates with Apache Jena Fuseki for advanced SPARQL queries
 */
class FusekiService {
    constructor() {
        this.fusekiUrl = process.env.FUSEKI_URL || 'http://localhost:3030';
        this.datasetName = process.env.FUSEKI_DATASET || 'nutrisearch';
        this.sparqlEndpoint = `${this.fusekiUrl}/${this.datasetName}/sparql`;
        this.updateEndpoint = `${this.fusekiUrl}/${this.datasetName}/update`;
        this.timeout = 30000;
        this.retries = 3;
        this.isAvailable = false;
    }

    /**
     * Check if Fuseki server is available
     */
    async checkAvailability() {
        try {
            const response = await axios.get(`${this.fusekiUrl}/$/version`, {
                timeout: 5000
            });
            this.isAvailable = response.status === 200;
            console.log(`✅ Fuseki server available at ${this.fusekiUrl}`);
            return true;
        } catch (error) {
            console.warn(`⚠️ Fuseki server not available: ${error.message}`);
            this.isAvailable = false;
            return false;
        }
    }

    /**
     * Execute SELECT query on Fuseki
     */
    async executeSelect(sparqlQuery) {
        if (!this.isAvailable) {
            throw new Error('Fuseki server is not available');
        }

        try {
            const response = await axios.post(
                this.sparqlEndpoint,
                new URLSearchParams({
                    query: sparqlQuery
                }),
                {
                    headers: {
                        'Accept': 'application/sparql-results+json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    timeout: this.timeout
                }
            );

            return {
                status: 'success',
                results: response.data,
                executionTime: response.headers['x-execution-time'] || 'unknown'
            };
        } catch (error) {
            console.error('Fuseki SELECT error:', error.message);
            throw new Error(`Fuseki query failed: ${error.message}`);
        }
    }

    /**
     * Execute CONSTRUCT query to get RDF data
     */
    async executeConstruct(sparqlQuery) {
        if (!this.isAvailable) {
            throw new Error('Fuseki server is not available');
        }

        try {
            const response = await axios.post(
                this.sparqlEndpoint,
                new URLSearchParams({
                    query: sparqlQuery
                }),
                {
                    headers: {
                        'Accept': 'text/turtle',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    timeout: this.timeout
                }
            );

            return {
                status: 'success',
                data: response.data
            };
        } catch (error) {
            console.error('Fuseki CONSTRUCT error:', error.message);
            throw new Error(`Fuseki CONSTRUCT failed: ${error.message}`);
        }
    }

    /**
     * Execute UPDATE query (INSERT/DELETE)
     */
    async executeUpdate(sparqlQuery) {
        if (!this.isAvailable) {
            throw new Error('Fuseki server is not available');
        }

        try {
            const response = await axios.post(
                this.updateEndpoint,
                new URLSearchParams({
                    update: sparqlQuery
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    timeout: this.timeout
                }
            );

            return {
                status: 'success',
                message: 'Update executed successfully'
            };
        } catch (error) {
            console.error('Fuseki UPDATE error:', error.message);
            throw new Error(`Fuseki UPDATE failed: ${error.message}`);
        }
    }

    /**
     * Query foods with advanced SPARQL reasoning
     */
    async queryFoodsWithReasoning(filterCriteria = {}) {
        const query = `
            PREFIX nutrition: <http://www.semanticweb.org/nutrisearch-ontology#>
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            
            SELECT ?food ?label ?nutrient ?healthEffect ?caloricDensity
            WHERE {
                ?food rdf:type nutrition:Food .
                OPTIONAL { ?food rdfs:label ?label }
                OPTIONAL { ?food nutrition:hasNutrient ?nutrient }
                OPTIONAL { ?food nutrition:hasHealthEffect ?healthEffect }
                OPTIONAL { ?food nutrition:caloricDensity ?caloricDensity }
                ${this._buildFilters(filterCriteria)}
            }
            ORDER BY ?food
        `;

        return await this.executeSelect(query);
    }

    /**
     * Query nutritional composition with inference
     */
    async queryNutritionalProfile(foodIri) {
        const query = `
            PREFIX nutrition: <http://www.semanticweb.org/nutrisearch-ontology#>
            
            SELECT ?nutrient (COUNT(?effect) as ?effectCount) (AVG(?score) as ?avgScore)
            WHERE {
                <${foodIri}> nutrition:hasNutrient ?nutrient .
                OPTIONAL { 
                    ?nutrient nutrition:hasHealthEffect ?effect .
                }
                OPTIONAL {
                    ?nutrient nutrition:nutritionScore ?score .
                }
            }
            GROUP BY ?nutrient
            ORDER BY DESC(?avgScore)
        `;

        return await this.executeSelect(query);
    }

    /**
     * Query food recommendations based on health goals
     */
    async queryRecommendationsByGoal(healthGoal) {
        const query = `
            PREFIX nutrition: <http://www.semanticweb.org/nutrisearch-ontology#>
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            
            SELECT ?food ?healthEffect (COUNT(?nutrient) as ?nutrientCount)
            WHERE {
                ?food rdf:type nutrition:Food .
                ?food nutrition:hasHealthEffect ?healthEffect .
                ?food nutrition:hasNutrient ?nutrient .
                FILTER (CONTAINS(LCASE(STR(?healthEffect)), LCASE("${healthGoal}")))
            }
            GROUP BY ?food ?healthEffect
            ORDER BY DESC(?nutrientCount)
            LIMIT 10
        `;

        return await this.executeSelect(query);
    }

    /**
     * Build SPARQL FILTER clause from criteria
     */
    _buildFilters(criteria) {
        const filters = [];

        if (criteria.minCalories) {
            filters.push(`FILTER (?caloricDensity >= ${criteria.minCalories})`);
        }
        if (criteria.maxCalories) {
            filters.push(`FILTER (?caloricDensity <= ${criteria.maxCalories})`);
        }
        if (criteria.healthGoal) {
            filters.push(`FILTER (CONTAINS(LCASE(STR(?healthEffect)), LCASE("${criteria.healthGoal}")))`);
        }
        if (criteria.excludeNutrients && criteria.excludeNutrients.length > 0) {
            const excludeList = criteria.excludeNutrients.map(n => `"${n}"`).join(',');
            filters.push(`FILTER (!BOUND(?nutrient) || ?nutrient NOT IN (${excludeList}))`);
        }

        return filters.join(' ');
    }

    /**
     * Get dataset statistics
     */
    async getDatasetStats() {
        const query = `
            PREFIX nutrition: <http://www.semanticweb.org/nutrisearch-ontology#>
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            
            SELECT 
                (COUNT(DISTINCT ?food) as ?foodCount)
                (COUNT(DISTINCT ?nutrient) as ?nutrientCount)
                (COUNT(DISTINCT ?effect) as ?effectCount)
                (COUNT(?triple) as ?tripleCount)
            WHERE {
                {
                    ?food rdf:type nutrition:Food .
                }
                UNION
                {
                    ?food nutrition:hasNutrient ?nutrient .
                }
                UNION
                {
                    ?food nutrition:hasHealthEffect ?effect .
                }
                UNION
                {
                    ?s ?p ?o .
                    BIND(1 as ?triple)
                }
            }
        `;

        try {
            return await this.executeSelect(query);
        } catch (error) {
            console.error('Failed to get dataset stats:', error.message);
            return null;
        }
    }
}

module.exports = FusekiService;
