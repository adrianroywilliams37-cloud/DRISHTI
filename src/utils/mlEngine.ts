import {
  Project,
  RegressionMetrics,
  ClassificationMetrics,
  ModelBenchmark,
  BenchmarkComparison,
  DriverCorrelation,
  BeforeAfterComparison,
  RiskBand,
} from "../types.js";

/**
 * Solve linear system A * x = b using Gaussian elimination with partial pivoting.
 * Includes Ridge penalty (lambda) on the diagonal for numerical stability.
 */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  // Deep copy matrix and vector
  const M: number[][] = A.map((row) => [...row]);
  const v: number[] = [...b];

  for (let i = 0; i < n; i++) {
    // Pivot selection
    let maxRow = i;
    let maxVal = Math.abs(M[i][i]);
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(M[r][i]) > maxVal) {
        maxVal = Math.abs(M[r][i]);
        maxRow = r;
      }
    }

    if (maxVal < 1e-12) {
      continue; // Singular or near-singular column
    }

    // Swap rows
    if (maxRow !== i) {
      const tempRow = M[i];
      M[i] = M[maxRow];
      M[maxRow] = tempRow;
      const tempV = v[i];
      v[i] = v[maxRow];
      v[maxRow] = tempV;
    }

    // Eliminate below
    for (let r = i + 1; r < n; r++) {
      const factor = M[r][i] / (M[i][i] || 1e-9);
      for (let c = i; c < n; c++) {
        M[r][c] -= factor * M[i][c];
      }
      v[r] -= factor * v[i];
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = v[i];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * x[j];
    }
    x[i] = sum / (M[i][i] || 1e-9);
  }

  return x;
}

/**
 * Multiple Linear Regression using Ordinary Least Squares with L2 ridge regularization.
 */
export class OLSLinearRegression {
  public coefficients: number[] = []; // [intercept, beta1, beta2, ...]
  public featureNames: string[] = [];
  public means: number[] = [];
  public stds: number[] = [];

  public fit(X: number[][], y: number[], featureNames: string[] = [], ridgeLambda = 0.05) {
    this.featureNames = featureNames;
    const n = X.length;
    if (n === 0) return;
    const p = X[0].length;

    // Calculate means and stds for feature normalization
    this.means = new Array(p).fill(0);
    this.stds = new Array(p).fill(1);

    for (let j = 0; j < p; j++) {
      let sum = 0;
      for (let i = 0; i < n; i++) sum += X[i][j];
      this.means[j] = sum / n;

      let varSum = 0;
      for (let i = 0; i < n; i++) {
        const diff = X[i][j] - this.means[j];
        varSum += diff * diff;
      }
      this.stds[j] = Math.sqrt(varSum / (n || 1)) || 1;
    }

    // Standardize X and add intercept column of 1s
    const X_ext: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row = [1]; // Intercept
      for (let j = 0; j < p; j++) {
        row.push((X[i][j] - this.means[j]) / this.stds[j]);
      }
      X_ext.push(row);
    }

    const numCols = p + 1;
    // Compute X^T * X
    const XtX: number[][] = Array.from({ length: numCols }, () => new Array(numCols).fill(0));
    const Xty: number[] = new Array(numCols).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < numCols; j++) {
        Xty[j] += X_ext[i][j] * y[i];
        for (let k = 0; k < numCols; k++) {
          XtX[j][k] += X_ext[i][j] * X_ext[i][k];
        }
      }
    }

    // Add ridge penalty to diagonal (except intercept)
    for (let j = 1; j < numCols; j++) {
      XtX[j][j] += ridgeLambda * n;
    }

    this.coefficients = solveLinearSystem(XtX, Xty);
  }

  public predict(X: number[][]): number[] {
    const n = X.length;
    const p = this.featureNames.length;
    const preds: number[] = [];

    for (let i = 0; i < n; i++) {
      let val = this.coefficients[0] || 0; // Intercept
      for (let j = 0; j < p; j++) {
        const stdVal = (X[i][j] - this.means[j]) / (this.stds[j] || 1);
        val += (this.coefficients[j + 1] || 0) * stdVal;
      }
      preds.push(val);
    }
    return preds;
  }
}

/**
 * Feature Extraction Helpers
 */
export function getProjectSizeBucket(sanctionedCostCr: number): number {
  if (sanctionedCostCr < 1000) return 0; // Small
  if (sanctionedCostCr < 5000) return 1; // Medium
  if (sanctionedCostCr < 15000) return 2; // Large
  return 3; // Mega
}

