export type Sector =
  | "Roads"
  | "Railways"
  | "Power"
  | "Urban Infra"
  | "Water"
  | "Telecom";

export type ProjectStatus = "On Track" | "Delayed" | "Critical";

export type RiskBand = "Low" | "Medium" | "High";

export interface ProgressHistoryItem {
  month: string; // e.g. "Oct 2025"
  physical_pct: number;
  financial_pct: number;
}

export interface Project {
  id: string;
  name: string;
  sector: Sector;
  state: string;
  implementing_agency: string;
  sanctioned_cost_cr: number;
  latest_revised_cost_cr: number;
  sanction_date: string; // YYYY-MM-DD
  original_completion_date: string; // YYYY-MM-DD
  revised_completion_date: string; // YYYY-MM-DD
  physical_progress_pct: number;
  financial_progress_pct: number;
  last_reported_month: string;
  progress_history: ProgressHistoryItem[];
  latitude?: number;
  longitude?: number;

  // Non-CUF Extended Variables (Proposed to MoSPI)
  contractor_track_record_score: number; // 0 - 100
  land_acquisition_delay_flag: boolean;  // true if ROW/acquisition dispute
  monsoon_disruption_index: number;      // 0 - 100 vulnerability score
  clearance_target_date?: string;        // Target date for clearances
  
  // New AI/ML Variables for Precision Optimization
  contractor_altman_z_score?: number;    // Financial health (lower is riskier)
  geospatial_risk_index?: number;        // Terrain/Locational risk (higher is riskier)

  // Computed fields
  elapsed_time_pct: number;
  costOverrunPct: number;
  costOverrunCr: number;
  scheduleSlipMonths: number;
  isStagnant: boolean;
  isMismatch: boolean;
  normalizedCostScore: number;
  normalizedSlipScore: number;
  risk_score: number;
  riskBand: RiskBand;
  status: ProjectStatus;
  risk_reasons: string[];

  // Predictions (Computed by in-browser regression models)
  predicted_cost_overrun_pct?: number;
  predicted_schedule_slip_months?: number;
  baseline_cost_overrun_pct?: number;
  baseline_schedule_slip_months?: number;
  
  isolation_forest_payload?: IsolationForestPayload;
}

export interface IsolationForestPayload {
  project_id: string;
  data_timestamp: string;
  analysis_summary: {
    current_variance: number;
    fiscal_trajectory: string;
    ai_risk_score: "Low" | "Moderate" | "High" | "Critical";
  };
  visualization_input: {
    structural_variance_map: Array<{
      component_id: string;
      variance_score: number;
      render_status: "Green" | "Amber" | "BlinkingRed";
    }>;
    cascading_delay_prediction: string;
  };
  analytics_inbox: Array<{
    indicator_id: string;
    value: number;
    anomaly_flag: boolean;
    detail: string;
  }>;
}

export interface RegressionMetrics {
  mae: number;
  rmse: number;
  r2: number;
}

export interface ClassificationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface ModelBenchmark {
  costMetrics: RegressionMetrics;
  slipMetrics: RegressionMetrics;
  classificationMetrics: ClassificationMetrics;
}

export interface BenchmarkComparison {
  baseline: ModelBenchmark;
  aiml: ModelBenchmark;
  testSetSize: number;
  trainSetSize: number;
  testProjectIds: string[];
}

export interface DriverCorrelation {
  featureName: string;
  displayName: string;
  isNonCuf: boolean;
  costCorrelation: number;     // Pearson r (-1 to 1)
  slipCorrelation: number;     // Pearson r (-1 to 1)
  costCoefficient: number;     // Standardized regression coefficient
  slipCoefficient: number;     // Standardized regression coefficient
  importanceScore: number;     // Normalized impact ranking (0-100)
}

export interface BeforeAfterComparison {
  cufOnly: {
    costMae: number;
    costR2: number;
    slipMae: number;
    slipR2: number;
    riskF1: number;
  };
  withNonCuf: {
    costMae: number;
    costR2: number;
    slipMae: number;
    slipR2: number;
    riskF1: number;
  };
  improvements: {
    costR2Gain: number;
    slipR2Gain: number;
    costMaeReduction: number;
    slipMaeReduction: number;
    f1Gain: number;
  };
}

export interface PortfolioStats {
  totalProjects: number;
  totalSanctionedCost: number;
  totalRevisedCost: number;
  totalOverrun: number;
  costOverrunPct: number;
  avgPhysicalProgress: number;
  avgFinancialProgress: number;
  avgSlipMonths: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  stagnantCount: number;
  mismatchCount: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "gemini";
  text: string;
  timestamp: string;
}
