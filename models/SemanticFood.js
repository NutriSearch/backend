const mongoose = require('mongoose');

// Schéma pour les relations sémantiques
const semanticRelationSchema = new mongoose.Schema({
    relationType: {
        type: String,
        required: true,
        enum: [
            'hasNutrient',
            'hasHealthEffect', 
            'recommendedFor',
            'synergizesWith',
            'contraindicatedFor',
            'enhancesAbsorptionOf',
            'similarTo',
            'partOf',
            'hasCookingMethod'
        ]
    },
    target: {
        type: String,
        required: true
    },
    targetType: {
        type: String,
        enum: ['Food', 'Nutrient', 'HealthEffect', 'CookingMethod', 'Person'],
        required: true
    },
    strength: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5
    },
    evidence: [{
        source: String,
        confidence: Number,
        description: String
    }],
    contextDependent: {
        type: Boolean,
        default: false
    },
    contextConditions: [{
        condition: String,
        value: mongoose.Schema.Types.Mixed
    }]
}, {
    timestamps: true
});

// Schéma pour les propriétés nutritionnelles sémantiques
const nutritionalPropertySchema = new mongoose.Schema({
    property: {
        type: String,
        required: true,
        enum: [
            'caloricDensity',
            'inflammatoryEffect',
            'glycemicIndex',
            'nutrientDensityScore',
            'antioxidantCapacity',
            'alkalizingEffect',
            'energeticQuality',
            'digestibility'
        ]
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    unit: String,
    measurementMethod: String,
    variability: {
        type: Number,
        min: 0,
        max: 1
    }
});

// Schéma pour les profils sensoriels
const sensoryProfileSchema = new mongoose.Schema({
    taste: {
        sweetness: { type: Number, min: 0, max: 10 },
        bitterness: { type: Number, min: 0, max: 10 },
        sourness: { type: Number, min: 0, max: 10 },
        saltiness: { type: Number, min: 0, max: 10 },
        umami: { type: Number, min: 0, max: 10 }
    },
    texture: {
        type: String,
        enum: ['crunchy', 'creamy', 'chewy', 'crispy', 'soft', 'hard', 'juicy']
    },
    aroma: [String]
});

// Schéma pour les aspects écologiques et culturels
const ecologicalContextSchema = new mongoose.Schema({
    seasonality: [{
        season: {
            type: String,
            enum: ['spring', 'summer', 'autumn', 'winter']
        },
        availability: {
            type: String,
            enum: ['peak', 'good', 'limited', 'none']
        }
    }],
    carbonFootprint: Number,
    waterUsage: Number,
    localAvailability: {
        type: String,
        enum: ['high', 'medium', 'low', 'imported']
    },
    culturalSignificance: [{
        culture: String,
        significance: String,
        traditionalUses: [String]
    }],
    sustainabilityScore: {
        type: Number,
        min: 0,
        max: 10
    }
});

// Schéma pour les transformations culinaires
const culinaryTransformationSchema = new mongoose.Schema({
    cookingMethod: {
        type: String,
        required: true,
        enum: [
            'raw', 'steamed', 'boiled', 'baked', 'fried', 
            'grilled', 'roasted', 'fermented', 'sprouted'
        ]
    },
    effectOnNutrients: [{
        nutrient: String,
        change: {
            type: String,
            enum: ['increases', 'decreases', 'transforms', 'neutral']
        },
        percentage: Number,
        explanation: String
    }],
    effectOnBioavailability: {
        type: String,
        enum: ['increases', 'decreases', 'neutral']
    },
    recommendedPairings: [String],
    contraindications: [String]
});

// Schéma principal SemanticFood
const semanticFoodSchema = new mongoose.Schema({
    // Identifiants et métadonnées de base
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    scientificName: String,
    commonNames: [String],
    
    // Classification sémantique
    ontologicalClass: {
        type: String,
        required: true,
        enum: [
            'PlantBasedFood',
            'AnimalBasedFood', 
            'Fruit',
            'Vegetable',
            'ProteinSource',
            'Grain',
            'Nut',
            'Seed',
            'Dairy',
            'Beverage'
        ]
    },
    
    // Relations sémantiques
    semanticRelations: [semanticRelationSchema],
    
    // Propriétés nutritionnelles quantitatives et qualitatives
    nutritionalProperties: [nutritionalPropertySchema],
    
    // Profil sensoriel
    sensoryProfile: sensoryProfileSchema,
    
    // Contexte écologique et culturel
    ecologicalContext: ecologicalContextSchema,
    
    // Transformations culinaires
    culinaryTransformations: [culinaryTransformationSchema],
    
    // Propriétés temporelles et énergétiques
    temporalProperties: {
        bestConsumed: {
            type: String,
            enum: ['morning', 'afternoon', 'evening', 'anytime']
        },
        digestionTime: {
            type: Number // en heures
        },
        energeticEffect: {
            type: String,
            enum: ['immediate', 'sustained', 'delayed']
        }
    },
    
    // Aspects de bien-être holistique
    wellbeingAspects: {
        physical: [{
            aspect: String,
            effect: {
                type: String,
                enum: ['positive', 'negative', 'neutral']
            },
            intensity: {
                type: Number,
                min: 1,
                max: 5
            }
        }],
        mental: [{
            aspect: String,
            effect: {
                type: String,
                enum: ['calming', 'energizing', 'focusing', 'relaxing']
            },
            intensity: {
                type: Number,
                min: 1,
                max: 5
            }
        }],
        emotional: [{
            aspect: String,
            effect: {
                type: String,
                enum: ['comforting', 'uplifting', 'grounding', 'neutral']
            }
        }]
    },
    
    // Métadonnées et provenance
    metadata: {
        source: {
            type: String,
            enum: ['manual', 'ontology', 'research', 'traditional']
        },
        confidence: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.8
        },
        lastVerified: Date,
        references: [{
            title: String,
            url: String,
            type: {
                type: String,
                enum: ['scientific', 'traditional', 'clinical', 'anecdotal']
            }
        }]
    },
    
    // Index pour la recherche sémantique
    semanticTags: [String],
    
    // Statut et visibilité
    status: {
        type: String,
        enum: ['active', 'inactive', 'under_review'],
        default: 'active'
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index pour la recherche sémantique
semanticFoodSchema.index({
    'name': 'text',
    'commonNames': 'text',
    'semanticTags': 'text',
    'wellbeingAspects.physical.aspect': 'text',
    'wellbeingAspects.mental.aspect': 'text'
});

semanticFoodSchema.index({ 'ontologicalClass': 1 });
semanticFoodSchema.index({ 'nutritionalProperties.property': 1 });
semanticFoodSchema.index({ 'semanticRelations.relationType': 1 });

// Virtuals pour les relations dérivées
semanticFoodSchema.virtual('nutrients').get(function() {
    return this.semanticRelations
        .filter(rel => rel.relationType === 'hasNutrient')
        .map(rel => rel.target);
});

semanticFoodSchema.virtual('healthEffects').get(function() {
    return this.semanticRelations
        .filter(rel => rel.relationType === 'hasHealthEffect')
        .map(rel => rel.target);
});

semanticFoodSchema.virtual('synergies').get(function() {
    return this.semanticRelations
        .filter(rel => rel.relationType === 'synergizesWith')
        .map(rel => rel.target);
});

// Méthodes d'instance
semanticFoodSchema.methods.getNutritionalProperty = function(propertyName) {
    const prop = this.nutritionalProperties.find(p => p.property === propertyName);
    return prop ? prop.value : null;
};

semanticFoodSchema.methods.hasHealthEffect = function(effectName) {
    return this.semanticRelations.some(rel => 
        rel.relationType === 'hasHealthEffect' && 
        rel.target === effectName
    );
};

semanticFoodSchema.methods.getRelationsByType = function(relationType) {
    return this.semanticRelations.filter(rel => rel.relationType === relationType);
};

semanticFoodSchema.methods.calculateWellbeingScore = function(goals) {
    let score = 0;
    
    goals.forEach(goal => {
        // Score basé sur les effets santé
        const healthEffects = this.getRelationsByType('hasHealthEffect');
        healthEffects.forEach(effect => {
            if (effect.target.toLowerCase().includes(goal.toLowerCase())) {
                score += effect.strength * 10;
            }
        });
        
        // Score basé sur les propriétés nutritionnelles
        if (goal === 'anti-inflammatory' && this.getNutritionalProperty('inflammatoryEffect') < 0) {
            score += Math.abs(this.getNutritionalProperty('inflammatoryEffect')) * 2;
        }
        
        if (goal === 'energy' && this.getNutritionalProperty('energeticQuality') === 'high') {
            score += 8;
        }
    });
    
    return Math.min(score, 100);
};

// Méthodes statiques
semanticFoodSchema.statics.findByNutrient = function(nutrientName) {
    return this.find({
        'semanticRelations': {
            $elemMatch: {
                relationType: 'hasNutrient',
                target: nutrientName
            }
        }
    });
};

semanticFoodSchema.statics.findByHealthEffect = function(effectName) {
    return this.find({
        'semanticRelations': {
            $elemMatch: {
                relationType: 'hasHealthEffect',
                target: effectName
            }
        }
    });
};

semanticFoodSchema.statics.findByWellbeingGoal = function(goal) {
    return this.find({
        $or: [
            { 'semanticTags': { $regex: goal, $options: 'i' } },
            { 'wellbeingAspects.physical.aspect': { $regex: goal, $options: 'i' } },
            { 'wellbeingAspects.mental.aspect': { $regex: goal, $options: 'i' } }
        ]
    });
};

semanticFoodSchema.statics.getFoodsBySeason = function(season) {
    return this.find({
        'ecologicalContext.seasonality.season': season,
        'ecologicalContext.seasonality.availability': { $in: ['peak', 'good'] }
    });
};

semanticFoodSchema.statics.findSustainableFoods = function(minScore = 7) {
    return this.find({
        'ecologicalContext.sustainabilityScore': { $gte: minScore }
    }).sort({ 'ecologicalContext.sustainabilityScore': -1 });
};

// Middleware pour la validation sémantique
semanticFoodSchema.pre('save', function(next) {
    // Valider la cohérence des relations sémantiques
    const relationTypes = this.semanticRelations.map(rel => rel.relationType);
    const uniqueRelations = new Set(relationTypes);
    
    if (uniqueRelations.size !== relationTypes.length) {
        console.warn('Relations sémantiques en doublon détectées');
    }
    
    // S'assurer que les scores sont dans les limites
    if (this.ecologicalContext.sustainabilityScore > 10) {
        this.ecologicalContext.sustainabilityScore = 10;
    }
    
    // Générer les tags sémantiques automatiquement
    this.generateSemanticTags();
    
    next();
});

// Méthode pour générer des tags sémantiques
semanticFoodSchema.methods.generateSemanticTags = function() {
    const tags = new Set();
    
    // Tags basés sur la classe ontologique
    tags.add(this.ontologicalClass.toLowerCase());
    
    // Tags basés sur les nutriments
    this.nutrients.forEach(nutrient => {
        tags.add(nutrient.toLowerCase());
        tags.add(`rich-in-${nutrient.toLowerCase()}`);
    });
    
    // Tags basés sur les effets santé
    this.healthEffects.forEach(effect => {
        tags.add(effect.toLowerCase().replace(/\s+/g, '-'));
        tags.add(`supports-${effect.toLowerCase().replace(/\s+/g, '-')}`);
    });
    
    // Tags basés sur les propriétés
    this.nutritionalProperties.forEach(prop => {
        if (prop.property === 'inflammatoryEffect' && prop.value < 0) {
            tags.add('anti-inflammatory');
        }
        if (prop.property === 'energeticQuality' && prop.value === 'high') {
            tags.add('energizing');
        }
    });
    
    // Tags écologiques
    if (this.ecologicalContext.sustainabilityScore >= 8) {
        tags.add('sustainable');
    }
    if (this.ecologicalContext.localAvailability === 'high') {
        tags.add('local');
    }
    
    this.semanticTags = Array.from(tags);
};

module.exports = mongoose.model('SemanticFood', semanticFoodSchema);