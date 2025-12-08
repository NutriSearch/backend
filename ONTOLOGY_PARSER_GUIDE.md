# NutriSearch Ontology API Documentation

## Overview
The backend now parses your OWL/RDF ontology file and serves it as JSON data compatible with the frontend's `ontologyData.js` structure.

## New Endpoints

### 1. Get Ontology Data (Frontend Compatible)
**Endpoint**: `GET /api/semantic/ontology-data`

Returns data in the exact format expected by the frontend (nodes and relations):

```json
{
  "status": "success",
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "aliment_1",
        "label": "Pomme",
        "type": "Aliment",
        "subType": "Food",
        "attributes": {
          "nom": "Pomme",
          "calories": 52,
          "proteines": 0.3,
          "glucides": 14,
          "lipides": 0.2,
          "fibres": 2.4,
          "scoreDurabilite": 8.5,
          "estBio": false,
          "saisonRecolte": "automne",
          "origine": "France"
        }
      }
    ],
    "relations": [
      {
        "source": "aliment_1",
        "target": "nutriment_1",
        "label": "contient",
        "type": "contient",
        "attributes": {
          "quantite": 100,
          "unite": "mg pour 100g"
        }
      }
    ],
    "metadata": {
      "totalNodes": 15,
      "totalRelations": 20,
      "nodeTypes": ["Utilisateur", "Aliment", "Nutriment", "Effet Santé"],
      "relationTypes": ["mange", "contient", "hasHealthEffect"],
      "generatedAt": "2025-12-08T20:00:00.000Z",
      "source": "OWL Ontology Parser"
    }
  }
}
```

### 2. Get Ontology Graph (Simplified)
**Endpoint**: `GET /api/semantic/ontology-graph`

Returns a simplified view of foods with their nutrients and health effects:

```json
{
  "status": "success",
  "success": true,
  "data": {
    "foods": [
      {
        "name": "Apple",
        "label": "Pomme",
        "nutrients": ["VitaminC", "Fiber"],
        "healthEffects": ["ImmuneSupport", "Digestive"],
        "properties": {
          "caloricDensity": 52,
          "protein": 0.3,
          "fiber": 2.4
        }
      }
    ],
    "stats": {
      "totalTriples": 120,
      "entities": {
        "foods": 7,
        "nutrients": 7,
        "healthEffects": 7
      }
    }
  }
}
```

## How the Parser Works

### 1. OWL File Structure
Your `nutrisearch-ontology.owl` file contains:
- **Classes**: Food, Nutrient, HealthEffect
- **Individuals**: Specific foods (Apple, Salmon, etc.)
- **Properties**: hasNutrient, hasHealthEffect
- **Data Properties**: caloricDensity, protein, fiber, etc.

### 2. Parsing Process
```
OWL/RDF File → XML Parser → N3 Store → SPARQL Queries → JSON Output
```

1. **Load OWL**: Reads XML file from `data/nutrisearch-ontology.owl`
2. **Parse Triples**: Extracts RDF triples (subject-predicate-object)
3. **Store**: Saves in N3 store for querying
4. **Transform**: Converts to frontend-compatible JSON format

### 3. Data Extraction

#### Foods
```xml
<Food rdf:about="...#Apple">
  <rdfs:label>Pomme</rdfs:label>
  <caloricDensity>52</caloricDensity>
  <protein>0.3</protein>
  ...
</Food>
```
→ Becomes Node with attributes

#### Relations
```xml
<Food rdf:about="...#Apple">
  <hasNutrient rdf:resource="...#VitaminC"/>
</Food>
```
→ Becomes Relation: Apple → VitaminC

## Frontend Integration

### Option 1: Replace Static Data
Replace `src/data/ontologyData.js` with API call:

```javascript
// In your React component
import { useState, useEffect } from 'react';

function OntologyVisualization() {
  const [ontologyData, setOntologyData] = useState({ nodes: [], relations: [] });
  
  useEffect(() => {
    fetch('http://localhost:5000/api/semantic/ontology-data')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setOntologyData(data.data);
        }
      });
  }, []);
  
  // Use ontologyData.nodes and ontologyData.relations
}
```

### Option 2: Create Hybrid Approach
Keep static data as fallback, load dynamic data:

