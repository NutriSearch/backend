const { RdfXmlParser } = require('rdf-parse');
const { Store, DataFactory } = require('n3');
const { namedNode, literal, defaultGraph } = DataFactory;
const fs = require('fs');
const path = require('path');
const OntologyReasoner= require('./reasoner');

class ProtegeOntologyLoader {
    constructor() {
        this.store = new Store();
        this.reasoner = new OntologyReasoner(this.store);
        this.ontologyPath = path.join(__dirname, '../data/nutrition-ontology.owl');
        this.baseIRI = 'http://www.semanticweb.org/nutrition-ontology#';
        this.initialized = false;
        // SUPPRIMER: this.sparqlGenerator = new SparqlJS.Generator();
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
            
        } catch (error) {
            console.error('Erreur lors du chargement de l\'ontologie:', error);
            throw error;
        }
    }

    async parseRDFXML(rdfData) {
        return new Promise((resolve, reject) => {
            try {
                const parser = new RdfXmlParser();
                const stream = parser.parse(rdfData);
                
                stream.on('data', (quad) => {
                    this.store.addQuad(quad);
                });
                
                stream.on('error', (error) => {
                    console.error('Erreur de parsing RDF:', error);
                    reject(error);
                });
                
                stream.on('end', () => {
                    console.log('Parsing RDF terminé');
                    resolve();
                });
            } catch (error) {
                console.error('Erreur lors du parsing RDF:', error);
                reject(error);
            }
        });
    }

    async createDemoOntology() {
        console.log('Création de l\'ontologie de démonstration...');
        
        // Ontologie de démonstration basée sur Protégé
        const demoTriples = [
            // Classes de base
            ['NutritionOntology:Food', 'rdf:type', 'owl:Class'],
            ['NutritionOntology:Nutrient', 'rdf:type', 'owl:Class'],
            ['NutritionOntology:HealthEffect', 'rdf:type', 'owl:Class'],
            
            // Sous-classes
            ['NutritionOntology:PlantBasedFood', 'rdfs:subClassOf', 'NutritionOntology:Food'],
            ['NutritionOntology:AnimalBasedFood', 'rdfs:subClassOf', 'NutritionOntology:Food'],
            
            // Propriétés d'objet
            ['NutritionOntology:hasNutrient', 'rdf:type', 'owl:ObjectProperty'],
            ['NutritionOntology:hasHealthEffect', 'rdf:type', 'owl:ObjectProperty'],
            
            // Propriétés de données
            ['NutritionOntology:caloricDensity', 'rdf:type', 'owl:DatatypeProperty'],
            ['NutritionOntology:inflammatoryEffect', 'rdf:type', 'owl:DatatypeProperty'],
            
            // Instances d'aliments
            ['NutritionOntology:Apple', 'rdf:type', 'NutritionOntology:PlantBasedFood'],
            ['NutritionOntology:Salmon', 'rdf:type', 'NutritionOntology:AnimalBasedFood'],
            ['NutritionOntology:Spinach', 'rdf:type', 'NutritionOntology:PlantBasedFood'],
            ['NutritionOntology:Blueberry', 'rdf:type', 'NutritionOntology:PlantBasedFood'],
            ['NutritionOntology:Broccoli', 'rdf:type', 'NutritionOntology:PlantBasedFood'],
            
            // Instances de nutriments
            ['NutritionOntology:VitaminC', 'rdf:type', 'NutritionOntology:Nutrient'],
            ['NutritionOntology:Omega3', 'rdf:type', 'NutritionOntology:Nutrient'],
            ['NutritionOntology:Fiber', 'rdf:type', 'NutritionOntology:Nutrient'],
            ['NutritionOntology:Antioxidants', 'rdf:type', 'NutritionOntology:Nutrient'],
            ['NutritionOntology:Protein', 'rdf:type', 'NutritionOntology:Nutrient'],
            ['NutritionOntology:Iron', 'rdf:type', 'NutritionOntology:Nutrient'],
            
            // Instances d'effets santé
            ['NutritionOntology:AntiInflammatory', 'rdf:type', 'NutritionOntology:HealthEffect'],
            ['NutritionOntology:EnergyBoosting', 'rdf:type', 'NutritionOntology:HealthEffect'],
            ['NutritionOntology:DigestiveHealth', 'rdf:type', 'NutritionOntology:HealthEffect'],
            ['NutritionOntology:CognitiveFunction', 'rdf:type', 'NutritionOntology:HealthEffect'],
            ['NutritionOntology:ImmuneSupport', 'rdf:type', 'NutritionOntology:HealthEffect'],
            
            // Relations - Apple
            ['NutritionOntology:Apple', 'NutritionOntology:hasNutrient', 'NutritionOntology:VitaminC'],
            ['NutritionOntology:Apple', 'NutritionOntology:hasNutrient', 'NutritionOntology:Fiber'],
            ['NutritionOntology:Apple', 'NutritionOntology:hasHealthEffect', 'NutritionOntology:EnergyBoosting'],
            ['NutritionOntology:Apple', 'NutritionOntology:hasHealthEffect', 'NutritionOntology:ImmuneSupport'],
            
            // Relations - Salmon
            ['NutritionOntology:Salmon', 'NutritionOntology:hasNutrient', 'NutritionOntology:Omega3'],
            ['NutritionOntology:Salmon', 'NutritionOntology:hasNutrient', 'NutritionOntology:Protein'],
            ['NutritionOntology:Salmon', 'NutritionOntology:hasHealthEffect', 'NutritionOntology:AntiInflammatory'],
            ['NutritionOntology:Salmon', 'NutritionOntology:hasHealthEffect', 'NutritionOntology:CognitiveFunction'],
            
            // Relations - Spinach
            ['NutritionOntology:Spinach', 'NutritionOntology:hasNutrient', 'NutritionOntology:Iron'],
            ['NutritionOntology:Spinach', 'NutritionOntology:hasNutrient', 'NutritionOntology:Antioxidants'],
            ['NutritionOntology:Spinach', 'NutritionOntology:hasHealthEffect', 'NutritionOntology:EnergyBoosting'],
            ['NutritionOntology:Spinach', 'NutritionOntology:hasHealthEffect', 'NutritionOntology:DigestiveHealth'],
            
            // Relations - Blueberry
            ['NutritionOntology:Blueberry', 'NutritionOntology:hasNutrient', 'NutritionOntology:Antioxidants'],
            ['NutritionOntology:Blueberry', 'NutritionOntology:hasHealthEffect', 'NutritionOntology:AntiInflammatory'],
            ['NutritionOntology:Blueberry', 'NutritionOntology:hasHealthEffect', 'NutritionOntology:CognitiveFunction'],
            
            // Relations - Broccoli
            ['NutritionOntology:Broccoli', 'NutritionOntology:hasNutrient', 'NutritionOntology:VitaminC'],
            ['NutritionOntology:Broccoli', 'NutritionOntology:hasHealthEffect', 'NutritionOntology:ImmuneSupport'],
            
            // Propriétés de données
            ['NutritionOntology:Apple', 'NutritionOntology:caloricDensity', '"52"^^xsd:integer'],
            ['NutritionOntology:Apple', 'NutritionOntology:inflammatoryEffect', '"-1"^^xsd:integer'],
            
            ['NutritionOntology:Salmon', 'NutritionOntology:caloricDensity', '"208"^^xsd:integer'],
            ['NutritionOntology:Salmon', 'NutritionOntology:inflammatoryEffect', '"-2"^^xsd:integer'],
            
            ['NutritionOntology:Spinach', 'NutritionOntology:caloricDensity', '"23"^^xsd:integer'],
            ['NutritionOntology:Spinach', 'NutritionOntology:inflammatoryEffect', '"-2"^^xsd:integer'],
            
            ['NutritionOntology:Blueberry', 'NutritionOntology:caloricDensity', '"57"^^xsd:integer'],
            ['NutritionOntology:Blueberry', 'NutritionOntology:inflammatoryEffect', '"-2"^^xsd:integer'],
            
            ['NutritionOntology:Broccoli', 'NutritionOntology:caloricDensity', '"34"^^xsd:integer'],
            ['NutritionOntology:Broccoli', 'NutritionOntology:inflammatoryEffect', '"-2"^^xsd:integer'],
            
            // Labels
            ['NutritionOntology:Apple', 'rdfs:label', '"Apple"'],
            ['NutritionOntology:Salmon', 'rdfs:label', '"Salmon"'],
            ['NutritionOntology:Spinach', 'rdfs:label', '"Spinach"'],
            ['NutritionOntology:Blueberry', 'rdfs:label', '"Blueberry"'],
            ['NutritionOntology:Broccoli', 'rdfs:label', '"Broccoli"'],
            ['NutritionOntology:VitaminC', 'rdfs:label', '"Vitamin C"'],
            ['NutritionOntology:Omega3', 'rdfs:label', '"Omega-3"'],
            ['NutritionOntology:AntiInflammatory', 'rdfs:label', '"Anti-Inflammatory"']
        ];

        let tripleCount = 0;
        demoTriples.forEach(triple => {
            try {
                const parsedTriple = this.parseTriple(triple);
                this.store.addQuad(parsedTriple);
                tripleCount++;
            } catch (error) {
                console.error('Erreur lors de l\'ajout du triple:', triple, error);
            }
        });

        console.log(`Ontologie de démonstration créée avec ${tripleCount} triples`);
    }

    parseTriple(triple) {
        const [subject, predicate, object] = triple;
        return {
            subject: this.expandPrefix(subject),
            predicate: this.expandPrefix(predicate),
            object: this.expandPrefix(object),
            graph: defaultGraph
        };
    }

    expandPrefix(term) {
        if (typeof term !== 'string') {
            return term;
        }

        const prefixes = {
            'NutritionOntology:': this.baseIRI,
            'rdf:': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            'rdfs:': 'http://www.w3.org/2000/01/rdf-schema#',
            'owl:': 'http://www.w3.org/2002/07/owl#',
            'xsd:': 'http://www.w3.org/2001/XMLSchema#'
        };

        // Vérifier les préfixes
        for (const [prefix, namespace] of Object.entries(prefixes)) {
            if (term.startsWith(prefix)) {
                return namedNode(namespace + term.slice(prefix.length));
            }
        }
        
        // Gérer les literals avec datatype
        if (term.startsWith('"') && term.includes('^^')) {
            const match = term.match(/^"([^"]*)"\^\^([^"]+)$/);
            if (match) {
                const [, value, datatype] = match;
                const expandedDatatype = this.expandPrefix(datatype);
                return literal(value, expandedDatatype);
            }
        }
        
        // Gérer les literals simples
        if (term.startsWith('"') && term.endsWith('"')) {
            const value = term.slice(1, -1);
            return literal(value);
        }
        
        // Par défaut, traiter comme un URI
        return namedNode(term);
    }

    async querySPARQL(query) {
        if (!this.initialized) {
            await this.loadOntology();
        }

        try {
            console.log('Exécution de la requête SPARQL...');
            const results = await this.executeSimpleSPARQL(query);
            console.log(`Requête exécutée: ${results.results.bindings.length} résultats`);
            return results;
        } catch (error) {
            console.error('Erreur SPARQL:', error.message);
            console.error('Requête:', query);
            throw error;
        }
    }

    async executeSimpleSPARQL(query) {
        const quads = this.store.getQuads();
        const bindings = [];
        
        // Parser basique pour SELECT
        const selectMatch = query.match(/SELECT\s+(.+?)\s+WHERE/i);
        if (!selectMatch) {
            // Si ce n'est pas un SELECT, essayer de traiter comme une requête simple
            return await this.handleSimpleQuery(query, quads);
        }
        
        const variables = selectMatch[1].split(' ').filter(v => v.startsWith('?')).map(v => v.trim().replace('?', ''));
        
        // Extraire WHERE
        const whereMatch = query.match(/WHERE\s*\{([^}]+)\}/i);
        const whereClause = whereMatch ? whereMatch[1] : '';
        const patterns = whereClause.split('.').filter(p => p.trim()).map(p => p.trim());
        
        console.log(`Analyse SPARQL - Variables: ${variables.join(', ')}, Patterns: ${patterns.length}`);
        
        // Pattern matching simple
        quads.forEach(quad => {
            const binding = {};
            let matchesAllPatterns = true;
            
            for (const pattern of patterns) {
                if (!this.matchPattern(quad, pattern, binding)) {
                    matchesAllPatterns = false;
                    break;
                }
            }
            
            if (matchesAllPatterns && this.applyQueryFilters(query, binding)) {
                // S'assurer que toutes les variables requises sont présentes
                const validBinding = {};
                variables.forEach(variable => {
                    if (binding[variable]) {
                        validBinding[variable] = binding[variable];
                    }
                });
                
                if (Object.keys(validBinding).length > 0) {
                    bindings.push(validBinding);
                }
            }
        });
        
        return {
            head: { vars: variables },
            results: { bindings: this.formatBindings(bindings, variables) }
        };
    }

    async handleSimpleQuery(query, quads) {
        // Gestion des requêtes simples sans SELECT complexe
        console.log('Traitement de requête simple:', query);
        
        if (query.includes('SELECT ?food WHERE')) {
            const foods = [];
            quads.forEach(quad => {
                if (quad.predicate.value.includes('type') && quad.object.value.includes('Food')) {
                    const foodName = this.extractLocalName(quad.subject.value);
                    if (!foods.includes(foodName)) {
                        foods.push(foodName);
                    }
                }
            });
            
            return {
                head: { vars: ['food'] },
                results: { 
                    bindings: foods.map(food => ({ 
                        food: { value: food, type: 'uri' } 
                    }))
                }
            };
        }
        
        // Fallback pour les autres requêtes
        return {
            head: { vars: [] },
            results: { bindings: [] }
        };
    }

    matchPattern(quad, pattern, binding) {
        const parts = pattern.trim().split(/\s+/).filter(p => p);
        if (parts.length !== 3) return false;
        
        const [subjectPattern, predicatePattern, objectPattern] = parts;
        
        // Vérifier chaque composant
        return this.matchComponent(quad.subject, subjectPattern, binding, 'subject') &&
               this.matchComponent(quad.predicate, predicatePattern, binding, 'predicate') &&
               this.matchComponent(quad.object, objectPattern, binding, 'object');
    }

    matchComponent(quadComponent, pattern, binding, componentType) {
        const quadValue = quadComponent.value;
        const quadType = quadComponent.termType;
        
        if (pattern.startsWith('?')) {
            // Variable
            const varName = pattern.slice(1);
            if (binding[varName]) {
                // Vérifier la cohérence
                return binding[varName].value === quadValue;
            } else {
                // Nouvelle variable
                binding[varName] = {
                    value: quadValue,
                    type: quadType === 'Literal' ? 'literal' : 'uri'
                };
                return true;
            }
        } else {
            // URI ou literal constant
            const expandedPattern = this.expandPrefix(pattern);
            return expandedPattern.value === quadValue;
        }
    }

    applyQueryFilters(query, binding) {
        const filters = query.match(/FILTER\s*\(([^)]+)\)/gi) || [];
        
        for (const filter of filters) {
            if (filter.includes('CONTAINS')) {
                const match = filter.match(/CONTAINS\s*\(\s*LCASE\s*\(\s*STR\s*\(\s*\?(\w+)\s*\)\s*\)\s*,\s*"([^"]+)"\s*\)/i);
                if (match) {
                    const [, varName, searchText] = match;
                    if (binding[varName] && !binding[varName].value.toLowerCase().includes(searchText.toLowerCase())) {
                        return false;
                    }
                }
            }
            
            if (filter.includes('STRENDS')) {
                const match = filter.match(/STRENDS\s*\(\s*STR\s*\(\s*\?(\w+)\s*\)\s*,\s*"([^"]+)"\s*\)/i);
                if (match) {
                    const [, varName, suffix] = match;
                    if (binding[varName] && !binding[varName].value.endsWith(suffix)) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }

    formatBindings(bindings, variables) {
        return bindings.map(binding => {
            const formatted = {};
            variables.forEach(variable => {
                if (binding[variable]) {
                    formatted[variable] = binding[variable];
                } else {
                    formatted[variable] = { value: '', type: 'undefined' };
                }
            });
            return formatted;
        });
    }

    getFoodWithNutrients() {
        const quads = this.store.getQuads();
        const foods = {};
        
        // Identifier les aliments
        quads.forEach(quad => {
            if (quad.predicate.value.includes('type') && quad.object.value.includes('Food')) {
                const foodName = this.extractLocalName(quad.subject.value);
                foods[foodName] = { 
                    nutrients: [], 
                    healthEffects: [], 
                    properties: {},
                    label: foodName
                };
            }
        });

        // Ajouter les nutriments et effets
        quads.forEach(quad => {
            const foodName = this.extractLocalName(quad.subject.value);
            if (foods[foodName]) {
                if (quad.predicate.value.includes('hasNutrient')) {
                    const nutrient = this.extractLocalName(quad.object.value);
                    if (!foods[foodName].nutrients.includes(nutrient)) {
                        foods[foodName].nutrients.push(nutrient);
                    }
                }
                if (quad.predicate.value.includes('hasHealthEffect')) {
                    const effect = this.extractLocalName(quad.object.value);
                    if (!foods[foodName].healthEffects.includes(effect)) {
                        foods[foodName].healthEffects.push(effect);
                    }
                }
                if (quad.predicate.value.includes('caloricDensity')) {
                    foods[foodName].properties.caloricDensity = parseInt(quad.object.value);
                }
                if (quad.predicate.value.includes('inflammatoryEffect')) {
                    foods[foodName].properties.inflammatoryEffect = parseInt(quad.object.value);
                }
                if (quad.predicate.value.includes('label') && quad.object.value) {
                    foods[foodName].label = quad.object.value.replace(/"/g, '');
                }
            }
        });

        return foods;
    }

    extractLocalName(iri) {
        if (!iri || typeof iri !== 'string') return 'unknown';
        return iri.split('#').pop() || iri.split('/').pop() || iri;
    }

    // Méthode utilitaire pour les recherches simples
    async simpleSearch(query) {
        await this.loadOntology();
        const foods = this.getFoodWithNutrients();
        const results = [];
        
        Object.entries(foods).forEach(([name, data]) => {
            if (name.toLowerCase().includes(query.toLowerCase()) ||
                data.label.toLowerCase().includes(query.toLowerCase()) ||
                data.nutrients.some(n => n.toLowerCase().includes(query.toLowerCase())) ||
                data.healthEffects.some(h => h.toLowerCase().includes(query.toLowerCase()))) {
                results.push({
                    name,
                    ...data
                });
            }
        });
        
        return results;
    }
}

module.exports = ProtegeOntologyLoader;