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
    console.log("Chat assistant function started");
    
    const { message, context, conversationHistory } = await req.json();
    console.log("Received message:", message);
    console.log("Context:", context);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not found");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are EGZIT's friendly and helpful AI moving assistant. You help users with their moving-related questions and provide excellent customer service.

Your key responsibilities:
- Answer questions about the moving process, packing tips, and logistics
- Help users understand their move status and next steps
- Provide helpful advice on preparing for a move
- Be empathetic and understanding about the stress of moving
- Keep responses concise but helpful (2-3 sentences usually)

Context about EGZIT:
- EGZIT is an AI-powered smart moving assistant app
- Users can catalog their inventory, get AI packing recommendations, find movers, and track their moves
- The platform connects users with verified moving companies in Jamaica
- Payment is made after the admin sends a quote

${context ? `Current context:\n${context}` : ''}

Be conversational, helpful, and proactive in offering assistance. If the user has questions you can't fully answer, suggest they contact support or check specific features in the app.`;

    // Build conversation messages
    const messages = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history if available
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: { role: string; content: string }) => {
        messages.push({ role: msg.role, content: msg.content });
      });
    }

    // Add current message
    messages.push({ role: "user", content: message });

    console.log("Calling Lovable AI gateway with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    console.log("AI gateway response status:", response.status);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            reply: "I'm a bit busy right now. Please try again in a moment!" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            reply: "Our AI service is temporarily unavailable. Please contact support for assistance." 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    console.log("AI response received:", reply?.substring(0, 100));

    if (!reply) {
      throw new Error("No content in AI response");
    }

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Chat assistant error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        reply: "Sorry, I'm having trouble thinking right now. Please try again or contact support if the issue persists.",
        error: message 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
