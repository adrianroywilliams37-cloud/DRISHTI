import { Project, ProgressHistoryItem, RiskBand, ProjectStatus } from "../types";

export function calculateMonthsBetween(d1Str: string, d2Str: string): number {
  try {
    const d1 = new Date(d1Str);
    const d2 = new Date(d2Str);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;

    let months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months += d2.getMonth() - d1.getMonth();
    // fractional days adjustment
    const dayDiff = (d2.getDate() - d1.getDate()) / 30;
    const total = Math.round(months + dayDiff);
    return Math.max(0, total);
  } catch {
    return 0;
  }
}

export function normalizeCostOverrun(costOverrunPct: number): number {
  if (costOverrunPct <= 0) return 0;
  // A 50% cost overrun is considered severe in public infrastructure (score 100)
  return Math.min(100, Math.max(0, (costOverrunPct / 50) * 100));
}

export function normalizeScheduleSlip(slipMonths: number): number {
  if (slipMonths <= 0) return 0;
  // A 36-month (3-year) delay reaches maximum normalized risk factor (score 100)
  return Math.min(100, Math.max(0, (slipMonths / 36) * 100));
}

export function checkProgressStagnancy(history: ProgressHistoryItem[]): boolean {
  if (!history || history.length < 2) return false;
  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  return Math.abs(last.physical_pct - prev.physical_pct) < 0.2;
}

export function checkProgressMismatch(financialPct: number, physicalPct: number): boolean {
  return financialPct - physicalPct > 20;
}

export interface ComputedRiskResult {
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
}

export function computeProjectRisk(raw: {
  sanctioned_cost_cr: number;
  latest_revised_cost_cr: number;
  original_completion_date: string;
  revised_completion_date: string;
  physical_progress_pct: number;
  financial_progress_pct: number;
  progress_history: ProgressHistoryItem[];
  contractor_altman_z_score?: number;
  geospatial_risk_index?: number;
}): ComputedRiskResult {
  const sanctioned = Number(raw.sanctioned_cost_cr) || 1;
  const revised = Number(raw.latest_revised_cost_cr) || sanctioned;
  const costOverrunCr = Math.max(0, revised - sanctioned);
  const costOverrunPct = Math.max(0, ((revised - sanctioned) / sanctioned) * 100);

  const scheduleSlipMonths = calculateMonthsBetween(
    raw.original_completion_date,
    raw.revised_completion_date
  );

  const isStagnant = checkProgressStagnancy(raw.progress_history);
  const isMismatch = checkProgressMismatch(
    Number(raw.financial_progress_pct) || 0,
    Number(raw.physical_progress_pct) || 0
  );

  const normalizedCostScore = normalizeCostOverrun(costOverrunPct);
  const normalizedSlipScore = normalizeScheduleSlip(scheduleSlipMonths);

  let rawScore =
    0.35 * normalizedCostScore +
    0.35 * normalizedSlipScore +
    0.15 * (isStagnant ? 100 : 0) +
    0.15 * (isMismatch ? 100 : 0);

  // Apply ML Precision Optimization (Z-Score & Geospatial)
  // High Z-Score (Safe > 2.6) reduces false positives. Low Z-Score (< 1.8) increases risk.
  const zScore = raw.contractor_altman_z_score ?? 2.5; 
  if (zScore > 2.6) {
    rawScore -= 5; // Safe contractor: reduce false alarm probability
  } else if (zScore < 1.8) {
    rawScore += 10; // Financially distressed contractor
  }

  // Geospatial Risk Index (0 - 100). High > 60 adds risk. Low < 20 reduces false alarms.
  const geoRisk = raw.geospatial_risk_index ?? 30;
  if (geoRisk > 60) {
    rawScore += 10;
  } else if (geoRisk < 20) {
    rawScore -= 5;
  }

  const risk_score = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Risk band: Low (<30), Medium (30-60), High (>60)
  let riskBand: RiskBand = "Low";
  if (risk_score > 60) {
    riskBand = "High";
  } else if (risk_score >= 30) {
    riskBand = "Medium";
  }

  // Status computation
  let status: ProjectStatus = "On Track";
  if (riskBand === "High" || scheduleSlipMonths >= 24 || costOverrunPct >= 35) {
    status = "Critical";
  } else if (riskBand === "Medium" || scheduleSlipMonths >= 6 || costOverrunPct >= 10) {
    status = "Delayed";
  }

  // Plain-language reasons string generation
  const reasons: string[] = [];
  if (costOverrunPct >= 5) {
    reasons.push(
      `${costOverrunPct.toFixed(1)}% cost overrun (+₹${costOverrunCr.toFixed(0)} Cr)`
    );
  }
  if (scheduleSlipMonths > 0) {
    reasons.push(`${scheduleSlipMonths} months behind schedule`);
  }
  if (isMismatch) {
    const diff = Math.round(raw.financial_progress_pct - raw.physical_progress_pct);
    reasons.push(`Expenditure exceeds physical progress by ${diff}% (money spent, delayed work)`);
  }
  if (isStagnant) {
    reasons.push("Physical progress stalled across last 2 reporting periods");
  }

  if (reasons.length === 0) {
    reasons.push("All physical & financial milestones executing within sanctioned parameters");
  }

  return {
    costOverrunPct,
    costOverrunCr,
    scheduleSlipMonths,
    isStagnant,
    isMismatch,
    normalizedCostScore,
    normalizedSlipScore,
    risk_score,
    riskBand,
    status,
    risk_reasons: reasons,
  };
}

