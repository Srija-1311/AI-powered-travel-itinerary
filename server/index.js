import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';

const app = express();
const port = 3001;

// --- FIX: Dynamic CORS Configuration ---
// This tells our server to trust the URL we set in our environment variables
const corsOptions = {
  origin: process.env.FRONTEND_URL, // <-- Reads the new variable
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
// ----------------------------------------

app.use(express.json());

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// System prompt to instruct the AI
const systemPrompt = `
You are a master travel planner AI. A user will provide a destination, trip duration, budget, travel type, and interests.
Your task is to generate a detailed, day-by-day itinerary in a strict JSON format.

RULES:
1.  **JSON ONLY:** You MUST respond with ONLY the JSON object, starting with { and ending with }. Do not include any text before or after the JSON.
2.  **CURRENCY:** You MUST use the local currency for the destination provided. For example, if the destination is Tokyo, use JPY. If Hyderabad, use INR.
3.  **COSTS:** The "Hotel" cost must be separate from the "Estimated Cost" (which is for food/activities).
4.  **HOTEL LOGIC:** For each day, suggest a different hotel that is conveniently located for that day's "Morning" or "Afternoon" activity.
5.  **STRUCTURE:** Follow this exact JSON structure:
    {
      "Days": {
        "Day 1": {
          "Morning": { "Activity": "...", "Notes": "...", "Type": "..." },
          "Lunch": { "Restaurant": "...", "Cuisine": "...", "Price Range": "($/$$/$$$)" },
          "Afternoon": { "Activity": "...", "Notes": "...", "Type": "..." },
          "Dinner": { "Restaurant": "...", "Cuisine": "...", "Price Range": "($/$$/$$$)" },
          "Hotel": { "Name": "...", "Type": "(e.g., Hotel, Hostel, Ryokan)", "Cost": "..." },
          "Estimated Cost": "..."
        },
        "Day 2": { ... },
        ...
      }
    }
`;

// API Endpoint
app.post('/api/generate-itinerary', async (req, res) => {
  const { destination, days, budget, travelType, interests } = req.body;
  console.log('Received request with:', req.body);

  const userPrompt = `
    Destination: ${destination}
    Duration: ${days} days
    Budget: ${budget}
    Travel Type: ${travelType}
    Interests: ${interests.join(', ')}
  `;

  try {
    console.log('Calling Groq API...');
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.1-8b-instant",
    });

    let rawResponse = chatCompletion.choices[0]?.message?.content || "";
    console.log('Raw AI Response:', rawResponse);

    // --- More Robust JSON Parsing ---
    // 1. Find the first '{' and the last '}'
    const jsonStartIndex = rawResponse.indexOf('{');
    const jsonEndIndex = rawResponse.lastIndexOf('}');
    
    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
      throw new Error("AI did not return a valid JSON object.");
    }

    // 2. Extract the JSON string
    const jsonString = rawResponse.substring(jsonStartIndex, jsonEndIndex + 1);

    // 3. Parse the JSON
    let parsedJson;
    try {
      parsedJson = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI JSON response:", parseError);
      throw new Error("AI returned malformed JSON.");
    }
    // ---------------------------------

    const itinerary = parsedJson.Days;
    if (!itinerary) {
      throw new Error("AI response did not contain 'Days' key.");
    }

    // --- Total Cost Calculation ---
    let totalCostLow = 0;
    let totalCostHigh = 0;
    let currency = "USD"; // Default
    let allCurrenciesSame = true;
    let firstCurrency = null;

    Object.values(itinerary).forEach(day => {
      const costString = day["Estimated Cost"] || "0";
      const hotelCostString = day.Hotel?.Cost || "0";

      // --- FIX: Updated extractCost function ---
      const extractCost = (str) => {
        // Remove commas and find all numbers (including decimals)
        const matches = str.replace(/,/g, '').match(/([\d\.]+)/g); 
        const currencyMatch = str.match(/([A-Z]{3})/); // Find currency code
        
        let low = 0, high = 0;
        let ccy = currencyMatch ? currencyMatch[1] : null;

        if (matches) {
          if (matches.length > 1) {
            const num1 = parseFloat(matches[0]);
            const num2 = parseFloat(matches[1]);
            // Use Math.min and Math.max to find the true low and high
            low = Math.min(num1, num2);
            high = Math.max(num1, num2);
          } else if (matches.length === 1) {
            low = parseFloat(matches[0]);
            high = low; // If only one number, low and high are the same
          }
        }
        
        return { low, high, ccy };
      };
      // --- END FIX ---

      const dayCost = extractCost(costString);
      const hotelCost = extractCost(hotelCostString);

      if (dayCost.ccy) currency = dayCost.ccy;
      else if (hotelCost.ccy) currency = hotelCost.ccy;

      if (!firstCurrency && currency) firstCurrency = currency;
      if (currency && firstCurrency && currency !== firstCurrency) allCurrenciesSame = false;

      totalCostLow += dayCost.low + hotelCost.low;
      totalCostHigh += dayCost.high + hotelCost.high;
    });

    let totalCost;
    if (allCurrenciesSame) {
      // Format with toLocaleString to add commas back correctly
      totalCost = `${totalCostLow.toLocaleString()}-${totalCostHigh.toLocaleString()} ${firstCurrency || ''}`;
    } else {
      totalCost = "Multiple currencies detected. Check daily totals.";
    }
    // --------------------------------

    res.json({ itinerary, totalCost });
  } catch (err) {
    console.error('Error calling Groq API:', err);
    res.status(500).json({ error: err.message || "An internal server error occurred" });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);
});