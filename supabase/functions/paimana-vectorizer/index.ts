/**
 * PAIMANA Feature Engineering & Vectorization Engine (Edge Function)
 * Author: Adrian Roy Williams
 * Role: Intercepts raw MoSPI inserts, calculates proprietary risk vectors, 
 * calls the Python ML inference API, and writes the prediction back to Supabase.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const SEVERITY_COEFFICIENTS: Record<string, number> = {
    "land_acquisition_dispute": 1.5,
    "environmental_clearance": 1.2,
    "utility_shifting": 0.8,
    "design_revision": 0.5,
    "equipment_shortage": 0.4
};

const URGENCY_KEYWORDS = [
    { score: 1.0, words: ["protest", "court stay", "litigation", "halted", "strike"] },
    { score: 0.6, words: ["delayed", "waiting", "shortage", "pending"] },
    { score: 0.0, words: ["progressing", "resumed", "clear", "on track"] }
];

serve(async (req) => {
    try {
        // 1. Initialize Supabase Client with Service Role Key (bypasses RLS for backend writing)
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 2. Parse the Webhook Payload
        const payload = await req.json();
        const record = payload.record;

        const currentDate = new Date();
        const targetDate = new Date(record.clearance_target_date);
        
        // 3. Mathematical Vectorization
        const daysDelayed = Math.max(0, Math.floor((currentDate.getTime() - targetDate.getTime()) / (1000 * 3600 * 24)));
        const bottleneckType = record.primary_bottleneck || "none";
        const weight = SEVERITY_COEFFICIENTS[bottleneckType] || 0.1;
        const v_temporal = weight * daysDelayed;

        const budgetPct = record.financial_expenditure_pct || 0;
        const physicalPct = record.physical_progress_pct || 0.01;
        const v_burn_yield = budgetPct / physicalPct;

        const officerNotes = (record.nodal_officer_remarks || "").toLowerCase();
        let v_urgency = 0.0;
        for (const tier of URGENCY_KEYWORDS) {
            if (tier.words.some(word => officerNotes.includes(word))) {
                v_urgency = tier.score;
                break;
            }
        }

        const featureVector = [v_temporal, v_burn_yield, v_urgency, record.contractor_attrition_rate || 0];

        // 4. Transmit vectors to the Python ML API
        // ML_API_URL should be stored in your Supabase Edge Function environment variables
        const mlApiUrl = Deno.env.get('ML_API_URL') || 'http://your-fastapi-server.com/predict-risk';
        
        const mlResponse = await fetch(mlApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_id: record.id,
                vectorized_features: featureVector
            })
        });

        if (!mlResponse.ok) {
            throw new Error(`Python API Failed: ${mlResponse.statusText}`);
        }

        const riskData = await mlResponse.json();

        // 5. Write the ML output back to the Supabase database
        // Using 'upsert' ensures we update the existing project risk rather than creating duplicates
        const { error: dbError } = await supabase
            .from('project_risk_assessments')
            .upsert({
                project_id: riskData.project_id,
                ai_risk_score: riskData.analysis_summary.ai_risk_score,
                anomaly_score: riskData.analysis_summary.anomaly_score,
                render_status: riskData.visualization_input.render_status,
                cascading_delay_prediction: riskData.visualization_input.cascading_delay_prediction,
                last_updated: riskData.timestamp
            }, { onConflict: 'project_id' });

        if (dbError) throw dbError;

        return new Response(
            JSON.stringify({ success: true, processed_project: riskData.project_id }),
            { headers: { "Content-Type": "application/json" }, status: 200 }
        );

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
});
