import Property from '../models/propertyModel.js';
import { parseWithGrok } from '../services/grokService.js';
import logger from '../utils/logger.js';

// 5. Validation Layer
export function validate(data, originalQuery = '', context = {}) {
  // Check if BHK was explicitly provided by the AI or mentioned in the query
  const hasBHKInQuery = /bhk|bedroom|room|rk/i.test(originalQuery);
  const hasBHKInParsed = data.bhk && data.bhk.preferred && data.bhk.preferred.length > 0;
  
  data.bhkSpecified = hasBHKInQuery || hasBHKInParsed;

  // Check if Type was explicitly provided (e.g. "flat", "villa", "house", "plot")
  const typeKeywords = ['flat', 'villa', 'house', 'plot', 'apartment', 'bungalow', 'penthouse', 'land', 'shop', 'office'];
  const hasTypeInQuery = typeKeywords.some(kw => originalQuery.toLowerCase().includes(kw));
  data.typeSpecified = hasTypeInQuery;


  // For appointments, we can default the city to the property city
  if (!data.city && context.city) {
    data.city = context.city;
  }

  // If still no city, but it's a search, we might throw, 
  // but let's just default to a fallback or allow it to be empty for scoring.
  if (!data.city) data.city = "Jalandhar"; // Default market

  if (!data.bhk || !data.bhk.preferred || !data.bhk.preferred.length) {
    data.bhk = data.bhk || {};
    data.bhk.preferred = [2]; // Default for internal scoring if not specified
  }

  if (!data.budget || !data.budget.max) {
    data.budget = data.budget || {};
    data.budget.max = 1000000000; // 100 Crore (effectively no limit)
  }

  return data;
}

// 6. Hard Filters (Strict)
export function buildQuery(data) {
  const query = {
    status: 'active'
  };

  // Flexible City Search
  if (data.city) {
    query.city = new RegExp(data.city, 'i');
  }

  // Flexible Locality Search
  if (data.locality) {
    query.locality = new RegExp(data.locality, 'i');
  }

  return query;
}

// 7.1 Price (Sigmoid Normalization)
function priceScore(price, budget) {
  if (price <= budget) return 1.0;
  
  // Over budget scoring: use a sigmoid that stays near 1.0 for small overages 
  // and drops off after 10-15% overage.
  const overageRatio = (price / budget); // e.g. 1.1 for 10% over
  const x = overageRatio - 1.1; // Centered at 10% over budget
  return 1 / (1 + Math.exp(12 * x)); 
}

// 7.2 BHK Score
function bhkScore(propertyBHK, preferred) {
  const diff = Math.abs(propertyBHK - preferred);
  if (diff === 0) return 1;
  if (diff === 1) return 0.6; // Close match
  return 0; // Too far off
}

// 7.3 Amenities + Tags
function amenitiesScore(property, user) {
  const requirements = [...(user.amenities || [])];

  if (requirements.length === 0) return 1.0; // 100% match if user has no specific demands

  const propertyFeatures = [...(property.amenities || []), ...(property.tags || [])];
  const matches = requirements.filter(req => 
      propertyFeatures.some(f => f.toLowerCase().includes(req.toLowerCase()))
  );

  return matches.length / requirements.length;
}

// 7.3b Derived Preferences Boost
function derivedScore(property, user) {
  const preferences = [];
  if (user.derived_preferences?.transport_access) preferences.push('transport_access');
  if (user.derived_preferences?.school_nearby) preferences.push('school_nearby');
  if (user.derived_preferences?.premium_locality) preferences.push('premium_locality');

  if (preferences.length === 0) return 1.0; 

  const propertyFeatures = [...(property.amenities || []), ...(property.tags || [])];
  const matches = preferences.filter(req => 
      propertyFeatures.some(f => f.toLowerCase().includes(req.toLowerCase()))
  );

  return matches.length / preferences.length;
}

