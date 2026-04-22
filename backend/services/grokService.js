import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * Parses natural language input into a structured search object using Groq (Llama 3).
 * @param {string} input - Natural language query from the user.
 * @returns {Promise<Object>} - Structured search parameters.
 */
export const parseWithGrok = async (input) => {
    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ_API_KEY is not configured in environment variables');
        }

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are a real estate search assistant. Parse the user's natural language query into a structured JSON format.
                        
                        The output MUST be a JSON object with this exact structure:
                        {
                          "city": "String (required)",
                          "locality": "String (optional)",
                          "bhk": {
                            "preferred": [Number],
                            "flexible": Boolean
                          },
                          "budget": {
                            "max": Number (in numeric units)
                          },
                          "type": "String (e.g. flat, house, villa)",
                          "amenities": [String],
                          "derived_preferences": {
                            "transport_access": Boolean,
                            "school_nearby": Boolean,
                            "premium_locality": Boolean
                          }
                        }

                        Examples:
                        - "3 bhk in model town under 40 lakh near bus stand" -> {"city": "Jalandhar", "locality": "Model Town", "bhk": {"preferred": [3], "flexible": false}, "budget": {"max": 4000000}, "amenities": [], "derived_preferences": {"transport_access": true}}
                        
                        If city is not mentioned, infer it if possible or leave empty. 
                        Ensure city and locality are clean property names (e.g., "Gandhinagar" instead of "G Gandhinagar"). 
                        If the user mentions a specific sub-area like "GIFT City," put it in locality.
                        Always return ONLY the JSON object.`
                    },
                    {
                        role: 'user',
                        content: input
                    }
                ],
                temperature: 0,
                response_format: { type: 'json_object' }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        const content = response.data.choices[0].message.content;
        return JSON.parse(content);
    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        logger.error('Groq API Error:', { error: errorMsg, input });

        if (error.response?.status === 403 || error.response?.status === 401) {
            throw new Error('AI Search temporarily unavailable due to API limits or invalid key. Please check your Groq API status.');
        }

        // Simple fallback parsing for basic queries if AI fails
        logger.info('Using fallback regex parsing for query');
        const fallback = {
            city: "Jalandhar",
            locality: "",
            bhk: { preferred: [2], flexible: true },
            budget: { max: 5000000 },
            amenities: [],
            derived_preferences: {}
        };

        const bhkMatch = input.match(/(\d)\s*bhk/i);
        if (bhkMatch) fallback.bhk.preferred = [parseInt(bhkMatch[1])];

        const budgetMatch = input.match(/under\s*(\d+)\s*(lakh|cr)/i);
        if (budgetMatch) {
            const val = parseInt(budgetMatch[1]);
            fallback.budget.max = budgetMatch[2].toLowerCase() === 'cr' ? val * 10000000 : val * 100000;
        }

        return fallback;
    }
};

/**
 * Enhances a property description to be more formal and professional.
 * @param {string} description - The raw description.
 * @returns {Promise<string>} - Enhanced description.
 */
export const enhanceDescription = async (description) => {
    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) throw new Error('GROQ_API_KEY not configured');

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional real estate copywriter. Enhance the following property description to make it more formal, professional, and appealing to high-end buyers. Keep the core facts (BHK, price, location) identical but improve the basic vocabulary and flow upto 100 words. Return ONLY the enhanced text. '
                    },
                    {
                        role: 'user',
                        content: description
                    }
                ],
                temperature: 0.7
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        logger.error('Description Enhancement Error:', error.message);
        throw new Error('Failed to enhance description. Please try again later.');
    }
};
