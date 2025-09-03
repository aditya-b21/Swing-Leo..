import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { submission_id, user_email, user_id, status } = await req.json();

    if (!submission_id || !user_email || !user_id || !status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Update payment status
    const { error: paymentError } = await supabaseClient
      .from("payment_submissions")
      .update({ status, verified_at: new Date().toISOString() })
      .eq("id", submission_id);

    if (paymentError) {
      return new Response(
        JSON.stringify({ error: paymentError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Grant community posting access
    await supabaseClient
      .from("community_posters")
      .upsert({ email: user_email, can_post: true });

    // 3. Grant scanner access (mark as verified)
    await supabaseClient
      .from("scanner_access_requests")
      .upsert({ user_email: user_email, is_verified: true });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}); 