// 7.4 Final Score
export function calculateScore(property, user) {
  if (!property) {
    return {
      total: 0,
      details: { note: "No specific property to score against" }
    };
  }

  const propertyBHK = property.bhk || property.beds || 0;
  const p = priceScore(property.price, user.budget.max);
  const b = bhkScore(propertyBHK, user.bhk.preferred[0]);
  const a = amenitiesScore(property, user);
  const d = derivedScore(property, user);
  
  // Type score
  let t = 1;
  const genericTypes = ['property', 'place', 'listing', 'real estate', 'home', 'unit'];
  const isGenericRequest = user.type && genericTypes.includes(user.type.toLowerCase().trim());
  
  if (user.type && property.type && !isGenericRequest) {
      t = property.type.toLowerCase().includes(user.type.toLowerCase()) ? 1 : 0.7;
  }
  
  // Only apply the type penalty/score if the user actually specified a type
  if (!user.typeSpecified) {
      t = 1.0;
  }

  const details = {
    priceScore: p,
    bhkScore: b,
    amenitiesScore: a,
    derivedScore: d,
    typeScore: t,
    isWithinBudget: property.price <= user.budget.max,
    matchesBHK: propertyBHK === user.bhk.preferred[0],
    amenitiesSpecified: (user.amenities && user.amenities.length > 0) || 
                        (user.derived_preferences && Object.values(user.derived_preferences).some(v => v === true))
  };

  const diff = propertyBHK - user.bhk.preferred[0];
  const absDiff = Math.abs(diff);

  // Hard Filter: If bedrooms are too few (diff < -1), exclude it
  // ONLY if the user explicitly asked for a BHK configuration
  if (user.bhkSpecified && diff < -1) {
      return { 
          total: 0, 
          details: { ...details, bhkScore: 0, matchesBHK: false } 
      };
  }

  let score =
    0.40 * p +
    0.25 * (user.bhkSpecified ? b : 1.0) +
    0.20 * a +
    0.15 * t;

  // Apply Derived Boost (Inferred preferences like 'Luxury' or 'Transit' only increase the score)
  const hasDerivedPrefs = user.derived_preferences && Object.values(user.derived_preferences).some(v => v === true);
  if (hasDerivedPrefs && d > 0) {
      // Add a small priority boost based on derived match, capped at 1.0 total
      score += (0.05 * d); 
  }

  // Apply specific BHK penalties only if BHK was requested
  if (user.bhkSpecified) {
      if (absDiff === 1) {
          score -= 0.05;
      } else if (absDiff > 1) {
          score -= (0.2 * absDiff);
      }
  }

  // 11. CITY VALIDATION (Mandatory if provided)
  const requestedCity = (user.city || "").toLowerCase().trim();
  const propertyCity = (property.city || "").toLowerCase().trim();
  const propertyFullLocation = (property.location || "").toLowerCase().trim();

  // If a city was provided, it MUST match the property city or be part of the full address.
  if (requestedCity) {
     const isCityMatch = propertyCity.includes(requestedCity) || 
                         requestedCity.includes(propertyCity) ||
                         propertyFullLocation.includes(requestedCity);

     if (!isCityMatch) {
       return {
         total: 0,
         details: { ...details, cityMatch: false }
       };
     }
  }

  // 12. LOCALITY VALIDATION (Robust)
  const requestedLocality = (user.locality || "").toLowerCase().trim();
  const propertyLocality = (property.locality || "").toLowerCase().trim();
  const fullLocation = (property.location || "").toLowerCase().trim();

  // If user asked for a locality, check if it matches EXACTLY, is a SUBSTRING, 
  // or if it exists within the FULL location string.
  if (requestedLocality) {
    const isMatch = propertyLocality.includes(requestedLocality) || 
                    requestedLocality.includes(propertyLocality) ||
                    fullLocation.includes(requestedLocality);

    if (!isMatch) {
      return {
        total: 0,
        details: { ...details, localityMatch: false }
      };
    }
  }

  // Final cap: score should never exceed 1.0 (100%)
  score = Math.min(1.0, score);

  return {
    total: score,
    details: { ...details, localityMatch: true }
  };
}

// 8. Search API
export const nlSearch = async (req, res) => {
  try {
    const input = req.body.query;
    if (!input) {
        return res.status(400).json({ success: false, message: 'Query is required' });
    }

    logger.info('NL Search initiated', { input });

    const parsed = await parseWithGrok(input);
    const user = validate(parsed, input);
    let query = buildQuery(user);

    let properties = await Property.find(query);

    // Fallback: If no results found with specific city/locality fields, 
    // try searching in the combined 'location' field.
    if (properties.length === 0 && (user.city || user.locality)) {
      const fallbackQuery = { status: 'active' };
      const searchTerms = [user.city, user.locality].filter(Boolean);
      
      fallbackQuery.$or = searchTerms.map(term => ({
        location: new RegExp(term, 'i')
      }));

      properties = await Property.find(fallbackQuery);
    }

    const ranked = properties
      .map(p => {
        const scoreObj = calculateScore(p, user);
        return {
          ...p.toObject(),
          score: scoreObj.total,
          scoreDetails: scoreObj.details
        };
      })
      .filter(p => p.score >= 0.4) // Filter out irrelevant matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.json({
        success: true,
        results: ranked,
        parsed: user
    });
  } catch (error) {
    logger.error('NL Search error:', { error: error.message });
    res.status(500).json({
        success: false,
        message: error.message || 'Failed to perform natural language search'
    });
  }
};
