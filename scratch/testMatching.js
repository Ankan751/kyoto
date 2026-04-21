
const calculatePriceScore = (price, budget) => {
  if (price <= budget) return 1.0;
  const overageRatio = (price / budget);
  const x = overageRatio - 1.1; 
  return 1 / (1 + Math.exp(12 * x)); 
};

const calculateFinalScore = (p, b, a, t, isExactCity, isExactLocality) => {
  // If city doesn't match, property is excluded entirely
  if (!isExactCity) return 0;
  
  // If locality is provided and doesn't match, score is 0
  if (!isExactLocality) return 0;

  let score = 0.40 * p + 0.25 * b + 0.20 * a + 0.15 * t;
  return Math.min(1.0, Math.max(0, score));
};

console.log("--- STRICT MATCHING TEST ---");

// Scenario 1: Exact match, At budget
const s1p = calculatePriceScore(5000000, 5000000);
const s1 = calculateFinalScore(s1p, 1, 1, 1, true, true);
console.log(`Scenario 1 (Exact City & Locality): ${Math.round(s1 * 100)}%`);

// Scenario 4: Generic type request (No penalty)
const calculateGenericScore = (p, b, a, t_is_one) => {
  let score = 0.40 * p + 0.25 * b + 0.20 * a + 0.15 * 1.0; // t is explicitly 1.0 for generic
  return Math.min(1.0, Math.max(0, score));
};
const s4 = calculateGenericScore(s1p, 1, 1, 1);
console.log(`Scenario 4 (Generic 'property' request): ${Math.round(s4 * 100)}%`);

// Scenario 2: Neighboring locality (Strict mismatch)
const s2p = calculatePriceScore(5000000, 5000000);
const s2 = calculateFinalScore(s2p, 1, 1, 1, true, false);
console.log(`Scenario 2 (Neighbor Locality): ${Math.round(s2 * 100)}% (Expected: 0%)`);

// Scenario 3: Different City (Strict exclusion)
const s3p = calculatePriceScore(5000000, 5000000);
const s3 = calculateFinalScore(s3p, 1, 1, 1, false, true);
console.log(`Scenario 3 (Different City): ${Math.round(s3 * 100)}% (Expected: 0%)`);
