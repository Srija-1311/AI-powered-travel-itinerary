import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

// Load environment variables
dotenv.config();

const app = express();
const port = 3001;

// --- Groq Client ---
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.use(cors());
app.use(express.json());

// --- NEW: Helper function to extract JSON from AI response ---
function extractJSON(text) {
  // Find the first '{' and the last '}'
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  // Fallback for ```json ... ```
  const markdownMatch = text.match(/```json\n([\s\S]*?)\n```/);
  if (markdownMatch && markdownMatch[1]) {
    return markdownMatch[1];
  }
  return null; // No JSON found
}


// --- API Endpoint ---
app.post('/api/generate-itinerary', async (req, res) => {
  try {
    const { destination, days, budget, travelType, interests } = req.body;
    console.log('Received request with:', req.body);

    const interestsString = interests.join(', ');

    // --- System Prompt ---
    const systemPrompt = `You are a world-class travel planner. Your job is to create a personalized, day-by-day travel itinerary based on user preferences.

You MUST follow these rules:
1.  You will receive a destination, number of days, budget, travel type, and interests.
2.  Your response MUST be a single, valid JSON object.
3.  The JSON object must have a key "Days" which itself is an object.
4.  The "Days" object will contain keys like "Day 1", "Day 2", etc.
5.  Each "Day" object must contain:
    - "Morning": An object with "Activity", "Notes", and "Type" (e.g., "Historic Site", "Food Tour", "Museum").
    - "Lunch": An object with "Restaurant", "Cuisine", and "Price Range" (e.g., "$", "$$", "$$$").
    - "Afternoon": An object with "Activity", "Notes", and "Type".
    - "Dinner": An object with "Restaurant", "Cuisine", and "Price Range".
    - "Estimated Cost": A string representing the estimated cost for that day (e.g., "100-150 USD").
6.  Wrap your entire response in a single JSON object. Do not add any text before or after the JSON.

Example Output Structure:
{
  "Days": {
    "Day 1": {
      "Morning": { "Activity": "Explore...", "Notes": "Get tickets...", "Type": "Museum" },
      "Lunch": { "Restaurant": "Local Cafe", "Cuisine": "Local", "Price Range": "$$" },
      "Afternoon": { "Activity": "Visit...", "Notes": "Walk...", "Type": "Park" },
      "Dinner": { "Restaurant": "Nice Restaurant", "Cuisine": "Italian", "Price Range": "$$$" },
      "Estimated Cost": "120-170 USD"
    }
  }
}`;

    // --- User Prompt ---
    const userPrompt = `Generate a ${days}-day itinerary for a trip to ${destination}.
-   Budget: ${budget}
-   Travel Type: ${travelType}
-   Interests: ${interestsString}
`;

    console.log('Calling Groq API...');
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.1-8b-instant', // Updated model
      // --- REMOVED: response_format to allow for more flexible parsing ---
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content;
    console.log('Raw AI Response:', aiResponse);

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // --- NEW: Use the robust JSON extractor ---
    const jsonString = extractJSON(aiResponse);
    if (!jsonString) {
      console.error("Failed to extract JSON from response:", aiResponse);
      throw new Error('AI response was not in the expected format (no JSON found).');
    }

    const parsedData = JSON.parse(jsonString);
    const itineraryData = parsedData.Days;

    if (!itineraryData) {
      throw new Error('AI response was not in the expected format (no "Days" key).');
    }

    // --- NEW: Calculate Total Cost ---
    let totalCostLow = 0;
    let totalCostHigh = 0;
    let currency = 'USD'; // Default currency

    try {
      Object.values(itineraryData).forEach(day => {
        const costString = day["Estimated Cost"]; // e.g., "100-150 USD"
        const parts = costString.split(' '); // ["100-150", "USD"]
        
        if (parts.length >= 1) { // More robust check
          currency = parts[1] || 'USD'; // Handle missing currency
          const range = parts[0].split('-'); // ["100", "150"]
          
          if (range.length === 2) {
            totalCostLow += parseInt(range[0], 10) || 0;
            totalCostHigh += parseInt(range[1], 10) || 0;
          } else if (range.length === 1) {
            const cost = parseInt(range[0], 10) || 0;
            totalCostLow += cost;
            totalCostHigh += cost;
          }
        }
      });
    } catch (calcError) {
      console.error("Error calculating total cost:", calcError);
      // Don't fail the request, just send 0
      totalCostLow = 0;
      totalCostHigh = 0;
    }

    const totalCostString = totalCostLow === totalCostHigh 
      ? `${totalCostLow} ${currency}` 
      : `${totalCostLow}-${totalCostHigh} ${currency}`;

    // Send itinerary and total cost to the frontend
    res.json({
      itinerary: itineraryData,
      totalCost: totalCostString
    });

  } catch (error) {
    console.error('Error calling Groq API:', error);
    let errorMessage = 'Failed to generate itinerary. Please try again.';
    
    if (error.status === 400) {
      errorMessage = 'The AI model failed to generate a valid response. Please try again.';
    } else if (error.status === 401) {
      errorMessage = 'Invalid API Key. Please check your .env file.';
    }

    res.status(500).json({ error: errorMessage });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
