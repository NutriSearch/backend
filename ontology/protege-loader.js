const { Store, DataFactory } = require('n3');
const { namedNode, literal, defaultGraph } = DataFactory;
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

class ProtegeOntologyLoader {
    constructor() {
        this.store = new Store();
        this.ontologyPath = path.join(__dirname, '../data/nutrisearch-ontology.owl');
        this.baseIRI = 'http://www.semanticweb.org/nutrisearch-ontology#';
        this.initialized = false;
    }

    async loadOntology() {
        try {
            console.log('🧠 Chargement de l\'ontologie Protégé...');
            
            // VIDER le store d'abord
            this.store = new Store();
            
            // Méthode UNIQUE: Chargement depuis fichier OWL/RDF
            if (fs.existsSync(this.ontologyPath)) {
                console.log('📁 Fichier OWL trouvé, chargement...');
                await this.parseOWLFile();
            } else {
                console.log('❌ Fichier OWL non trouvé:', this.ontologyPath);
                throw new Error(`Fichier d'ontologie non trouvé: ${this.ontologyPath}`);
            }
            
            this.initialized = true;
            console.log('✅ Ontologie chargée avec succès');
            console.log(`📊 Triples chargés: ${this.store.size}`);
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement de l\'ontologie:', error);
            throw error;
        }
    }

    async parseOWLFile() {
        try {
            const ontologyData = fs.readFileSync(this.ontologyPath, 'utf8');
            console.log('🔍 Parsing du fichier OWL...');
            // Essayer d'abord un parser RDF robuste (rdf-parse)
            try {
                const parsedCount = await this.parseWithRdfParse(ontologyData);
                console.log(`🔁 rdf-parse a extrait ${parsedCount} triples`);
                return;
            } catch (err) {
                console.warn('⚠️ rdf-parse failed, fallback au parser simple:', err.message);
            }

            // Si rdf-parse a échoué, utiliser le parser simple existant
            await this.simpleOWLParser(ontologyData);
            
        } catch (error) {
            console.error('❌ Erreur lors du parsing OWL:', error);
            throw new Error(`Erreur de parsing du fichier OWL: ${error.message}`);
        }
    }

    async parseWithRdfParse(xmlData) {
        console.log('🔧 Parsing RDF/XML via rdf-parse...');
        let rdfParseModule;
        try {
            rdfParseModule = require('rdf-parse');
        } catch (err) {
            throw new Error('Le module rdf-parse est introuvable');
        }

        let parseFunc = null;
        if (typeof rdfParseModule === 'function') parseFunc = rdfParseModule;
        else if (rdfParseModule.parse && typeof rdfParseModule.parse === 'function') parseFunc = rdfParseModule.parse;
        else if (rdfParseModule.default) {
            if (typeof rdfParseModule.default === 'function') parseFunc = rdfParseModule.default;
            else if (rdfParseModule.default.parse && typeof rdfParseModule.default.parse === 'function') parseFunc = rdfParseModule.default.parse;
        }

        if (!parseFunc) {
            console.warn('ℹ️ rdf-parse exports:', Object.keys(rdfParseModule));
            throw new Error('Impossible de trouver la fonction de parsing dans rdf-parse');
        }

        const input = Readable.from([xmlData]);
        const contentType = 'application/rdf+xml';

        const quadStream = parseFunc(input, { contentType });

        return new Promise((resolve, reject) => {
            let count = 0;

            quadStream.on('data', quad => {
                try {
                    // Ajouter directement le quad au store
                    this.store.addQuad(quad.subject, quad.predicate, quad.object);
                    count++;
                } catch (e) {
                    // ignorer les quads invalides mais logguer
                    console.warn('⚠️ Quad ignoré par addQuad:', e.message);
                }
            });

            quadStream.on('error', err => {
                reject(err);
            });

            quadStream.on('end', () => {
                if (count === 0) {
                    reject(new Error('Aucun triple valide extrait du fichier OWL (rdf-parse returned 0)'));
                } else {
                    resolve(count);
                }
            });
        });
    }

    async simpleOWLParser(xmlData) {
        console.log('🔧 Parsing XML simple...');
        
        const extractedTriples = [];

        // Méthode SIMPLIFIÉE : Extraire directement les patterns RDF
        const triplePatterns = [
            // Patterns pour les déclarations de classe
            /<owl:Class rdf:about="([^"]*)">/g,
            // Patterns pour les individus avec type
            /<([^>]+) rdf:about="([^"]*)"[^>]*>\s*<rdf:type rdf:resource="([^"]*)"/g,
            // Patterns pour les propriétés
            /<owl:(ObjectProperty|DatatypeProperty) rdf:about="([^"]*)">/g,
            // Patterns pour les relations directes
            /<([^:>]+) rdf:resource="([^"]*)"\/>/g,
            // Patterns pour les données littérales
            /<([^:>]+)>([^<]+)<\/[^>]+>/g
        ];

        // Extraire les déclarations de classe
        const classMatches = xmlData.match(/<owl:Class rdf:about="([^"]*)">/g) || [];
        classMatches.forEach(match => {
            const classIRI = match.match(/rdf:about="([^"]*)"/)[1];
            extractedTriples.push([classIRI, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://www.w3.org/2002/07/owl#Class']);
        });

        // Extraire les individus déclarés en tant que balises (ex: <Food rdf:about="...">)
        const elementMatches = xmlData.match(/<([A-Za-z0-9_:-]+) rdf:about="([^"]*)"[^>]*>/g) || [];
        for (const match of elementMatches) {
            const parts = match.match(/<([A-Za-z0-9_:-]+) rdf:about="([^"]*)"/);
            if (!parts) continue;
            const tagName = parts[1];
            const individualIRI = parts[2];
            // Ignorer les balises de namespace connus (owl:, rdf:, rdfs:, xml)
            if (/^(owl|rdf|rdfs|xml):/.test(tagName)) continue;
            // Construire l'IRI du type en utilisant baseIRI quand approprié
            const typeIRI = this.baseIRI + tagName;
            extractedTriples.push([individualIRI, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', typeIRI]);
        }

        // Extraire les individus avec leur type
        const individualMatches = xmlData.match(/<([^>]+) rdf:about="([^"]*)"[^>]*>\s*<rdf:type rdf:resource="([^"]*)"/g) || [];
        individualMatches.forEach(match => {
            const individualMatch = match.match(/<([^\s]+) rdf:about="([^"]*)"[^>]*>\s*<rdf:type rdf:resource="([^"]*)"/);
            if (individualMatch) {
                const [, elementType, individualIRI, typeIRI] = individualMatch;
                extractedTriples.push([individualIRI, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', typeIRI]);
            }
        });

        // Extraire les propriétés
        const propMatches = xmlData.match(/<owl:(ObjectProperty|DatatypeProperty) rdf:about="([^"]*)">/g) || [];
        propMatches.forEach(match => {
            const propMatch = match.match(/<owl:(ObjectProperty|DatatypeProperty) rdf:about="([^"]*)">/);
            if (propMatch) {
                const [, propType, propIRI] = propMatch;
                const fullPropType = propType === 'ObjectProperty' 
                    ? 'http://www.w3.org/2002/07/owl#ObjectProperty'
                    : 'http://www.w3.org/2002/07/owl#DatatypeProperty';
                extractedTriples.push([propIRI, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', fullPropType]);
            }
        });

        // Extraire les relations (hasNutrient, hasHealthEffect, etc.)
        this.extractRelations(xmlData, extractedTriples);

        // Extraire les propriétés de données (caloricDensity, inflammatoryEffect, etc.)
        this.extractDataProperties(xmlData, extractedTriples);

        console.log(`📝 ${extractedTriples.length} triples extraits du fichier OWL`);

        // AJOUTER LES TRIPLES DIRECTEMENT AU STORE
        let successCount = 0;
        extractedTriples.forEach(triple => {
            try {
                const [subject, predicate, object] = triple;
                
                // CRÉER LES NŒUDS DIRECTEMENT
                const subjectNode = namedNode(subject);
                const predicateNode = namedNode(predicate);
                let objectNode;
                
                // Déterminer si l'objet est un URI ou un literal
                if (object.startsWith('"') && object.endsWith('"')) {
                    // C'est un literal
                    objectNode = literal(object.slice(1, -1));
                } else if (object.includes('^^')) {
                    // Literal avec datatype
                    const [value, datatype] = object.split('^^');
                    objectNode = literal(value.slice(1, -1), namedNode(datatype));
                } else {
                    // C'est un URI
                    objectNode = namedNode(object);
                }
                
                // AJOUTER LE QUAD
                this.store.addQuad(subjectNode, predicateNode, objectNode);
                successCount++;
                
            } catch (error) {
                console.warn('❌ Triple ignoré:', triple, error.message);
            }
        });

        console.log(`✅ ${successCount} triples ajoutés au store`);
        
        if (successCount === 0) {
            throw new Error('Aucun triple valide extrait du fichier OWL');
        }
    }

    extractRelations(xmlData, extractedTriples) {
        // Extraire les relations de type hasNutrient
        const nutrientRelations = xmlData.match(/<hasNutrient rdf:resource="([^"]*)"\/>/g) || [];
        nutrientRelations.forEach(match => {
            const nutrientIRI = match.match(/rdf:resource="([^"]*)"/)[1];
            // Trouver le sujet (aliment) dans le contexte
            const context = this.findSubjectContext(xmlData, match);
            if (context) {
                extractedTriples.push([context, this.baseIRI + 'hasNutrient', nutrientIRI]);
            }
        });

        // Extraire les relations de type hasHealthEffect
        const healthRelations = xmlData.match(/<hasHealthEffect rdf:resource="([^"]*)"\/>/g) || [];
        healthRelations.forEach(match => {
            const effectIRI = match.match(/rdf:resource="([^"]*)"/)[1];
            const context = this.findSubjectContext(xmlData, match);
            if (context) {
                extractedTriples.push([context, this.baseIRI + 'hasHealthEffect', effectIRI]);
            }
        });

        // Extraire les propriétés caloricDensity
        const calorieMatches = xmlData.match(/<caloricDensity[^>]*>([^<]+)<\/caloricDensity>/g) || [];
        calorieMatches.forEach(match => {
            const value = match.match(/<caloricDensity[^>]*>([^<]+)<\/caloricDensity>/)[1];
            const context = this.findSubjectContext(xmlData, match);
            if (context) {
                extractedTriples.push([context, this.baseIRI + 'caloricDensity', `"${value}"^^http://www.w3.org/2001/XMLSchema#integer`]);
            }
        });

        // Extraire les propriétés inflammatoryEffect
        const inflammationMatches = xmlData.match(/<inflammatoryEffect[^>]*>([^<]+)<\/inflammatoryEffect>/g) || [];
        inflammationMatches.forEach(match => {
            const value = match.match(/<inflammatoryEffect[^>]*>([^<]+)<\/inflammatoryEffect>/)[1];
            const context = this.findSubjectContext(xmlData, match);
            if (context) {
                extractedTriples.push([context, this.baseIRI + 'inflammatoryEffect', `"${value}"^^http://www.w3.org/2001/XMLSchema#integer`]);
            }
        });
    }

    extractDataProperties(xmlData, extractedTriples) {
        // Extract all data properties with a generic pattern
        const dataProps = [
            'rdfs:label', 'caloricDensity', 'protein', 'carbohydrates', 'fat', 'fiber',
            'sustainabilityScore', 'season', 'origin', 'dailyRecommendation', 'unit', 
            'priority', 'inflammatoryEffect', 'glycemicIndex'
        ];

        dataProps.forEach(prop => {
            const tagName = prop.includes(':') ? prop : prop;
            const pattern = new RegExp(`<${tagName}[^>]*>([^<]+)<\/${tagName}>`, 'g');
            const matches = xmlData.match(pattern) || [];
            
            matches.forEach(match => {
                const valueMatch = match.match(new RegExp(`<${tagName}[^>]*>([^<]+)<\/${tagName}>`));
                if (valueMatch) {
                    const value = valueMatch[1];
                    const context = this.findSubjectContext(xmlData, match);
                    if (context) {
                        const propIRI = prop.includes(':') 
                            ? (prop === 'rdfs:label' ? 'http://www.w3.org/2000/01/rdf-schema#label' : prop)
                            : this.baseIRI + prop;
                        
                        // Determine if numeric
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue) && value.trim() === numValue.toString()) {
                            extractedTriples.push([context, propIRI, `"${value}"^^http://www.w3.org/2001/XMLSchema#decimal`]);
                        } else {
                            extractedTriples.push([context, propIRI, `"${value}"`]);
                        }
                    }
                }
            });
        });
    }

    findSubjectContext(xmlData, element) {
        // Trouver le sujet parent d'un élément
        const elementIndex = xmlData.indexOf(element);
        if (elementIndex === -1) return null;
        // Chercher la dernière occurrence de rdf:about avant cet élément
        const aboutIndex = xmlData.lastIndexOf('rdf:about="', elementIndex);
        if (aboutIndex === -1) return null;
        const start = aboutIndex + 'rdf:about="'.length;
        const end = xmlData.indexOf('"', start);
        if (end === -1) return null;
        return xmlData.substring(start, end);
    }

    async querySPARQL(query) {
        if (!this.initialized) {
            await this.loadOntology();
        }

        try {
            console.log('🔍 Exécution de la requête SPARQL...');
            const results = await this.executeSimpleSPARQL(query);
            console.log(`✅ ${results.results.bindings.length} résultats trouvés`);
            return results;
        } catch (error) {
            console.error('❌ Erreur SPARQL:', error.message);
            return {
                head: { vars: ['food'] },
                results: { bindings: [] }
            };
        }
    }

    async executeSimpleSPARQL(query) {
        const quads = this.store.getQuads();
        console.log(`🔍 Recherche dans ${quads.length} quads...`);

        // REQUÊTE PAR DÉFAUT - tous les aliments
        if (query.includes('SELECT ?food WHERE') || query.includes('rdf:type') && query.includes('Food')) {
            const foods = [];
            quads.forEach(quad => {
                if (quad.predicate.value.includes('type') && 
                    quad.object.value.includes('Food') &&
                    !quad.subject.value.includes('Class')) {
                    const foodName = this.extractLocalName(quad.subject.value);
                    if (foodName && !foods.includes(foodName)) {
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

        // Recherche par label
        if (query.includes('rdfs:label') && query.includes('FILTER')) {
            const searchMatch = query.match(/FILTER.*"([^"]+)"/i);
            if (searchMatch) {
                const searchText = searchMatch[1].toLowerCase();
                const results = [];
                
                quads.forEach(quad => {
                    if (quad.predicate.value.includes('label') && 
                        quad.object.value.toLowerCase().includes(searchText)) {
                        results.push({
                            food: { value: this.extractLocalName(quad.subject.value), type: 'uri' },
                            label: { value: quad.object.value, type: 'literal' }
                        });
                    }
                });
                
                return {
                    head: { vars: ['food', 'label'] },
                    results: { bindings: results }
                };
            }
        }

        // Fallback - retourner tous les aliments
        const allFoods = [];
        quads.forEach(quad => {
            if (quad.predicate.value.includes('type') && quad.object.value.includes('Food')) {
                const foodName = this.extractLocalName(quad.subject.value);
                if (foodName && !allFoods.includes(foodName)) {
                    allFoods.push(foodName);
                }
            }
        });
        
        return {
            head: { vars: ['food'] },
            results: { 
                bindings: allFoods.map(food => ({ 
                    food: { value: food, type: 'uri' } 
                }))
            }
        };
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
                    if (nutrient && !foods[foodName].nutrients.includes(nutrient)) {
                        foods[foodName].nutrients.push(nutrient);
                    }
                }
                if (quad.predicate.value.includes('hasHealthEffect')) {
                    const effect = this.extractLocalName(quad.object.value);
                    if (effect && !foods[foodName].healthEffects.includes(effect)) {
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
                    foods[foodName].label = quad.object.value;
                }
            }
        });

        return foods;
    }

    extractLocalName(iri) {
        if (!iri || typeof iri !== 'string') return 'unknown';
        return iri.split('#').pop() || iri.split('/').pop() || iri;
    }

    getOntologyStats() {
        const quads = this.store.getQuads();
        
        const stats = {
            foods: new Set(),
            nutrients: new Set(),
            healthEffects: new Set(),
            classes: new Set()
        };

        quads.forEach(quad => {
            if (quad.predicate.value.includes('type') && quad.object.value.includes('Food')) {
                stats.foods.add(this.extractLocalName(quad.subject.value));
            }
            if (quad.predicate.value.includes('hasNutrient')) {
                stats.nutrients.add(this.extractLocalName(quad.object.value));
            }
            if (quad.predicate.value.includes('hasHealthEffect')) {
                stats.healthEffects.add(this.extractLocalName(quad.object.value));
            }
            if (quad.object.value.includes('Class')) {
                stats.classes.add(this.extractLocalName(quad.subject.value));
            }
        });

        return {
            totalTriples: quads.length,
            inferredTriples: 0,
            entities: {
                foods: stats.foods.size,
                nutrients: stats.nutrients.size,
                healthEffects: stats.healthEffects.size,
                classes: stats.classes.size
            },
            foodExamples: Array.from(stats.foods).slice(0, 10),
            reasonerStatus: 'inactive',
            lastUpdated: new Date().toISOString()
        };
    }
}

module.exports = ProtegeOntologyLoader;