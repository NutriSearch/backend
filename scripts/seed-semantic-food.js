const mongoose = require('mongoose');
const SemanticFood = require('../models/SemanticFood');
require('dotenv').config();

const sampleFoods = [
    {
        name: "Apple",
        ontologicalClass: "Fruit",
        semanticRelations: [
            {
                relationType: "hasNutrient",
                target: "VitaminC",
                targetType: "Nutrient",
                strength: 0.8
            },
            {
                relationType: "hasNutrient", 
                target: "Fiber",
                targetType: "Nutrient",
                strength: 0.7
            },
            {
                relationType: "hasHealthEffect",
                target: "ImmuneSupport",
                targetType: "HealthEffect",
                strength: 0.7
            },
            {
                relationType: "hasHealthEffect",
                target: "DigestiveHealth", 
                targetType: "HealthEffect",
                strength: 0.8
            }
        ],
        nutritionalProperties: [
            {
                property: "caloricDensity",
                value: 52,
                unit: "kcal/100g"
            },
            {
                property: "inflammatoryEffect",
                value: -1
            },
            {
                property: "glycemicIndex",
                value: 36
            }
        ],
        ecologicalContext: {
            seasonality: [
                {
                    season: "autumn",
                    availability: "peak"
                }
            ],
            sustainabilityScore: 8,
            localAvailability: "high"
        },
        sensoryProfile: {
            taste: {
                sweetness: 7,
                sourness: 3,
                bitterness: 1
            },
            texture: "crunchy"
        }
    },
    {
        name: "Salmon",
        ontologicalClass: "AnimalBasedFood", 
        semanticRelations: [
            {
                relationType: "hasNutrient",
                target: "Omega3",
                targetType: "Nutrient",
                strength: 0.9
            },
            {
                relationType: "hasNutrient",
                target: "Protein",
                targetType: "Nutrient", 
                strength: 0.9
            },
            {
                relationType: "hasHealthEffect",
                target: "AntiInflammatory",
                targetType: "HealthEffect",
                strength: 0.8
            },
            {
                relationType: "hasHealthEffect",
                target: "CognitiveFunction",
                targetType: "HealthEffect",
                strength: 0.7
            }
        ],
        nutritionalProperties: [
            {
                property: "caloricDensity",
                value: 208,
                unit: "kcal/100g"
            },
            {
                property: "inflammatoryEffect",
                value: -2
            }
        ],
        ecologicalContext: {
            sustainabilityScore: 6,
            localAvailability: "medium"
        }
    },
    {
        name: "Spinach",
        ontologicalClass: "Vegetable",
        semanticRelations: [
            {
                relationType: "hasNutrient",
                target: "Iron",
                targetType: "Nutrient",
                strength: 0.8
            },
            {
                relationType: "hasNutrient",
                target: "Magnesium", 
                targetType: "Nutrient",
                strength: 0.7
            },
            {
                relationType: "hasHealthEffect",
                target: "EnergyBoosting",
                targetType: "HealthEffect",
                strength: 0.6
            },
            {
                relationType: "hasHealthEffect",
                target: "BoneHealth",
                targetType: "HealthEffect", 
                strength: 0.7
            }
        ],
        nutritionalProperties: [
            {
                property: "caloricDensity",
                value: 23,
                unit: "kcal/100g"
            },
            {
                property: "inflammatoryEffect",
                value: -2
            },
            {
                property: "nutrientDensityScore", 
                value: 10
            }
        ],
        ecologicalContext: {
            seasonality: [
                {
                    season: "spring",
                    availability: "peak"
                }
            ],
            sustainabilityScore: 9,
            localAvailability: "high"
        }
    }
];

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nutrition-protege');
        console.log('Connected to MongoDB');
        
        // Nettoyer la collection existante
        await SemanticFood.deleteMany({});
        console.log('Cleared existing foods');
        
        // Insérer les échantillons
        await SemanticFood.insertMany(sampleFoods);
        console.log('Sample semantic foods inserted');
        
        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();