const sectorEncoding: Record<string, number> = {
  Roads: 1,
  Railways: 2,
  Power: 0.5,
  "Urban Infra": 1.5,
  Water: 1.8,
  Telecom: 0.3,
};

// State terrain & land acquisition friction index (estimated from MoSPI historical state dossiers)
const stateRiskIndex: Record<string, number> = {
  "Jammu & Kashmir": 2.5,
  "Himachal Pradesh": 2.2,
  Uttarakhand: 2.1,
  Assam: 2.0,
  Bihar: 1.8,
  "West Bengal": 1.7,
  Kerala: 1.6,
  Jharkhand: 1.5,
  Maharashtra: 1.4,
  Karnataka: 1.2,
  "Uttar Pradesh": 1.3,
  "Tamil Nadu": 1.0,
  Odisha: 1.4,
  Gujarat: 0.8,
  Rajasthan: 0.7,
  "Madhya Pradesh": 1.1,
  Telangana: 1.0,
  "Andhra Pradesh": 1.2,
};

/**
 * Extract feature vectors for baseline and AI/ML models
 */
export function extractBaselineFeatures(p: Project): number[] {
  return [
    p.elapsed_time_pct || 50,
    p.sanctioned_cost_cr || 1000,
  ];
}

export const BASELINE_FEATURE_NAMES = ["elapsed_time_pct", "sanctioned_cost_cr"];

export function extractAimlFeatures(p: Project, includeNonCuf: boolean): number[] {
  const base = [
    sectorEncoding[p.sector] ?? 1,
    stateRiskIndex[p.state] ?? 1.2,
    p.physical_progress_pct,
    p.financial_progress_pct,
    p.isMismatch ? 1 : 0,
    p.isStagnant ? 1 : 0,
    getProjectSizeBucket(p.sanctioned_cost_cr),
    p.elapsed_time_pct || 50,
  ];

  if (includeNonCuf) {
    base.push(
      p.contractor_track_record_score ?? 70,
      p.land_acquisition_delay_flag ? 1 : 0,
      p.monsoon_disruption_index ?? 35,
      p.contractor_altman_z_score ?? 2.5,
      p.geospatial_risk_index ?? 30
    );
  }

  return base;
}

export const AIML_CUF_FEATURE_NAMES = [
  "sector_risk_weight",
  "state_terrain_risk",
  "physical_progress_pct",
  "financial_progress_pct",
  "progress_mismatch_flag",
  "progress_stagnant_flag",
  "project_size_bucket",
  "elapsed_time_pct",
];

export const AIML_FULL_FEATURE_NAMES = [
  ...AIML_CUF_FEATURE_NAMES,
  "contractor_track_record_score",
  "land_acquisition_delay_flag",
  "monsoon_disruption_index",
  "contractor_altman_z_score",
  "geospatial_risk_index",
];

/**
 * Calculate Regression Metrics: MAE, RMSE, R²
 */
export function computeRegressionMetrics(actuals: number[], preds: number[]): RegressionMetrics {
  const n = actuals.length;
  if (n === 0) return { mae: 0, rmse: 0, r2: 0 };

  let absErrSum = 0;
  let sqErrSum = 0;
  let meanActual = 0;

  for (let i = 0; i < n; i++) meanActual += actuals[i];
  meanActual /= n;

  let totVarSum = 0;
  for (let i = 0; i < n; i++) {
    const err = actuals[i] - preds[i];
    absErrSum += Math.abs(err);
    sqErrSum += err * err;
    const diffMean = actuals[i] - meanActual;
    totVarSum += diffMean * diffMean;
  }

  const mae = absErrSum / n;
  const rmse = Math.sqrt(sqErrSum / n);
  const r2 = totVarSum > 0 ? Math.max(0, 1 - sqErrSum / totVarSum) : 0;

  return {
    mae: Number(mae.toFixed(2)),
    rmse: Number(rmse.toFixed(2)),
    r2: Number(r2.toFixed(3)),
  };
}

/**
 * Derive risk band from predicted cost overrun & schedule slip
 */
export function predictRiskBand(costOverrunPct: number, slipMonths: number): RiskBand {
  const normCost = Math.min(100, Math.max(0, (costOverrunPct / 50) * 100));
  const normSlip = Math.min(100, Math.max(0, (slipMonths / 36) * 100));
  const estimatedScore = 0.5 * normCost + 0.5 * normSlip;

  if (estimatedScore > 55 || slipMonths >= 20 || costOverrunPct >= 30) return "High";
  if (estimatedScore >= 25 || slipMonths >= 6 || costOverrunPct >= 10) return "Medium";
  return "Low";
}

