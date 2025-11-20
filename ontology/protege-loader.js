const { RdfXmlParser } = require('rdf-parse');
const { Store } = require('n3');
const { SparqlEndpointFetcher } = require('fetch-sparql-endpoint');
const fs = require('fs');
const path = require('path');
const OntologyReasoner = require('./reasoner');

class ProtegeOntologyLoader {
    constructor() {
        this.store = new Store();
        this.reasoner = new OntologyReasoner(this);
        this.ontologyPath = path.join(__dirname, '../data/nutrition-ontology.rdf');
        this.baseIRI = 'http://www.semanticweb.org/nutrition-ontology#';
        this.initialized = false;
    }

    async loadOntology() {
        try {
            console.log('Chargement de l\'ontologie Protégé...');
            
            // Méthode 1: Chargement depuis fichier OWL/RDF
            if (fs.existsSync(this.ontologyPath)) {
                const ontologyData = fs.readFileSync(this.ontologyPath, 'utf8');
                await this.parseRDFXML(ontologyData);
            } else {
                // Méthode 2: Création d'une ontologie de démonstration
                await this.createDemoOntology();
            }
            
            this.initialized = true;
            console.log('Ontologie chargée avec succès');
            console.log(`Triples chargés: ${this.store.size}`);
            await this.reasoner.applyReasoning();
            
        } catch (error) {
            console.error('Erreur lors du chargement de l\'ontologie:', error);
            throw error;
        }
    }

    async parseRDFXML(rdfData) {
        return new Promise((resolve, reject) => {
            const parser = new RdfXmlParser();
            const stream = parser.parse(rdfData);
            
            stream.on('data', (quad) => {
                this.store.addQuad(quad);
            });
            
            stream.on('error', reject);
            stream.on('end', resolve);
        });
    }

    async createDemoOntology() {
        // Ontologie de démonstration basée sur Protégé
        const demoTriples = [
            // Classes de base
            ['NutritionOntology:Food', 'rdf:type', 'owl:Class'],
            ['NutritionOntology:Nutrient', 'rdf:type', 'owl:Class'],
            ['NutritionOntology:HealthEffect', 'rdf:type', 'owl:Class'],
            ['NutritionOntology:Person', 'rdf:type', 'owl:Class'],
            
            // Sous-classes
            ['NutritionOntology:PlantBasedFood', 'rdfs:subClassOf', 'NutritionOntology:Food'],
            ['NutritionOntology:AnimalBasedFood', 'rdfs:subClassOf', 'NutritionOntology:Food'],
            ['NutritionOntology:Macronutrient', 'rdfs:subClassOf', 'NutritionOntology:Nutrient'],
            ['NutritionOntology:Micronutrient', 'rdfs:subClassOf', 'NutritionOntology:Nutrient'],
            
            // Propriétés d'objet
            ['NutritionOntology:hasNutrient', 'rdf:type', 'owl:ObjectProperty'],
            ['NutritionOntology:hasHealthEffect', 'rdf:type', 'owl:ObjectProperty'],
            ['NutritionOntology:consumes', 'rdf:type', 'owl:ObjectProperty'],
            ['NutritionOntology:recommendedFor', 'rdf:type', 'owl:ObjectProperty'],
            
            // Propriétés de données
            ['NutritionOntology:caloricDensity', 'rdf:type', 'owl:DatatypeProperty'],
            ['NutritionOntology:glycemicIndex', 'rdf:type', 'owl:DatatypeProperty'],
            ['NutritionOntology:inflammatoryEffect', 'rdf:type', 'owl:DatatypeProperty'],
            
            // Instances d'aliments
            ['NutritionOntology:Apple', 'rdf:type', 'NutritionOntology:PlantBasedFood'],
            ['NutritionOntology:Salmon', 'rdf:type', 'NutritionOntology:AnimalBasedFood'],
            ['NutritionOntology:Spinach', 'rdf:type', 'NutritionOntology:PlantBasedFood'],
            ['NutritionOntology:Quinoa', 'rdf:type', 'NutritionOntology:PlantBasedFood'],
            
            // Instances de nutriments
            ['NutritionOntology:VitaminC', 'rdf:type', 'NutritionOntology:Micronutrient'],
            ['NutritionOntology:Omega3', 'rdf:type', 'NutritionOntology:Macronutrient'],
            ['NutritionOntology:Fiber', 'rdf:type', 'NutritionOntology:Macronutrient'],
            ['NutritionOntology:Antioxidants', 'rdf:type', 'NutritionOntology:Micronutrient'],
            
            // Instances d'effets santé
            ['NutritionOntology:AntiInflammatory', 'rdf:type', 'NutritionOntology:HealthEffect'],
            ['NutritionOntology:EnergyBoosting', 'rdf:type', 'NutritionOntology:HealthEffect'],
            ['NutritionOntology:DigestiveHealth', 'rdf:type', 'NutritionOntology:HealthEffect'],
            ['NutritionOntology:CognitiveFunction', 'rdf:type', 'NutritionOntology:HealthEffect'],
            
            // Relations entre instances
            ['NutritionOntology:Apple', 'NutritionOntology:hasNutrient', 'NutritionOntology:VitaminC'],
            ['NutritionOntology:Apple', 'NutritionOntology:hasNutrient', 'NutritionOntology:Fiber'],
            ['NutritionOntology:Apple', 'NutritionOntology:hasHealthEffect', 'NutritionOntology:EnergyBoosting'],
            ['NutritionOntology:Salmon', 'NutritionOntology:hasNutrient', 'NutritionOntology:Omega3'],
            ['NutritionOntology:Salmon', 'NutritionOntology:hasHealthEffect', 'NutritionOntology:AntiInflammatory'],
            ['NutritionOntology:Salmon', 'NutritionOntology:hasHealthEffect', 'NutritionOntology:CognitiveFunction'],
            ['NutritionOntology:Spinach', 'NutritionOntology:hasNutrient', 'NutritionOntology:Antioxidants'],
            ['NutritionOntology:Spinach', 'NutritionOntology:hasHealthEffect', 'NutritionOntology:DigestiveHealth'],
            
            // Propriétés de données
            ['NutritionOntology:Apple', 'NutritionOntology:caloricDensity', '"52"^^xsd:integer'],
            ['NutritionOntology:Apple', 'NutritionOntology:glycemicIndex', '"36"^^xsd:integer'],
            ['NutritionOntology:Apple', 'NutritionOntology:inflammatoryEffect', '"1"^^xsd:integer'],
            ['NutritionOntology:Salmon', 'NutritionOntology:caloricDensity', '"208"^^xsd:integer'],
            ['NutritionOntology:Salmon', 'NutritionOntology:inflammatoryEffect', '"-2"^^xsd:integer'],
        ];

        demoTriples.forEach(triple => {
            this.store.addQuad(this.parseTriple(triple));
        });
    }

