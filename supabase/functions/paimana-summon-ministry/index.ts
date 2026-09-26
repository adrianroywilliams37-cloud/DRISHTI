/**
 * PAIMANA Apex Escalation Engine (Edge Function)
 * Author: Adrian Roy Williams
 * Role: Receives PMG override commands, fetches project telemetry, 
 * dispatches official email summons via Resend API, and updates the audit ledger.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

// Standard CORS headers for frontend invocation
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { project_id } = await req.json();

        // 1. Initialize Supabase Client using the user's Auth context
        // This ensures the person calling this function is actually logged in.
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // 2. Fetch Project & Ministry Details
        const { data: project, error: dbError } = await supabaseClient
            .from('project_risk_assessments')
            .select('project_name, ministry_name, anomaly_score, cascading_delay_prediction, nodal_officer_email')
            .eq('project_id', project_id)
            .single();

        if (dbError || !project) throw new Error("Project data not found or unauthorized access.");

        // 3. Construct the Official Summons Payload
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ccc;">
                <h2 style="color: #dc2626;">URGENT: PMG Intervention Required</h2>
                <p><strong>To:</strong> Nodal Officer, ${project.ministry_name}</p>
                <p><strong>Subject:</strong> Immediate review summoned for <strong>${project.project_name}</strong> (ID: ${project_id})</p>
                <hr />
                <p>The PAIMANA Predictive Engine has flagged this asset with a Critical Risk Score (${project.anomaly_score.toFixed(3)}).</p>
                <p><strong>AI Forecast:</strong> ${project.cascading_delay_prediction}</p>
                <p>You are hereby summoned to provide an expedited mitigation report to the Cabinet Secretariat within 48 hours.</p>
                <p><em>This is an automated dispatch from the PAIMANA Infrastructure Framework.</em></p>
            </div>
        `;

        // 4. Dispatch the Email via Resend REST API
        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'PAIMANA Command <alerts@paimana-gov.in>', // Use your verified domain
                to: [project.nodal_officer_email || 'test-nodal@example.com'],
                subject: `PMG SUMMONS: ${project.project_name} Critical Variance`,
                html: emailHtml
            })
        });

        if (!emailResponse.ok) throw new Error("Failed to dispatch official summons.");

        // 5. Update the Audit Ledger (Supabase Service Key needed to bypass RLS for system logs)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await supabaseAdmin.from('inter_departmental_ledger').insert({
            project_id: project_id,
            action_type: 'MINISTRY_SUMMONED',
            initiated_by: 'PMG_APEX_NODE',
            timestamp: new Date().toISOString(),
            notes: `Automated summons dispatched to ${project.ministry_name} regarding Critical AI Risk Score.`
        });

        return new Response(
            JSON.stringify({ success: true, message: "Summons dispatched and logged." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { 
            headers: { ...corsHeaders, "Content-Type": "application/json" }, 
            status: 400 
        });
    }
});
