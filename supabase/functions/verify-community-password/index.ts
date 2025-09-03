
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { password } = await req.json()

    if (!password) {
      throw new Error('Password is required')
    }

    console.log('Verifying community password...')

    // Get community password from settings
    const { data, error } = await supabaseClient
      .from('community_settings')
      .select('password')
      .eq('key', 'community_password')
      .maybeSingle()

    if (error) {
      console.error('Error fetching password:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // If no password is set in DB, fall back to environment variable
    let storedPassword = data?.password
    
    if (!storedPassword) {
      const envPassword = Deno.env.get('COMMUNITY_PASSWORD');
      if (envPassword) {
        storedPassword = envPassword;
        console.log('Using community password from environment variable.');
      } else {
        console.error('No community password found in database or environment variables.');
        return new Response(
          JSON.stringify({ error: 'Community password not configured.' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }
    
    const isValid = storedPassword === password

    console.log('Password verification result:', isValid)
    console.log('Stored password length:', storedPassword.length) // Log length instead of password
    console.log('Provided password length:', password.length)     // Log length instead of password

    return new Response(
      JSON.stringify({ valid: isValid }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
