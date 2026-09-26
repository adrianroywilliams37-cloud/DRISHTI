/**
 * PAIMANA PFMS Override Engine (Edge Function)
 * Author: Adrian Roy Williams
 * Role: Verifies PMG cryptographic signatures and writes the override 
 * command to the Immutable Ledger, unfreezing the PFMS Gateway.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { project_id, auth_pin } = await req.json();

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        
        // 1. Verify the User's Session
        const authHeader = req.headers.get('Authorization')!;
        const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', { 
            global: { headers: { Authorization: authHeader } } 
        });
        
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) throw new Error("Unauthorized");

        // 2. Cryptographic Hardware Token Verification (Simulated for SIH Prototype)
        // In production: ping an external HSM (Hardware Security Module) or e-Pramaan API.
        // The PIN is validated server-side to prevent client-side bypass.
        const isValidPin = auth_pin === "782049"; // Mock static PIN for prototype demonstration
        if (!isValidPin) throw new Error("Cryptographic signature invalid.");

        // 3. Initialize Admin Client to bypass RLS for Ledger Writing
        const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

        // 4. Update the Immutable Ledger
        // This is the critical step. The Python PFMS Gateway reads the LAST action on this ledger.
        // By appending PMG_OVERRIDE_EXECUTED, we clear the 'GROUND_ORBIT_DISCREPANCY_FLAGGED' blocker.
        const { error: ledgerError } = await supabaseAdmin
            .from('inter_departmental_ledger')
            .insert({
                project_id: project_id,
                action_type: 'PMG_OVERRIDE_EXECUTED',
                initiated_by: `PMG_OFFICIAL_${user.id.substring(0,6).toUpperCase()}`,
                timestamp: new Date().toISOString(),
                notes: "Cryptographic authorization verified. PFMS tranche release explicitly authorized by PMG."
            });

        if (ledgerError) throw ledgerError;

        // 5. Downgrade AI Risk Score
        // Move the project out of the Critical queue so it vanishes from the PMG inbox
        await supabaseAdmin
            .from('project_risk_assessments')
            .update({ 
                ai_risk_score: 'Moderate', 
                render_status: 'Amber',
                cascading_delay_prediction: "Clearance override granted. Awaiting physical progress update."
            })
            .eq('project_id', project_id);

        return new Response(
            JSON.stringify({ success: true, message: "PFMS Gateway Unlocked." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }), 
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
    }
});
