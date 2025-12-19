import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Item {
  id: string;
  name: string;
  category: string | null;
  room: string | null;
  weight: number | null;
  fragile: boolean | null;
}

interface BoxSuggestion {
  boxName: string;
  boxSize: string;
  dimensions: string;
  maxWeight: number;
  items: Item[];
  totalWeight: number;
  isFragile: boolean;
  room: string;
  reasoning: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items } = await req.json();
    
    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No items provided', suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const itemsList = items.map((item: Item) => 
      `- ${item.name} (category: ${item.category || 'unknown'}, room: ${item.room || 'unknown'}, weight: ${item.weight || 'unknown'}lbs, fragile: ${item.fragile ? 'yes' : 'no'})`
    ).join('\n');

    const systemPrompt = `You are a professional moving organizer AI. Your job is to analyze items and suggest optimal box groupings for moving.

Box size guidelines:
- Small (16x12x12 inches): Up to 30 lbs, good for books, small items, heavy dense items
- Medium (18x18x16 inches): Up to 50 lbs, good for kitchen items, toys, clothes
- Large (24x18x18 inches): Up to 65 lbs, good for linens, pillows, large soft items
- Extra-Large (24x20x20 inches): Up to 70 lbs, good for bulky lightweight items, bedding

Rules:
1. Group items by room when possible
2. Never mix fragile with non-fragile items
3. Don't exceed weight limits
4. Keep similar categories together
5. Suggest practical groupings that make unpacking easier

Return a JSON array of box suggestions. Each suggestion should have:
- boxName: descriptive name like "Kitchen Fragile Items" or "Bedroom Linens"
- boxSize: "small", "medium", "large", or "extra-large"
- dimensions: the dimensions string
- maxWeight: the max weight for that box size
- itemIds: array of item IDs that go in this box
- totalWeight: estimated total weight
- isFragile: true if box contains fragile items
- room: primary room these items are from
- reasoning: brief explanation of why these items are grouped together`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please analyze these items and suggest optimal box groupings:\n\n${itemsList}\n\nItem IDs for reference:\n${items.map((item: Item) => `${item.name}: ${item.id}`).join('\n')}\n\nRespond with ONLY a valid JSON array of box suggestions, no markdown or explanation.` }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    
    // Parse the JSON response
    let suggestions: BoxSuggestion[] = [];
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      
      suggestions = JSON.parse(cleanContent.trim());
      
      // Map itemIds back to full item objects
      suggestions = suggestions.map((suggestion: any) => ({
        ...suggestion,
        items: (suggestion.itemIds || []).map((id: string) => 
          items.find((item: Item) => item.id === id)
        ).filter(Boolean)
      }));
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', content, parseError);
      // Return a basic grouping by room as fallback
      const roomGroups = new Map<string, Item[]>();
      items.forEach((item: Item) => {
        const room = item.room || 'General';
        if (!roomGroups.has(room)) {
          roomGroups.set(room, []);
        }
        roomGroups.get(room)!.push(item);
      });
      
      suggestions = Array.from(roomGroups.entries()).map(([room, roomItems]) => ({
        boxName: `${room} Items`,
        boxSize: 'medium',
        dimensions: '18x18x16 inches',
        maxWeight: 50,
        items: roomItems,
        totalWeight: roomItems.reduce((sum, item) => sum + (item.weight || 2), 0),
        isFragile: roomItems.some(item => item.fragile),
        room,
        reasoning: `Items grouped by room: ${room}`
      }));
    }

    console.log(`Generated ${suggestions.length} box suggestions for ${items.length} items`);

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-boxes function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
