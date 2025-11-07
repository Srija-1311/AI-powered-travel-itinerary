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

// --- Helper function to extract JSON from AI response ---
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
    - "Lunch": An object with "Restaurant", "Cuisine", and "Price Range" (e.g., "₹", "₹₹", "₹₹₹" or "$", "$$", "$$$").
    - "Afternoon": An object with "Activity", "Notes", and "Type".
    - "Dinner": An object with "Restaurant", "Cuisine", and "Price Range".
    - **NEW:** "Hotel": An object with:
        - "Name": A top-rated hotel.
        - "Type": (e.g., "Hotel", "Boutique", "Staycation").
        - "Cost": The estimated cost for one night (e.g., "3000-4000 INR").
    - "Estimated Cost": A string representing the estimated cost for the day's Food & Activities.
6.  **CRITICAL RULE (HOTEL):** The "Hotel" MUST be geographically convenient for the day's activities (especially the afternoon/evening ones).
7.  **CRITICAL RULE (CURRENCY):** You MUST use the local currency for the provided \`${destination}\`. (e.g., "INR" for India, "EUR" for France).
8.  **CRITICAL RULE (COST):** The "Estimated Cost" for the day MUST include the cost of Lunch, Dinner, and Activities. **It MUST NOT include the Hotel cost.** The "Hotel" cost must be separate in the "Hotel" object.
9.  Wrap your entire response in a single JSON object. Do not add any text before or after the JSON.

Example Output Structure:
{
  "Days": {
    "Day 1": {
      "Morning": { "Activity": "Explore...", "Notes": "Get tickets...", "Type": "Museum" },
      "Lunch": { "Restaurant": "Local Cafe", "Cuisine": "Local", "Price Range": "₹₹" },
      "Afternoon": { "Activity": "Visit...", "Notes": "Walk...", "Type": "Park" },
      "Dinner": { "Restaurant": "Nice Restaurant", "Cuisine": "Indian", "Price Range": "₹₹₹" },
      "Hotel": { "Name": "Grand Hotel", "Type": "Hotel", "Cost": "4000-5000 INR" },
      "Estimated Cost": "3000-5000 INR"
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
      model: 'llama-3.1-8b-instant',
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content;
    console.log('Raw AI Response:', aiResponse);

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // --- Use the robust JSON extractor ---
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

    // --- Calculate Total Cost (NEW LOGIC) ---
    let totalCostLow = 0;
    let totalCostHigh = 0;
    let currency = ''; // Will be set from the first day's cost

    try {
      Object.values(itineraryData).forEach((day, index) => {
        // Get Food/Activity Cost
        const costString = day["Estimated Cost"] || "0 N/A";
        const costParts = costString.split(' ');
        const costRange = (costParts[0] || "0").split('-');
        
        // Get Hotel Cost
        const hotelCostString = day.Hotel?.Cost || "0 N/A";
        const hotelCostParts = hotelCostString.split(' ');
        const hotelCostRange = (hotelCostParts[0] || "0").split('-');

        if (index === 0) { // Set currency based on the first day
          currency = costParts[1] || hotelCostParts[1] || 'N/A';
        }
        
        // --- Calculate Daily Low End ---
        const dailyLow = (parseInt(costRange[0], 10) || 0) + (parseInt(hotelCostRange[0], 10) || 0);
        totalCostLow += dailyLow;

        // --- Calculate Daily High End ---
        const dailyHigh = 
          (parseInt(costRange[1], 10) || parseInt(costRange[0], 10) || 0) + 
          (parseInt(hotelCostRange[1], 10) || parseInt(hotelCostRange[0], 10) || 0);
        totalCostHigh += dailyHigh;
      });
    } catch (calcError) {
      console.error("Error calculating total cost:", calcError);
      totalCostLow = 0;
      totalCostHigh = 0;
      currency = 'Error';
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