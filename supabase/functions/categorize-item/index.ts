import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Categorize item function started");
    const { imageData, multiItem } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!imageData) {
      console.error("No image data provided");
      throw new Error("No image data provided");
    }

    console.log("Calling AI gateway, multiItem:", multiItem);

    const systemPrompt = multiItem 
      ? `You are an AI assistant that helps categorize household items for a moving inventory app. 
         Analyze the image and identify ALL visible items that would be relevant for a moving inventory.
         For each item, provide:
         1. A concise, descriptive name for the item (2-5 words)
         2. A category from: Furniture, Electronics, Kitchen, Bedroom, Bathroom, Decor, Books & Media, Clothing, Tools, Sports & Outdoors, Office, Kids & Toys, Garden, Storage, Miscellaneous
         3. The room where this item typically belongs: Living Room, Bedroom, Kitchen, Bathroom, Dining Room, Office, Garage, Basement, Attic, Outdoor, Closet, Laundry Room
         4. Estimated weight in pounds (lbs) as a number
         5. Whether the item is fragile (true/false)
         6. Confidence score from 0.0 to 1.0
         
         Respond in JSON format only with an items array:
         {"items": [{"name": "Item Name", "category": "Category", "room": "Room", "weight": 10, "fragile": false, "confidence": 0.95}]}`
      : `You are an AI assistant that helps categorize household items for a moving inventory app. 
         Analyze the image and provide:
         1. A concise, descriptive name for the item (2-5 words)
         2. A category from: Furniture, Electronics, Kitchen, Bedroom, Bathroom, Decor, Books & Media, Clothing, Tools, Sports & Outdoors, Office, Kids & Toys, Garden, Storage, Miscellaneous
         3. The room where this item typically belongs: Living Room, Bedroom, Kitchen, Bathroom, Dining Room, Office, Garage, Basement, Attic, Outdoor, Closet, Laundry Room
         4. Estimated weight in pounds (lbs) as a number
         5. Whether the item is fragile (true/false)
         
         Respond in JSON format only: {"name": "Item Name", "category": "Category", "room": "Room", "weight": 10, "fragile": false}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: multiItem 
                  ? "Please identify ALL items visible in this image for a moving inventory."
                  : "Please identify this item and suggest a category for moving inventory purposes."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    console.log("AI gateway response status:", response.status);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later.", items: [] }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add funds.", items: [] }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";
    console.log("AI response content:", content.substring(0, 200));
    
    // Parse JSON from response - remove markdown code blocks if present
    let jsonStr = content;
    if (jsonStr.includes("```json")) {
      jsonStr = jsonStr.replace(/```json\s*/g, "").replace(/```\s*/g, "");
    } else if (jsonStr.includes("```")) {
      jsonStr = jsonStr.replace(/```\s*/g, "");
    }
    
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("Could not find JSON in response:", content.substring(0, 200));
      return new Response(
        JSON.stringify({ error: "Could not parse AI response", items: [] }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log("Parsed result:", JSON.stringify(parsed).substring(0, 200));
      
      // Return in format expected by CVScanner
      if (multiItem && parsed.items && Array.isArray(parsed.items)) {
        return new Response(
          JSON.stringify({ items: parsed.items }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else if (parsed.name) {
        // Single item response - wrap in items array for consistency
        const item = {
          name: parsed.name || "",
          category: parsed.category || "",
          room: parsed.room || "",
          weight: typeof parsed.weight === 'number' ? parsed.weight : null,
          fragile: parsed.fragile === true,
          confidence: parsed.confidence || 0.9
        };
        return new Response(
          JSON.stringify(multiItem ? { items: [item] } : item),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        console.error("Unexpected response format:", parsed);
        return new Response(
          JSON.stringify({ error: "Unexpected response format", items: [] }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, content.substring(0, 200));
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", items: [] }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Categorize error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", items: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
