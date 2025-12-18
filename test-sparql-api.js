#!/usr/bin/env node

/**
 * Test SPARQL API Endpoints
 * This script tests the semantic search API with SPARQL queries
 */

const http = require('http');

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function testAPIs() {
    console.log('🧪 Testing SPARQL API Endpoints\n');
    
    // Wait a moment for server to be ready
    await new Promise(r => setTimeout(r, 1000));

    try {
        // Test 1: General semantic search
        console.log('📝 Test 1: General Semantic Search');
        const search1 = await makeRequest('/semantic/search');
        console.log(`   Status: ${search1.status}`);
        console.log(`   Results: ${search1.data.results?.data?.length || search1.data.data?.length || 0} items`);
        console.log('');

        // Test 2: Search by health goal
        console.log('📝 Test 2: Search by Health Goal (immune)');
        const search2 = await makeRequest('/semantic/search?healthGoal=immune');
        console.log(`   Status: ${search2.status}`);
        console.log(`   Results: ${search2.data.results?.data?.length || search2.data.data?.length || 0} items`);
        if (search2.data.results?.data && search2.data.results.data.length > 0) {
            console.log(`   Example: ${search2.data.results.data[0].name}`);
        }
        console.log('');

        // Test 3: Search by nutrient
        console.log('📝 Test 3: Search by Nutrient (vitamin)');
        const search3 = await makeRequest('/semantic/search?nutrient=vitamin');
        console.log(`   Status: ${search3.status}`);
        console.log(`   Results: ${search3.data.results?.data?.length || search3.data.data?.length || 0} items`);
        if (search3.data.results?.data && search3.data.results.data.length > 0) {
            console.log(`   Example: ${search3.data.results.data[0].name}`);
        }
        console.log('');

        // Test 4: Ontology stats
        console.log('📝 Test 4: Ontology Statistics');
        const stats = await makeRequest('/semantic/stats');
        console.log(`   Status: ${stats.status}`);
        if (stats.data.data) {
            console.log(`   Total Triples: ${stats.data.data.totalTriples}`);
            console.log(`   Foods: ${stats.data.data.entities.foods}`);
            console.log(`   Nutrients: ${stats.data.data.entities.nutrients}`);
            console.log(`   Health Effects: ${stats.data.data.entities.healthEffects}`);
        }
        console.log('');

        console.log('✅ All API tests completed!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testAPIs();
