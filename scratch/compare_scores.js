import axios from 'axios';

async function compareQueries() {
  try {
    const queries = [
      "4 bhk in gandhinagar",
      "4 bhk in gift city gandhinagar"
    ];
    
    for (const query of queries) {
      console.log(`\n==========================================`);
      console.log(`QUERY: "${query}"`);
      const response = await axios.post('http://localhost:4000/api/nl/search', { query });
      
      if (response.data.results && response.data.results.length > 0) {
        const top = response.data.results[0];
        console.log(`Result: ${top.title}`);
        console.log(`Score: ${top.score * 100}%`);
        console.log(`Parsed AI:`, JSON.stringify(response.data.parsed, null, 2));
        console.log(`Score Details:`, JSON.stringify(top.scoreDetails, null, 2));
      } else {
        console.log("No results found.");
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Comparison failed:", error.message);
    process.exit(1);
  }
}

compareQueries();
