import React from "react";
import {
  BookOpen,
  Database,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Sparkles,
} from "lucide-react";

export const DocsTab: React.FC = () => {
  return (
    <div className="space-y-6 pb-12 text-ink">
      {/* Header */}
      <div className="bg-paper border border-ink/15 rounded-sm p-5 ">
        <div className="flex items-center gap-2 text-xs font-semibold text-teal mb-1">
          <BookOpen className="w-4 h-4" />
          Technical Reference & Data Governance
        </div>
        <h2 className="text-xl font-bold text-ink ">
          System Architecture, Data Model & Methodology Documentation
        </h2>
        <p className="text-xs text-ink/45 mt-0.5">
          Mathematical formulations, feature definitions, and operational assumptions governing the Drishti Early-Warning Platform.
        </p>
      </div>

      {/* Synthetic Data Disclaimer Callout */}
      <div className="p-4 rounded-sm bg-amber-950/40 border border-amber-800/80 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-mahogany shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-amber-200">
          <strong className="text-ink font-semibold">Data Provenance & DRISHTI Transition Notice:</strong> The current project portfolio comprises 35 realistic, carefully calibrated Central Sector infrastructure records (&gt;₹150 Cr) across NHAI, Indian Railways, NTPC, BSNL, and AIIMS. While names, states, outlays, and execution hurdles reflect real-world Indian infrastructure cases, the data is <strong className="text-ink">synthetic and illustrative pending direct API integration with the MoSPI DRISHTI production servers</strong>. When DRISHTI credentials are authenticated, the in-browser statistical engine and CSV ingestion pipeline directly accept official Common Upload Form (CUF) streams with zero re-architecture required.
        </div>
      </div>

      {/* Section 1: Data Model & Proposed Non-CUF Variables */}
      <div className="bg-paper border border-ink/15 rounded-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-teal" />
          <h3 className="text-sm font-bold text-ink ">
            1. Data Model: Official CUF vs. Proposed Non-CUF Extension
          </h3>
        </div>
        <p className="text-xs text-ink-70 leading-relaxed mb-4">
          The official Common Upload Form (CUF) collects foundational project accounting fields but omits critical operational friction variables that drive cost and schedule variance. Drishti introduces three non-CUF variables to bridge this predictive gap:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-paper p-4 rounded-sm border border-ink/15">
            <h4 className="text-xs font-semibold text-ink-70 mb-2 flex items-center justify-between">
              <span>Standard CUF Fields Captured</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-paper-raised text-ink/45">Current MoSPI Standard</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-ink/45 font-mono">
              <li>• <strong className="text-ink">id</strong>: Unique Central Sector project code</li>
              <li>• <strong className="text-ink">sanctioned_cost_cr</strong>: Original approved outlay (₹ Cr)</li>
              <li>• <strong className="text-ink">latest_revised_cost_cr</strong>: Current approved revised cost (₹ Cr)</li>
              <li>• <strong className="text-ink">sanction_date / original_completion_date</strong>: Project window</li>
              <li>• <strong className="text-ink">revised_completion_date</strong>: Updated commissioning milestone</li>
              <li>• <strong className="text-ink">physical_progress_pct</strong>: On-site physical completion (0-100%)</li>
              <li>• <strong className="text-ink">financial_progress_pct</strong>: Outlay expenditure disbursed (0-100%)</li>
              <li>• <strong className="text-ink">progress_history</strong>: Monthly physical & financial reporting cycle</li>
            </ul>
          </div>

          <div className="bg-paper p-4 rounded-sm border border-teal-900/60">
            <h4 className="text-xs font-semibold text-teal mb-2 flex items-center justify-between">
              <span>Proposed Non-CUF Variables</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-teal-950 text-teal border border-teal-800">MoSPI Innovation</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-ink-70">
              <li>
                <span className="font-mono text-teal font-semibold">contractor_track_record_score</span> (0–100):
                <p className="text-[11px] text-ink/45 mt-0.5">Historical contractor delivery rating based on past contractual defaults, dispute records, and milestone timeliness across central tenders.</p>
              </li>
              <li>
                <span className="font-mono text-teal font-semibold">land_acquisition_delay_flag</span> (Boolean):
                <p className="text-[11px] text-ink/45 mt-0.5">Flags pending Right-of-Way (ROW), forest clearance, or court stay orders that stall linear construction progress.</p>
              </li>
              <li>
                <span className="font-mono text-teal font-semibold">monsoon_disruption_index</span> (0–100):
                <p className="text-[11px] text-ink/45 mt-0.5">Regional meteorological vulnerability score quantifying annual working-window reduction due to heavy rainfall, floods, or landslides.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 2: Mathematical Formulations */}
      <div className="bg-paper border border-ink/15 rounded-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-4 h-4 text-teal" />
          <h3 className="text-sm font-bold text-ink ">
            2. Mathematical Formulations & Rule-Based Scoring
          </h3>
        </div>

        <div className="space-y-4 text-xs text-ink-70">
          {/* Formula 1: Risk Engine */}
          <div className="p-4 bg-paper rounded-sm border border-ink/15">
            <div className="font-semibold text-ink mb-1.5 flex items-center justify-between">
              <span>Composite Project Early-Warning Risk Score (Explainable Rule)</span>
              <span className="text-[11px] text-teal font-mono">100% Auditable</span>
            </div>
            <div className="p-3 bg-paper rounded font-mono text-teal text-xs my-2 overflow-x-auto">
              Risk Score = 0.35 × CostScore + 0.35 × SlipScore + 0.15 × StagnancyFlag + 0.15 × MismatchFlag
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-ink/45 mt-2">
              <div>• <strong className="text-ink-70">CostScore</strong>: Min(100, (CostOverrun% / 50) × 100) [Weight: 35%]</div>
              <div>• <strong className="text-ink-70">SlipScore</strong>: Min(100, (SlipMonths / 36) × 100) [Weight: 35%]</div>
              <div>• <strong className="text-ink-70">StagnancyFlag</strong>: 100 if physical progress delta = 0 in 2 consecutive cycles, else 0 [Weight: 15%]</div>
              <div>• <strong className="text-ink-70">MismatchFlag</strong>: 100 if Financial Progress - Physical Progress &gt; 15%, else 0 [Weight: 15%]</div>
            </div>
          </div>

          {/* Formula 2: OLS Multiple Regression */}
          <div className="p-4 bg-paper rounded-sm border border-ink/15">
            <div className="font-semibold text-ink mb-1.5 flex items-center justify-between">
              <span>Predictive Engine: Ordinary Least Squares (OLS) with L2 Regularization</span>
              <span className="text-[11px] text-mahogany font-mono">In-Browser Linear Algebra</span>
            </div>
            <p className="text-ink/45 mb-2">
              The model solves for optimal weight vector β using the regularized normal equation with Gaussian elimination and partial pivoting:
            </p>
            <div className="p-3 bg-paper rounded font-mono text-mahogany text-xs my-2 overflow-x-auto">
              β = (X^T X + λ I)^(-1) X^T y , where λ = 0.05 (L2 Ridge Penalty)
            </div>
            <p className="text-[11px] text-ink/45">
              Features are standardized with mean zero and unit variance (Z-score normalization) prior to inversion, ensuring numerical stability regardless of feature scales (e.g. ₹ Cr vs %).
            </p>
          </div>

          {/* Formula 3: Metric Formulations */}
          <div className="p-4 bg-paper rounded-sm border border-ink/15">
            <div className="font-semibold text-ink mb-1.5">
              Evaluation Metrics Formulations
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-ink/45 font-mono">
              <div className="bg-paper p-2 rounded">
                <div className="text-ink font-semibold mb-0.5">MAE (Mean Absolute Error):</div>
                (1/n) × Σ |y_i - ŷ_i|
              </div>
              <div className="bg-paper p-2 rounded">
                <div className="text-ink font-semibold mb-0.5">RMSE (Root Mean Square):</div>
                √[ (1/n) × Σ (y_i - ŷ_i)² ]
              </div>
              <div className="bg-paper p-2 rounded">
                <div className="text-ink font-semibold mb-0.5">R² (Variance Explained):</div>
                1 - [ Σ (y_i - ŷ_i)² / Σ (y_i - ȳ)² ]
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Dual Models Architecture */}
      <div className="bg-paper border border-ink/15 rounded-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-teal" />
          <h3 className="text-sm font-bold text-ink ">
            3. Model Architecture & Feature Encodings
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-paper p-4 rounded-sm border border-ink/15">
            <div className="font-semibold text-ink mb-2 flex items-center justify-between">
              <span>Baseline Model (Bivariate)</span>
              <span className="text-[10px] text-ink/45">2 Features</span>
            </div>
            <p className="text-ink/45 mb-2">
              Designed as a benchmark representing current heuristic projection techniques:
            </p>
            <ul className="space-y-1 text-[11px] text-ink/45 font-mono">
              <li>1. <span className="text-ink">elapsed_time_pct</span>: (Current - Sanction) / (Original - Sanction)</li>
              <li>2. <span className="text-ink">sanctioned_cost_cr</span>: Raw project capital outlay</li>
            </ul>
          </div>

          <div className="bg-paper p-4 rounded-sm border border-teal-900/60">
            <div className="font-semibold text-teal mb-2 flex items-center justify-between">
              <span>Drishti AI/ML (Multivariate)</span>
              <span className="text-[10px] text-teal">11 Features</span>
            </div>
            <p className="text-ink/45 mb-2">
              Full multivariate feature space capturing physical, financial, and operational vectors:
            </p>
            <ul className="space-y-1 text-[11px] text-ink-70 font-mono">
              <li>1. Sector Risk Weight (Linear vs Enclosed)</li>
              <li>2. State Terrain Friction Index</li>
              <li>3. Physical Progress %</li>
              <li>4. Financial Progress %</li>
              <li>5. Expenditure Mismatch Flag</li>
              <li>6. Physical Stagnancy Flag</li>
              <li>7. Project Size Scale (Small/Med/Large/Mega)</li>
              <li>8. Elapsed Time %</li>
              <li>9. <span className="text-teal font-semibold">Contractor Track Record (0-100)</span></li>
              <li>10. <span className="text-teal font-semibold">Land Acquisition Delay Flag (0/1)</span></li>
              <li>11. <span className="text-teal font-semibold">Monsoon Disruption Index (0-100)</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 4: Responsible AI & Security */}
      <div className="bg-paper border border-ink/15 rounded-sm p-5">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-ink ">
            4. Responsible AI & Administrative Governance
          </h3>
        </div>
        <p className="text-xs text-ink/45 leading-relaxed">
          Drishti is built following the principle that <strong className="text-ink">transparent, defensible rules beat opaque black-box deep learning for public capital allocation</strong>. All statistical calculations are computed in verified TypeScript on deterministic matrices, while generative LLMs (Gemini 3.8 Flash) are restricted to synthesized advisory memos and contextual data queries. Zero private API tokens or unvetted credentials are exposed to client browsers.
        </p>
      </div>
    </div>
  );
};
