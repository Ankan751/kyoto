import axios from 'axios';

async function verifyRobustSearch() {
  try {
    console.log("Verifying GIFT City search robustness...");
    
    // Testing the problematic query
    const query = "4 bhk in gift city gandhinagar";
    const response = await axios.post('http://localhost:4000/api/nl/search', {
      query: query
    });
    
    console.log(`\nQuery: "${query}"`);
    console.log(`Success: ${response.data.success}`);
    console.log(`Parsed AI Result:`, JSON.stringify(response.data.parsed, null, 2));
    
    if (response.data.results && response.data.results.length > 0) {
      console.log(`✅ SUCCESS: Found ${response.data.results.length} results.`);
      const matches = response.data.results.filter(p => p.title.includes("Golden Horizon Villa"));
      if (matches.length > 0) {
        console.log("✅ CONFIRMED: 'The Golden Horizon Villa' is in the results.");
        console.log("   Match Score:", matches[0].score);
        console.log("   Match Details:", JSON.stringify(matches[0].scoreDetails, null, 2));
      } else {
        console.log("❌ ERROR: 'The Golden Horizon Villa' was not found in the results.");
      }
    } else {
      console.log("❌ ERROR: No results found for the query.");
    }

  } catch (error) {
    console.error("Verification failed:", error.message);
  }
}

verifyRobustSearch();
