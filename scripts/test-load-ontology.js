const ProtegeOntologyLoader = require('../ontology/protege-loader');

(async () => {
    try {
        const loader = new ProtegeOntologyLoader();
        await loader.loadOntology();
        const quads = loader.store.getQuads();
        console.log(`Quads in store: ${quads.length}`);
        console.log('Some example quads:');
        quads.slice(0, 10).forEach(q => console.log(q.subject.value, q.predicate.value, q.object.value));
    } catch (err) {
        console.error('Loader error:', err.message || err);
        process.exit(1);
    }
})();
