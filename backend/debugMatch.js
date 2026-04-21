
import dotenv from 'dotenv';
dotenv.config();

import { parseWithGrok } from './services/grokService.js';
import { validate, calculateScore } from './controller/nlSearchController.js';

const testQuery = "3 bhk property in Model Town";

async function runDebug() {
    console.log("Input Query:", testQuery);
    
    try {
        const parsed = await parseWithGrok(testQuery);
        console.log("AI Parsed:", JSON.stringify(parsed, null, 2));
        
        const mockProperty = {
            title: "Test Villa in Model Town",
            city: "Jalandhar",
            locality: "Model Town",
            price: 5000000,
            bhk: 3,
            type: "Villa",
            amenities: ["parking", "gym"]
        };

        const userRequirements = validate(parsed, testQuery, mockProperty);
        console.log("Validated Requirements (with context):", JSON.stringify(userRequirements, null, 2));
        
        const score = calculateScore(mockProperty, userRequirements);
        console.log("Mock Property:", mockProperty.title);
        console.log("Calculated Score:", score.total * 100 + "%");
        console.log("Score Details:", score.details);
        
    } catch (error) {
        console.error("DEBUG ERROR:", error);
    }
}

runDebug();
