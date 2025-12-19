import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { sessionId, bookingId } = await req.json();
    logStep("Request payload", { sessionId, bookingId });

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { 
      status: session.payment_status, 
      customerId: session.customer,
      amountTotal: session.amount_total 
    });

    if (session.payment_status === 'paid') {
      // Update booking in database
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const bookingIdToUpdate = bookingId || session.metadata?.booking_id;
      
      if (bookingIdToUpdate) {
        const { error } = await supabaseAdmin
          .from('bookings')
          .update({ 
            payment_status: 'paid',
            payment_intent_id: session.payment_intent as string,
            status: 'confirmed'
          })
          .eq('id', bookingIdToUpdate);

        if (error) {
          logStep("Error updating booking", { error: error.message });
        } else {
          logStep("Booking updated to paid", { bookingId: bookingIdToUpdate });
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        paid: true,
        paymentIntent: session.payment_intent,
        amountPaid: session.amount_total 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      paid: false,
      status: session.payment_status 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