```javascript
import { nodes as staticNodes, relations as staticRelations } from '../data/ontologyData';

const [data, setData] = useState({ 
  nodes: staticNodes, 
  relations: staticRelations 
});

useEffect(() => {
  fetch('http://localhost:5000/api/semantic/ontology-data')
    .then(res => res.json())
    .then(response => {
      if (response.success) {
        // Merge or replace with API data
        setData(response.data);
      }
    })
    .catch(err => {
      console.warn('Using static data fallback:', err);
      // Keep using static data
    });
}, []);
```

## Testing the Parser

### PowerShell Test
```powershell
# Get ontology data
Invoke-RestMethod -Uri 'http://localhost:5000/api/semantic/ontology-data' | ConvertTo-Json -Depth 10

# Get simplified graph
Invoke-RestMethod -Uri 'http://localhost:5000/api/semantic/ontology-graph' | ConvertTo-Json -Depth 10
```

### Browser Test
```
http://localhost:5000/api/semantic/ontology-data
http://localhost:5000/api/semantic/ontology-graph
```

## Current OWL Data

### Foods (7)
- Pomme (Apple) - 52 kcal, rich in Vitamin C, Fiber
- Banane (Banana) - 89 kcal, rich in Vitamin C, Fiber
- Brocoli (Broccoli) - 34 kcal, rich in Vitamin C, Calcium
- Carotte (Carrot) - 41 kcal, rich in Beta-carotene
- Saumon (Salmon) - 208 kcal, rich in Omega-3, Protein
- Yaourt (Yogurt) - 59 kcal, rich in Calcium, Protein
- Épinard (Spinach) - 23 kcal, rich in Iron, Vitamin C

### Nutrients (7)
- Vitamine C (Vitamin C) - 80mg daily
- Omega-3 - 250mg daily
- Fibres (Fiber) - 25g daily
- Calcium - 1000mg daily
- Protéines (Protein) - 50g daily
- Bêta-carotène (Beta-carotene) - 800µg daily
- Fer (Iron) - 14mg daily

### Health Effects (7)
- Soutien Immunitaire (Immune Support)
- Anti-inflammatoire (Anti-Inflammatory)
- Améliore la digestion (Digestive)
- Santé cardiovasculaire (Heart Health)
- Santé cognitive (Brain Health)
- Antioxydant (Antioxidant)
- Santé osseuse (Bone Health)

## Adding More Data

### Add a New Food
```xml
<Food rdf:about="http://www.semanticweb.org/nutrisearch-ontology#Avocado">
    <rdfs:label>Avocat</rdfs:label>
    <caloricDensity>160</caloricDensity>
    <protein>2</protein>
    <carbohydrates>9</carbohydrates>
    <fat>15</fat>
    <fiber>7</fiber>
    <sustainabilityScore>6.5</sustainabilityScore>
    <season>toute l'année</season>
    <origin>Mexique</origin>
    <hasNutrient rdf:resource="http://www.semanticweb.org/nutrisearch-ontology#Fiber"/>
    <hasHealthEffect rdf:resource="http://www.semanticweb.org/nutrisearch-ontology#HeartHealth"/>
</Food>
```

### Add a New Nutrient
```xml
<Nutrient rdf:about="http://www.semanticweb.org/nutrisearch-ontology#VitaminE">
    <rdfs:label>Vitamine E</rdfs:label>
    <dailyRecommendation>15</dailyRecommendation>
    <unit>mg</unit>
</Nutrient>
```

Server will automatically reload with nodemon! 🔄

## Troubleshooting

### Parser Not Finding Data
- Check OWL file path: `backend/data/nutrisearch-ontology.owl`
- Verify XML is valid (no unclosed tags)
- Check console logs for parsing errors

### Empty Results
- Run: `GET /api/semantic/stats` to see what was loaded
- Check if triples are being extracted (console logs show count)

### Incorrect Attributes
- Verify property names in OWL match parser expectations
- Check `extractDataProperties` function in `protege-loader.js`

## Performance

- Initial load: ~100-500ms (parsing OWL)
- Subsequent requests: ~10-50ms (cached in memory)
- File size: Current ~5KB, can scale to ~500KB efficiently
- Reload: Automatic with nodemon when OWL file changes

## Next Steps

1. ✅ Parser working and serving JSON
2. ✅ OWL file enhanced with realistic data
3. ✅ API endpoints created
4. 🔄 Integrate with frontend visualization
5. 🔄 Add more foods, nutrients, and health effects
6. 🔄 Create user-specific recommendations based on parsed data

The backend is ready to serve your ontology data dynamically! 🚀
