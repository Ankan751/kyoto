import axios from 'axios';

async function verifyCityValidation() {
  try {
    console.log("Verifying City Validation (Jalandhar vs. Gandhinagar)...");
    
    // Testing the cross-city query
    const query = "4 bhk in gift city jalandhar";
    const response = await axios.post('http://localhost:4000/api/nl/search', {
      query: query
    });
    
    console.log(`\nQuery: "${query}"`);
    console.log(`Parsed AI Result City:`, response.data.parsed.city);
    console.log(`Parsed AI Result Locality:`, response.data.parsed.locality);
    
    if (response.data.results && response.data.results.length > 0) {
      console.log(`❌ ERROR: Found ${response.data.results.length} results. Should be 0 for Jalandhar.`);
      response.data.results.forEach(p => {
         console.log(`- ${p.title} (Score: ${p.score * 100}%)`);
      });
    } else {
      console.log("✅ SUCCESS: No matching properties found for the specified city (Jalandhar).");
    }

    // Double check that it STILL works for the correct city
    const correctQuery = "4 bhk in gift city gandhinagar";
    const correctResponse = await axios.post('http://localhost:4000/api/nl/search', {
      query: correctQuery
    });
    
    console.log(`\nQuery: "${correctQuery}"`);
    if (correctResponse.data.results && correctResponse.data.results.length > 0) {
      console.log(`✅ SUCCESS: Found ${correctResponse.data.results.length} results for correct city.`);
    } else {
      console.log("❌ ERROR: No results found for the correct city.");
    }

  } catch (error) {
    console.error("Verification failed:", error.message);
  }
}

verifyCityValidation();
