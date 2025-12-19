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
    console.log("Packing assistant function started");
    
    const { items, action } = await req.json();
    console.log("Received request:", { itemCount: items?.length, action });
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not found");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "recommendations") {
      systemPrompt = `You are an expert packing assistant for moving. Analyze the provided inventory items and generate detailed packing recommendations.

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "categories": {
    "heavy": {
      "items": ["item names that are heavy"],
      "tips": ["specific tips for packing heavy items"],
      "boxType": "recommended box type and size"
    },
    "fragile": {
      "items": ["fragile item names"],
      "tips": ["tips for fragile items"],
      "boxType": "recommended box type"
    },
    "essentials": {
      "items": ["essential items to keep accessible"],
      "tips": ["tips for essentials"],
      "boxType": "recommended container"
    },
    "general": {
      "items": ["remaining items"],
      "tips": ["general packing tips"],
      "boxType": "standard box recommendation"
    }
  },
  "boxEstimate": {
    "small": { "count": 1, "dimensions": "12x12x12 inches", "forItems": "description" },
    "medium": { "count": 1, "dimensions": "18x18x16 inches", "forItems": "description" },
    "large": { "count": 1, "dimensions": "24x18x18 inches", "forItems": "description" },
    "wardrobe": { "count": 0, "dimensions": "24x24x40 inches", "forItems": "description" }
  },
  "packingOrder": ["Step 1: ...", "Step 2: ..."],
  "warnings": ["Any special warnings"]
}`;

      userPrompt = `Here are the inventory items to pack:\n${JSON.stringify(items, null, 2)}\n\nProvide comprehensive packing recommendations as JSON only.`;
    } else {
      systemPrompt = `You are a box sizing calculator. Return only valid JSON.`;
      userPrompt = `Calculate boxes for: ${JSON.stringify(items)}`;
    }

    console.log("Calling Lovable AI gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    console.log("AI gateway response status:", response.status);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    console.log("AI response received, content length:", content?.length);

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response - handle markdown code blocks
    let jsonStr = content;
    
    // Remove markdown code blocks if present
    if (jsonStr.includes("```json")) {
      jsonStr = jsonStr.replace(/```json\s*/g, "").replace(/```\s*/g, "");
    } else if (jsonStr.includes("```")) {
      jsonStr = jsonStr.replace(/```\s*/g, "");
    }
    
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not find JSON in response:", content.substring(0, 200));
      throw new Error("Could not parse AI response as JSON");
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log("Successfully parsed packing recommendations");

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Packing assistant error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