/**
 * Compute multi-class classification metrics: Accuracy, Precision, Recall, F1
 */
export function computeClassificationMetrics(actualBands: RiskBand[], predictedBands: RiskBand[]): ClassificationMetrics {
  const n = actualBands.length;
  if (n === 0) return { accuracy: 0, precision: 0, recall: 0, f1: 0 };

  let correct = 0;
  for (let i = 0; i < n; i++) {
    if (actualBands[i] === predictedBands[i]) correct++;
  }
  const accuracy = correct / n;

  const classes: RiskBand[] = ["High", "Medium", "Low"];
  let precSum = 0;
  let recSum = 0;
  let activeClasses = 0;

  for (const c of classes) {
    let tp = 0;
    let fp = 0;
    let fn = 0;

    for (let i = 0; i < n; i++) {
      if (predictedBands[i] === c && actualBands[i] === c) tp++;
      if (predictedBands[i] === c && actualBands[i] !== c) fp++;
      if (predictedBands[i] !== c && actualBands[i] === c) fn++;
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;

    if (tp + fn > 0 || tp + fp > 0) {
      precSum += precision;
      recSum += recall;
      activeClasses++;
    }
  }

  const avgPrec = activeClasses > 0 ? precSum / activeClasses : 0;
  const avgRec = activeClasses > 0 ? recSum / activeClasses : 0;
  const f1 = avgPrec + avgRec > 0 ? (2 * avgPrec * avgRec) / (avgPrec + avgRec) : 0;

  return {
    accuracy: Number((accuracy * 100).toFixed(1)),
    precision: Number((avgPrec * 100).toFixed(1)),
    recall: Number((avgRec * 100).toFixed(1)),
    f1: Number((f1 * 100).toFixed(1)),
  };
}

/**
 * Run full benchmarking and training pipeline on dataset
 */
export function runModelBenchmarking(projects: Project[]): {
  comparison: BenchmarkComparison;
  beforeAfter: BeforeAfterComparison;
  correlations: DriverCorrelation[];
  enrichedProjects: Project[];
} {
  const n = projects.length;
  // 80% train, 20% test split (reproducible holdout)
  const testCount = Math.max(4, Math.round(n * 0.2));
  const trainCount = n - testCount;

  // Hold out every 5th item for balanced test distribution across sectors
  const testIndices = new Set<number>();
  for (let i = 4; i < n; i += 5) {
    if (testIndices.size < testCount) testIndices.add(i);
  }
  // Fill remaining if needed
  for (let i = n - 1; i >= 0 && testIndices.size < testCount; i--) {
    testIndices.add(i);
  }

  const trainProjects: Project[] = [];
  const testProjects: Project[] = [];

  projects.forEach((p, idx) => {
    if (testIndices.has(idx)) {
      testProjects.push(p);
    } else {
      trainProjects.push(p);
    }
  });

  // 1. Train Baseline Models on train set
  const X_train_baseline = trainProjects.map(extractBaselineFeatures);
  const X_test_baseline = testProjects.map(extractBaselineFeatures);
  const X_all_baseline = projects.map(extractBaselineFeatures);

  const y_train_cost = trainProjects.map((p) => p.costOverrunPct);
  const y_train_slip = trainProjects.map((p) => p.scheduleSlipMonths);

  const y_test_cost = testProjects.map((p) => p.costOverrunPct);
  const y_test_slip = testProjects.map((p) => p.scheduleSlipMonths);

  const baselineCostModel = new OLSLinearRegression();
  baselineCostModel.fit(X_train_baseline, y_train_cost, BASELINE_FEATURE_NAMES, 0.1);

  const baselineSlipModel = new OLSLinearRegression();
  baselineSlipModel.fit(X_train_baseline, y_train_slip, BASELINE_FEATURE_NAMES, 0.1);

  const baselineCostTestPreds = baselineCostModel.predict(X_test_baseline).map((v) => Math.max(0, v));
  const baselineSlipTestPreds = baselineSlipModel.predict(X_test_baseline).map((v) => Math.max(0, Math.round(v)));

  const baselineRiskPreds = baselineCostTestPreds.map((c, i) =>
    predictRiskBand(c, baselineSlipTestPreds[i])
  );
  const actualRiskBands = testProjects.map((p) => p.riskBand);

  const baselineCostMetrics = computeRegressionMetrics(y_test_cost, baselineCostTestPreds);
  const baselineSlipMetrics = computeRegressionMetrics(y_test_slip, baselineSlipTestPreds);
  const baselineClassMetrics = computeClassificationMetrics(actualRiskBands, baselineRiskPreds);

  // 2. Train AI/ML Model with CUF ONLY
  const X_train_cuf = trainProjects.map((p) => extractAimlFeatures(p, false));
  const X_test_cuf = testProjects.map((p) => extractAimlFeatures(p, false));

  const cufCostModel = new OLSLinearRegression();
  cufCostModel.fit(X_train_cuf, y_train_cost, AIML_CUF_FEATURE_NAMES, 0.05);

  const cufSlipModel = new OLSLinearRegression();
  cufSlipModel.fit(X_train_cuf, y_train_slip, AIML_CUF_FEATURE_NAMES, 0.05);

  const cufCostTestPreds = cufCostModel.predict(X_test_cuf).map((v) => Math.max(0, v));
  const cufSlipTestPreds = cufSlipModel.predict(X_test_cuf).map((v) => Math.max(0, Math.round(v)));
  const cufRiskPreds = cufCostTestPreds.map((c, i) => predictRiskBand(c, cufSlipTestPreds[i]));

  const cufCostMetrics = computeRegressionMetrics(y_test_cost, cufCostTestPreds);
  const cufSlipMetrics = computeRegressionMetrics(y_test_slip, cufSlipTestPreds);
  const cufClassMetrics = computeClassificationMetrics(actualRiskBands, cufRiskPreds);

  // 3. Train Full AI/ML Model with Extended Non-CUF Variables
  const X_train_full = trainProjects.map((p) => extractAimlFeatures(p, true));
  const X_test_full = testProjects.map((p) => extractAimlFeatures(p, true));
  const X_all_full = projects.map((p) => extractAimlFeatures(p, true));

  const fullCostModel = new OLSLinearRegression();
  fullCostModel.fit(X_train_full, y_train_cost, AIML_FULL_FEATURE_NAMES, 0.02);

  const fullSlipModel = new OLSLinearRegression();
  fullSlipModel.fit(X_train_full, y_train_slip, AIML_FULL_FEATURE_NAMES, 0.02);

  const fullCostTestPreds = fullCostModel.predict(X_test_full).map((v) => Math.max(0, Number(v.toFixed(1))));
  const fullSlipTestPreds = fullSlipModel.predict(X_test_full).map((v) => Math.max(0, Math.round(v)));
  const fullRiskPreds = fullCostTestPreds.map((c, i) => predictRiskBand(c, fullSlipTestPreds[i]));

  const fullCostMetrics = computeRegressionMetrics(y_test_cost, fullCostTestPreds);
  const fullSlipMetrics = computeRegressionMetrics(y_test_slip, fullSlipTestPreds);
  const fullClassMetrics = computeClassificationMetrics(actualRiskBands, fullRiskPreds);

  // 4. Generate Predictions for ALL projects to store in state
  const allBaselineCostPreds = baselineCostModel.predict(X_all_baseline).map((v) => Math.max(0, Number(v.toFixed(1))));
  const allBaselineSlipPreds = baselineSlipModel.predict(X_all_baseline).map((v) => Math.max(0, Math.round(v)));

  const allFullCostPreds = fullCostModel.predict(X_all_full).map((v) => Math.max(0, Number(v.toFixed(1))));
  const allFullSlipPreds = fullSlipModel.predict(X_all_full).map((v) => Math.max(0, Math.round(v)));

  const enrichedProjects = projects.map((p, i) => ({
    ...p,
    baseline_cost_overrun_pct: allBaselineCostPreds[i],
    baseline_schedule_slip_months: allBaselineSlipPreds[i],
    predicted_cost_overrun_pct: allFullCostPreds[i],
    predicted_schedule_slip_months: allFullSlipPreds[i],
  }));

  // 5. Driver Correlation & Importance Analysis
  const featureDefinitions = [
    { key: "contractor_track_record_score", name: "Contractor Track Record", isNonCuf: true, extract: (p: Project) => p.contractor_track_record_score },
    { key: "land_acquisition_delay_flag", name: "Land Acquisition Delay Flag", isNonCuf: true, extract: (p: Project) => (p.land_acquisition_delay_flag ? 1 : 0) },
    { key: "monsoon_disruption_index", name: "Monsoon Disruption Index", isNonCuf: true, extract: (p: Project) => p.monsoon_disruption_index },
    { key: "contractor_altman_z_score", name: "Contractor Altman Z-Score", isNonCuf: true, extract: (p: Project) => p.contractor_altman_z_score ?? 2.5 },
    { key: "geospatial_risk_index", name: "Geospatial Risk Index", isNonCuf: true, extract: (p: Project) => p.geospatial_risk_index ?? 30 },
    { key: "isMismatch", name: "Expenditure Mismatch Flag", isNonCuf: false, extract: (p: Project) => (p.isMismatch ? 1 : 0) },
    { key: "isStagnant", name: "Physical Stagnancy Flag", isNonCuf: false, extract: (p: Project) => (p.isStagnant ? 1 : 0) },
    { key: "elapsed_time_pct", name: "Elapsed Time %", isNonCuf: false, extract: (p: Project) => p.elapsed_time_pct },
    { key: "physical_progress_pct", name: "Physical Progress %", isNonCuf: false, extract: (p: Project) => p.physical_progress_pct },
    { key: "financial_progress_pct", name: "Financial Outlay %", isNonCuf: false, extract: (p: Project) => p.financial_progress_pct },
    { key: "sanctioned_cost_cr", name: "Sanctioned Outlay (Size)", isNonCuf: false, extract: (p: Project) => p.sanctioned_cost_cr },
  ];

  const correlations: DriverCorrelation[] = featureDefinitions.map((fd, idx) => {
    const vals = projects.map(fd.extract);
    const costVals = projects.map((p) => p.costOverrunPct);
    const slipVals = projects.map((p) => p.scheduleSlipMonths);

    const rCost = computePearsonCorrelation(vals, costVals);
    const rSlip = computePearsonCorrelation(vals, slipVals);

    // Standardized regression coefficient from the trained model if available
    const coefIdx = AIML_FULL_FEATURE_NAMES.indexOf(fd.key);
    const costCoef = coefIdx >= 0 && fullCostModel.coefficients[coefIdx + 1] ? fullCostModel.coefficients[coefIdx + 1] : rCost * 10;
    const slipCoef = coefIdx >= 0 && fullSlipModel.coefficients[coefIdx + 1] ? fullSlipModel.coefficients[coefIdx + 1] : rSlip * 8;

    const importanceScore = Math.min(100, Math.round((Math.abs(rCost) * 55 + Math.abs(rSlip) * 45) * 100));

    return {
      featureName: fd.key,
      displayName: fd.name,
      isNonCuf: fd.isNonCuf,
      costCorrelation: Number(rCost.toFixed(3)),
      slipCorrelation: Number(rSlip.toFixed(3)),
      costCoefficient: Number(costCoef.toFixed(2)),
      slipCoefficient: Number(slipCoef.toFixed(2)),
      importanceScore,
    };
  }).sort((a, b) => b.importanceScore - a.importanceScore);

  // 6. Before / After Comparison
  const beforeAfter: BeforeAfterComparison = {
    cufOnly: {
      costMae: cufCostMetrics.mae,
      costR2: cufCostMetrics.r2,
      slipMae: cufSlipMetrics.mae,
      slipR2: cufSlipMetrics.r2,
      riskF1: cufClassMetrics.f1,
    },
    withNonCuf: {
      costMae: fullCostMetrics.mae,
      costR2: fullCostMetrics.r2,
      slipMae: fullSlipMetrics.mae,
      slipR2: fullSlipMetrics.r2,
      riskF1: fullClassMetrics.f1,
    },
    improvements: {
      costR2Gain: Number((fullCostMetrics.r2 - cufCostMetrics.r2).toFixed(3)),
      slipR2Gain: Number((fullSlipMetrics.r2 - cufSlipMetrics.r2).toFixed(3)),
      costMaeReduction: Number((cufCostMetrics.mae - fullCostMetrics.mae).toFixed(2)),
      slipMaeReduction: Number((cufSlipMetrics.mae - fullSlipMetrics.mae).toFixed(2)),
      f1Gain: Number((fullClassMetrics.f1 - cufClassMetrics.f1).toFixed(1)),
    },
  };

  const comparison: BenchmarkComparison = {
    baseline: {
      costMetrics: baselineCostMetrics,
      slipMetrics: baselineSlipMetrics,
      classificationMetrics: baselineClassMetrics,
    },
    aiml: {
      costMetrics: fullCostMetrics,
      slipMetrics: fullSlipMetrics,
      classificationMetrics: fullClassMetrics,
    },
    testSetSize: testProjects.length,
    trainSetSize: trainProjects.length,
    testProjectIds: testProjects.map((p) => p.id),
  };

  return {
    comparison,
    beforeAfter,
    correlations,
    enrichedProjects,
  };
}

/**
 * Compute Pearson Correlation Coefficient r between two numerical series
 */
function computePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  if (den === 0) return 0;
  return Math.max(-1, Math.min(1, num / den));
}
