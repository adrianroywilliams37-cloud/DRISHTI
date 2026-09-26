import React, { useState, useRef } from "react";
import { Project } from "../types";
import { enrichProject } from "../utils/riskEngine";
import {
  Upload,
  X,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Table as TableIcon,
} from "lucide-react";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProjects: (imported: Project[], mode: "replace" | "append") => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportProjects,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [parsedProjects, setParsedProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"replace" | "append">("replace");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const parseCsvText = (csvText: string) => {
    setError(null);
    try {
      const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        throw new Error("CSV file must contain a header row and at least one data row.");
      }

      // Parse headers
      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/^["']|["']$/g, "").toLowerCase());

      const requiredHeaders = [
        "name",
        "sector",
        "state",
        "implementing_agency",
        "sanctioned_cost_cr",
        "latest_revised_cost_cr",
        "original_completion_date",
        "revised_completion_date",
        "physical_progress_pct",
        "financial_progress_pct",
      ];

      for (const req of requiredHeaders) {
        if (!headers.includes(req)) {
          throw new Error(
            `Missing mandatory column header: "${req}". Please download the sample template for the expected schema.`
          );
        }
      }

      const projects: Project[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // basic CSV comma split with quotes support
        const values: string[] = [];
        let current = "";
        let insideQuotes = false;

        for (let c = 0; c < line.length; c++) {
          const char = line[c];
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === "," && !insideQuotes) {
            values.push(current.trim().replace(/^["']|["']$/g, ""));
            current = "";
          } else {
            current += char;
          }
        }
        values.push(current.trim().replace(/^["']|["']$/g, ""));

        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || "";
        });

        // Generate synthetic progress history for the imported item if not provided
        const phys = parseFloat(rowObj.physical_progress_pct) || 0;
        const fin = parseFloat(rowObj.financial_progress_pct) || 0;
        const history = [
          { month: "Aug 2025", physical_pct: Math.max(0, phys - 8), financial_pct: Math.max(0, fin - 8) },
          { month: "Sep 2025", physical_pct: Math.max(0, phys - 5), financial_pct: Math.max(0, fin - 5) },
          { month: "Oct 2025", physical_pct: Math.max(0, phys - 3), financial_pct: Math.max(0, fin - 3) },
          { month: "Nov 2025", physical_pct: Math.max(0, phys - 1), financial_pct: Math.max(0, fin - 1) },
          { month: "Dec 2025", physical_pct: phys, financial_pct: fin },
        ];

        const rawProject = {
          id: rowObj.id || `IMP-${Date.now()}-${i}`,
          name: rowObj.name,
          sector: rowObj.sector || "Roads",
          state: rowObj.state || "National",
          implementing_agency: rowObj.implementing_agency || "Central Agency",
          sanctioned_cost_cr: parseFloat(rowObj.sanctioned_cost_cr) || 100,
          latest_revised_cost_cr: parseFloat(rowObj.latest_revised_cost_cr) || parseFloat(rowObj.sanctioned_cost_cr) || 100,
          sanction_date: rowObj.sanction_date || "2020-01-01",
          original_completion_date: rowObj.original_completion_date || "2024-12-31",
          revised_completion_date: rowObj.revised_completion_date || "2025-12-31",
          physical_progress_pct: phys,
          financial_progress_pct: fin,
          last_reported_month: rowObj.last_reported_month || "Jan 2026",
          progress_history: history,
        };

        const enriched = enrichProject(rawProject);
        projects.push(enriched);
      }

      setParsedProjects(projects);
    } catch (err: any) {
      setError(err.message || "Failed to parse CSV file");
      setParsedProjects([]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please select a valid CSV file format.");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadSample = () => {
    const sampleHeaders =
      "id,name,sector,state,implementing_agency,sanctioned_cost_cr,latest_revised_cost_cr,sanction_date,original_completion_date,revised_completion_date,physical_progress_pct,financial_progress_pct,last_reported_month\n";
    const sampleRows = [
      'NHAI-EXP-099,"Varanasi-Ranchi-Kolkata Expressway Package 4",Roads,Jharkhand,NHAI,7450,8900,2021-04-12,2025-06-30,2026-08-31,52.0,61.5,Jan 2026',
      'RAIL-NEW-102,"Bilaspur-Manali-Leh Strategic Broad Gauge Line",Railways,Himachal Pradesh,Northern Railway,32000,48500,2018-09-01,2025-12-31,2028-12-31,34.0,58.0,Jan 2026',
      'PWR-SOLAR-055,"Bhadla Solar Park 500MW Expansion Project",Power,Rajasthan,NTPC,2600,2650,2022-01-15,2024-10-31,2025-03-31,91.0,89.0,Jan 2026',
      'WTR-DAM-081,"Upper Krishna Project Stage III Canal Works",Water,Karnataka,Krishna Bhagya Jala Nigam,11200,16500,2017-06-10,2022-03-31,2026-10-31,64.0,88.0,Jan 2026',
    ].join("\n");

    const blob = new Blob([sampleHeaders + sampleRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "drishti_sample_projects_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = () => {
    if (parsedProjects.length === 0) return;
    onImportProjects(parsedProjects, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-paper border border-ink/15 rounded-sm w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-ink/15 bg-paper-raised flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-teal-900/80 border border-teal-700/80 flex items-center justify-center text-teal">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink ">
                Import Project Dataset (CSV)
              </h3>
              <p className="text-xs text-ink/45">
                Ingest real DRISHTI-format exports to monitor with Drishti
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-ink/45 hover:text-ink hover:bg-paper-raised transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-ink-70">
          {/* Action Row: Template download */}
          <div className="flex items-center justify-between bg-paper p-3 rounded-sm border border-ink/15">
            <div>
              <div className="font-semibold text-ink">Need the DRISHTI CSV schema?</div>
              <div className="text-[11px] text-ink/45">
                Download a pre-formatted template with all mandatory columns.
              </div>
            </div>
            <button
              onClick={handleDownloadSample}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-paper-raised hover:bg-slate-700 text-teal border border-ink/15 transition-colors text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Template</span>
            </button>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-teal-400 bg-teal-950/20"
                : "border-ink/15 hover:border-slate-500 bg-paper"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />
            <Upload className="w-8 h-8 text-ink/45 mx-auto mb-2" />
            <p className="font-medium text-ink text-sm">
              Click to select or drag & drop a .csv file here
            </p>
            <p className="text-[11px] text-ink/45 mt-1">
              Supports official DRISHTI export fields (cost, target dates, progress %)
            </p>
            {fileName && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-teal-950/80 border border-teal-800 text-teal text-xs font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal" />
                <span>Selected: {fileName}</span>
              </div>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800 rounded-sm text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-mahogany shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">CSV Import Error:</span> {error}
              </div>
            </div>
          )}

          {/* Parsed Preview */}
          {parsedProjects.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink flex items-center gap-1.5">
                  <TableIcon className="w-4 h-4 text-teal" />
                  <span>Valid Projects Parsed ({parsedProjects.length})</span>
                </span>
                <span className="text-[11px] text-ink/45">
                  Risk scores automatically computed
                </span>
              </div>

              {/* Mode Selector */}
              <div className="flex items-center gap-4 bg-paper p-3 rounded-sm border border-ink/15">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === "replace"}
                    onChange={() => setImportMode("replace")}
                    className="accent-teal-500"
                  />
                  <span>Replace current dataset ({parsedProjects.length} total)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === "append"}
                    onChange={() => setImportMode("append")}
                    className="accent-teal-500"
                  />
                  <span>Append to existing dataset</span>
                </label>
              </div>

              {/* Preview table */}
              <div className="max-h-40 overflow-y-auto rounded border border-ink/15 divide-y divide-slate-800/80 bg-paper">
                {parsedProjects.slice(0, 5).map((p, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-ink truncate max-w-xs">
                      {p.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-ink/45">{p.sector}</span>
                      <span className="font-bold px-1.5 py-0.2 rounded text-[10px] bg-paper-raised text-teal">
                        Score: {p.risk_score}
                      </span>
                    </div>
                  </div>
                ))}
                {parsedProjects.length > 5 && (
                  <div className="p-2 text-center text-[10px] text-ink/45 bg-paper">
                    ...and {parsedProjects.length - 5} more projects
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-ink/15 bg-paper-raised flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-paper-raised hover:bg-slate-700 text-ink-70 text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={parsedProjects.length === 0}
            className="px-4 py-1.5 rounded bg-[#a43820] hover:bg-[#8e2f19] text-ink text-xs font-semibold disabled:opacity-40 transition-colors "
          >
            Load {parsedProjects.length > 0 ? `${parsedProjects.length} Projects` : "Data"}
          </button>
        </div>
      </div>
    </div>
  );
};