    parseTriple(triple) {
        const [subject, predicate, object] = triple;
        return {
            subject: this.expandPrefix(subject),
            predicate: this.expandPrefix(predicate),
            object: this.expandPrefix(object)
        };
    }

    expandPrefix(term) {
        const prefixes = {
            'NutritionOntology:': this.baseIRI,
            'rdf:': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            'rdfs:': 'http://www.w3.org/2000/01/rdf-schema#',
            'owl:': 'http://www.w3.org/2002/07/owl#',
            'xsd:': 'http://www.w3.org/2001/XMLSchema#'
        };

        for (const [prefix, namespace] of Object.entries(prefixes)) {
            if (term.startsWith(prefix)) {
                return namespace + term.slice(prefix.length);
            }
        }
        return term;
    }

    async querySPARQL(query) {
        if (!this.initialized) {
            await this.loadOntology();
        }

        const { SparqlGenerator } = require('sparqljs');
        const generator = new SparqlGenerator();
        
        try {
            // Utilisation d'un moteur SPARQL local
            const results = await this.executeLocalSPARQL(query);
            return results;
        } catch (error) {
            console.error('Erreur SPARQL:', error);
            throw error;
        }
    }

    async executeLocalSPARQL(query) {
        // Implémentation simplifiée pour requêtes basiques
        const matches = [];
        const quads = this.store.getQuads();
        
        // Parsing simplifié du SPARQL (pour démo)
        if (query.includes('SELECT ?food WHERE')) {
            quads.forEach(quad => {
                if (quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
                    quad.object.value.includes('Food')) {
                    matches.push({ food: { value: quad.subject.value } });
                }
            });
        }
        
        return {
            head: { vars: ['food'] },
            results: { bindings: matches }
        };
    }

    getFoodWithNutrients() {
        const quads = this.store.getQuads();
        const foods = {};
        
        quads.forEach(quad => {
            if (quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
                quad.object.value.includes('Food')) {
                const foodName = this.extractLocalName(quad.subject.value);
                foods[foodName] = { nutrients: [], healthEffects: [] };
            }
        });

        quads.forEach(quad => {
            const foodName = this.extractLocalName(quad.subject.value);
            if (foods[foodName]) {
                if (quad.predicate.value.includes('hasNutrient')) {
                    const nutrient = this.extractLocalName(quad.object.value);
                    foods[foodName].nutrients.push(nutrient);
                }
                if (quad.predicate.value.includes('hasHealthEffect')) {
                    const effect = this.extractLocalName(quad.object.value);
                    foods[foodName].healthEffects.push(effect);
                }
            }
        });

        return foods;
    }

    extractLocalName(iri) {
        return iri.split('#').pop() || iri.split('/').pop();
    }

     async getReasonedRecommendations(userProfile, healthGoals) {
        return await this.reasoner.reasonAboutUserGoals(userProfile, healthGoals);
    }
}

module.exports = ProtegeOntologyLoader;