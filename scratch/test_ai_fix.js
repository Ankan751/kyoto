import axios from 'axios';

async function testSearch() {
  try {
    const response = await axios.post('http://localhost:4000/api/nl/search', {
      query: "3 bhk in gandhinagar"
    });
    
    console.log("Search Result for '3 bhk in gandhinagar':");
    if (response.data.results && response.data.results.length > 0) {
      const firstResult = response.data.results[0];
      console.log(`- Title: ${firstResult.title}`);
      console.log(`- Score Details:`, JSON.stringify(firstResult.scoreDetails, null, 2));
      
      if (firstResult.scoreDetails.amenitiesSpecified) {
        console.log("❌ ERROR: amenitiesSpecified should be false for this query.");
      } else {
        console.log("✅ SUCCESS: amenitiesSpecified is false.");
      }
    } else {
      console.log("No results found to verify.");
    }

    const responseWithParking = await axios.post('http://localhost:4000/api/nl/search', {
      query: "3 bhk with parking"
    });
    
    console.log("\nSearch Result for '3 bhk with parking':");
    if (responseWithParking.data.results && responseWithParking.data.results.length > 0) {
      const firstResult = responseWithParking.data.results[0];
      console.log(`- Title: ${firstResult.title}`);
      console.log(`- Score Details:`, JSON.stringify(firstResult.scoreDetails, null, 2));
      
      if (firstResult.scoreDetails.amenitiesSpecified) {
        console.log("✅ SUCCESS: amenitiesSpecified is true.");
      } else {
        console.log("❌ ERROR: amenitiesSpecified should be true for this query.");
      }
    }

  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

testSearch();
