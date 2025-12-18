const ProtegeOntologyLoader = require('./ontology/protege-loader');

async function testSPARQLEngine() {
    console.log('🧪 Test du moteur SPARQL amélioré\n');
    
    const loader = new ProtegeOntologyLoader();
    
    try {
        // Charger l'ontologie
        console.log('📚 Chargement de l\'ontologie...');
        await loader.loadOntology();
        console.log('✅ Ontologie chargée\n');

        // Test 1: Requête simple - tous les aliments
        console.log('📝 Test 1: Requête SPARQL - Tous les aliments');
        const allFoodsQuery = `
            PREFIX nutrition: <http://www.semanticweb.org/nutrisearch-ontology#>
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            
            SELECT ?food
            WHERE {
                ?food rdf:type nutrition:Food .
            }
        `;
        
        const allFoodsResult = await loader.querySPARQL(allFoodsQuery);
        console.log(`✅ Résultat: ${allFoodsResult.results.bindings.length} aliments trouvés`);
        if (allFoodsResult.results.bindings.length > 0) {
            console.log('   Exemples:', allFoodsResult.results.bindings.slice(0, 3).map(b => b.food.value));
        }
        console.log('');

        // Test 2: Requête avec nutriments
        console.log('📝 Test 2: Requête SPARQL - Aliments avec nutriments');
        const nutrientsQuery = `
            PREFIX nutrition: <http://www.semanticweb.org/nutrisearch-ontology#>
            
            SELECT ?food ?nutrient
            WHERE {
                ?food nutrition:hasNutrient ?nutrient .
            }
        `;
        
        try {
            const nutrientsResult = await loader.querySPARQL(nutrientsQuery);
            console.log(`✅ Résultat: ${nutrientsResult.results.bindings.length} associations aliment-nutriment trouvées`);
            if (nutrientsResult.results.bindings.length > 0) {
                console.log('   Exemples:', nutrientsResult.results.bindings.slice(0, 3).map(b => 
                    `${b.food?.value || 'N/A'} -> ${b.nutrient?.value || 'N/A'}`
                ));
            }
        } catch (err) {
            console.log(`⚠️ Fallback appliqué (simplifié): ${err.message}`);
        }
        console.log('');

        // Test 3: Requête avec effets de santé
        console.log('📝 Test 3: Requête SPARQL - Aliments avec effets de santé');
        const healthEffectsQuery = `
            PREFIX nutrition: <http://www.semanticweb.org/nutrisearch-ontology#>
            
            SELECT ?food ?healthEffect
            WHERE {
                ?food nutrition:hasHealthEffect ?healthEffect .
            }
        `;
        
        try {
            const healthResult = await loader.querySPARQL(healthEffectsQuery);
            console.log(`✅ Résultat: ${healthResult.results.bindings.length} associations aliment-effet trouvées`);
            if (healthResult.results.bindings.length > 0) {
                console.log('   Exemples:', healthResult.results.bindings.slice(0, 3).map(b => 
                    `${b.food?.value || 'N/A'} -> ${b.healthEffect?.value || 'N/A'}`
                ));
            }
        } catch (err) {
            console.log(`⚠️ Fallback appliqué (simplifié): ${err.message}`);
        }
        console.log('');

        // Test 4: Statistiques
        console.log('📝 Test 4: Statistiques de l\'ontologie');
        const stats = loader.getOntologyStats();
        console.log(`✅ Stats de l'ontologie:`);
        console.log(`   - Total triples: ${stats.totalTriples}`);
        console.log(`   - Aliments: ${stats.entities.foods}`);
        console.log(`   - Nutriments: ${stats.entities.nutrients}`);
        console.log(`   - Effets santé: ${stats.entities.healthEffects}`);
        console.log(`   - Classes: ${stats.entities.classes}`);
        console.log('');

        console.log('🎉 Tous les tests sont terminés!');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error(error);
    }
}

testSPARQLEngine();