export function calculateElapsedTimePct(sanctionDateStr: string, originalCompletionStr: string): number {
  try {
    const sDate = new Date(sanctionDateStr);
    const oDate = new Date(originalCompletionStr);
    const refDate = new Date("2026-02-15"); // Current cycle reference
    const totalDuration = oDate.getTime() - sDate.getTime();
    if (totalDuration <= 0) return 50;
    const elapsed = refDate.getTime() - sDate.getTime();
    const pct = (elapsed / totalDuration) * 100;
    return Math.min(150, Math.max(5, Math.round(pct * 10) / 10));
  } catch {
    return 50;
  }
}

export function enrichProject(raw: any): Project {
  const riskResult = computeProjectRisk({
    sanctioned_cost_cr: raw.sanctioned_cost_cr,
    latest_revised_cost_cr: raw.latest_revised_cost_cr,
    original_completion_date: raw.original_completion_date,
    revised_completion_date: raw.revised_completion_date,
    physical_progress_pct: raw.physical_progress_pct,
    financial_progress_pct: raw.financial_progress_pct,
    progress_history: raw.progress_history || [],
    contractor_altman_z_score: raw.contractor_altman_z_score,
    geospatial_risk_index: raw.geospatial_risk_index,
  });

  const elapsed_time_pct =
    raw.elapsed_time_pct !== undefined
      ? Number(raw.elapsed_time_pct)
      : calculateElapsedTimePct(
          raw.sanction_date || "2020-01-01",
          raw.original_completion_date || "2025-12-31"
        );

  return {
    ...raw,
    contractor_track_record_score:
      raw.contractor_track_record_score !== undefined
        ? Number(raw.contractor_track_record_score)
        : 72,
    contractor_altman_z_score:
      raw.contractor_altman_z_score !== undefined
        ? Number(raw.contractor_altman_z_score)
        : 2.5,
    geospatial_risk_index:
      raw.geospatial_risk_index !== undefined
        ? Number(raw.geospatial_risk_index)
        : 20, // Low geospatial risk out of 100
    land_acquisition_delay_flag: Boolean(raw.land_acquisition_delay_flag),
    monsoon_disruption_index:
      raw.monsoon_disruption_index !== undefined
        ? Number(raw.monsoon_disruption_index)
        : 35,
    elapsed_time_pct,
    ...riskResult,
  };
}

export async function enrichProjectWithAI(raw: any): Promise<Project> {
  const baseProject = enrichProject(raw);
  try {
    const response = await fetch('http://localhost:5001/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baseProject)
    });
    
    if (response.ok) {
      const aiData = await response.json();
      baseProject.risk_score = aiData.ai_risk_score;
      baseProject.riskBand = aiData.ai_riskBand;
      baseProject.status = aiData.ai_status;
      baseProject.risk_reasons = [...baseProject.risk_reasons, "(AI Prediction Engine Applied)"];
    }
  } catch (err) {
    console.warn("AI Risk Engine unavailable, falling back to heuristic:", err);
  }
  return baseProject;
}

export function calculatePortfolioStats(projects: Project[]): import("../types").PortfolioStats {
  const totalProjects = projects.length;
  if (totalProjects === 0) {
    return {
      totalProjects: 0,
      totalSanctionedCost: 0,
      totalRevisedCost: 0,
      totalOverrun: 0,
      costOverrunPct: 0,
      avgPhysicalProgress: 0,
      avgFinancialProgress: 0,
      avgSlipMonths: 0,
      highRiskCount: 0,
      mediumRiskCount: 0,
      lowRiskCount: 0,
      stagnantCount: 0,
      mismatchCount: 0,
    };
  }

  let totalSanctionedCost = 0;
  let totalRevisedCost = 0;
  let totalPhysical = 0;
  let totalFinancial = 0;
  let totalSlip = 0;
  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let lowRiskCount = 0;
  let stagnantCount = 0;
  let mismatchCount = 0;

  for (const p of projects) {
    totalSanctionedCost += p.sanctioned_cost_cr;
    totalRevisedCost += p.latest_revised_cost_cr;
    totalPhysical += p.physical_progress_pct;
    totalFinancial += p.financial_progress_pct;
    totalSlip += p.scheduleSlipMonths;

    if (p.riskBand === "High") highRiskCount++;
    else if (p.riskBand === "Medium") mediumRiskCount++;
    else lowRiskCount++;

    if (p.isStagnant) stagnantCount++;
    if (p.isMismatch) mismatchCount++;
  }

  const totalOverrun = Math.max(0, totalRevisedCost - totalSanctionedCost);
  const costOverrunPct =
    totalSanctionedCost > 0 ? (totalOverrun / totalSanctionedCost) * 100 : 0;

  return {
    totalProjects,
    totalSanctionedCost: Math.round(totalSanctionedCost),
    totalRevisedCost: Math.round(totalRevisedCost),
    totalOverrun: Math.round(totalOverrun),
    costOverrunPct: Number(costOverrunPct.toFixed(1)),
    avgPhysicalProgress: Number((totalPhysical / totalProjects).toFixed(1)),
    avgFinancialProgress: Number((totalFinancial / totalProjects).toFixed(1)),
    avgSlipMonths: Number((totalSlip / totalProjects).toFixed(1)),
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    stagnantCount,
    mismatchCount,
  };
}

