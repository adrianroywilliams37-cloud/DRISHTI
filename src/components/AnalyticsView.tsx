import React, { useMemo } from "react";
import { Project } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AnalyticsViewProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
}

// Mock historical data for the trend chart since we only have current data
const mockTrendData = [
  { cycle: "Q3'24", escalationPct: 15 },
  { cycle: "Q4'24", escalationPct: 16.5 },
  { cycle: "Q1'25", escalationPct: 17 },
  { cycle: "Q2'25", escalationPct: 18.2 },
  { cycle: "Q3'25", escalationPct: 19 },
  { cycle: "Q4'25", escalationPct: 20.1 },
  { cycle: "Q1'26", escalationPct: 21.2 },
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  projects,
}) => {
  // 1. Sector Risk Distribution (Horizontal Stacked Bar)
  const sectorData = useMemo(() => {
    const map: Record<string, { sector: string; High: number; Medium: number; Low: number }> = {};
    projects.forEach((p) => {
      if (!map[p.sector]) {
        map[p.sector] = { sector: p.sector, High: 0, Medium: 0, Low: 0 };
      }
      map[p.sector][p.riskBand]++;
    });
    return Object.values(map);
  }, [projects]);

  // 3. Portfolio Value Share by Ministry (Donut)
  const ministryData = useMemo(() => {
    const map: Record<string, number> = {};
    projects.forEach((p) => {
      const ministry = p.implementing_agency.split(' ')[0] || "Other"; // Simplified grouping
      map[ministry] = (map[ministry] || 0) + p.latest_revised_cost_cr;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    
    // Group small ones into "Other" if there are many
    const top = sorted.slice(0, 5);
    const others = sorted.slice(5).reduce((sum, [_, val]) => sum + val, 0);
    if (others > 0) {
      top.push(["Other", others]);
    }
    
    return top.map(([name, value]) => ({ name, value }));
  }, [projects]);

  const catColors = [
    "var(--color-cat1)",
    "var(--color-cat2)",
    "var(--color-cat5)",
    "var(--color-cat6)",
    "var(--color-cat3)",
    "var(--color-cat4)"
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-paper border border-ink px-3 py-2 text-[12px] font-sans">
          <div className="font-semibold text-ink mb-1">{label || payload[0]?.name}</div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center gap-2">
              <span className="w-2 h-2" style={{ backgroundColor: entry.color }}></span>
              <span className="text-ink-70 capitalize">{entry.name}:</span>
              <span className="font-mono text-ink">
                {entry.name === 'escalationPct' 
                  ? `${entry.value}%` 
                  : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-baseline mb-4">
        <h2 className="text-[17px] font-semibold font-serif m-0">Macro analytics</h2>
        <div className="text-[12.5px] text-ink/45 font-sans">
          Portfolio-wide trends and distributions
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1px] bg-ink/15 border border-ink/15">
        
        {/* Panel 1: Horizontal Stacked Bar */}
        <div className="bg-paper p-5">
          <h3 className="text-[13.5px] font-medium font-sans mb-0.5 text-ink">Risk distribution by sector</h3>
          <div className="text-[11px] text-ink/45 mb-4 font-sans">stacked project count, low / medium / high</div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={sectorData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="var(--color-ink-18)" horizontal={false} />
                <XAxis type="number" stroke="var(--color-ink-45)" fontSize={10} fontFamily="var(--font-mono)" tickLine={false} axisLine={false} />
                <YAxis dataKey="sector" type="category" stroke="var(--color-ink-70)" fontSize={10.5} fontFamily="var(--font-sans)" tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--color-ink-18)', opacity: 0.2}} />
                <Legend wrapperStyle={{ fontSize: "10.5px", fontFamily: "var(--font-sans)", paddingTop: "10px" }} iconType="square" iconSize={8} />
                <Bar dataKey="Low" name="Low" stackId="a" fill="var(--color-teal)" isAnimationActive={false} />
                <Bar dataKey="Medium" name="Medium" stackId="a" fill="var(--color-ochre)" isAnimationActive={false} />
                <Bar dataKey="High" name="High" stackId="a" fill="var(--color-mahogany)" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 2: Trend Area Chart */}
        <div className="bg-paper p-5">
          <h3 className="text-[13.5px] font-medium font-sans mb-0.5 text-ink">Cost escalation trend</h3>
          <div className="text-[11px] text-ink/45 mb-4 font-sans">portfolio-wide, last 6 reporting cycles</div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="var(--color-ink-18)" vertical={false} />
                <XAxis dataKey="cycle" stroke="var(--color-ink-45)" fontSize={10} fontFamily="var(--font-mono)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-ink-45)" fontSize={10} fontFamily="var(--font-mono)" tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip content={<CustomTooltip />} cursor={{stroke: 'var(--color-ink)', strokeWidth: 1}} />
                <Area type="linear" dataKey="escalationPct" name="escalationPct" stroke="var(--color-teal)" strokeWidth={1.5} fill="var(--color-teal)" fillOpacity={0.18} isAnimationActive={false} activeDot={{r: 4, fill: 'var(--color-teal)', stroke: 'var(--color-paper)', strokeWidth: 1}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 3: Donut Chart */}
        <div className="bg-paper p-5">
          <h3 className="text-[13.5px] font-medium font-sans mb-0.5 text-ink">Portfolio by ministry</h3>
          <div className="text-[11px] text-ink/45 mb-4 font-sans">share of total outlay</div>
          <div className="h-[220px] w-full flex flex-col items-center">
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ministryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {ministryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={catColors[index % catColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend for Pie to save space and match spec */}
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-2">
              {ministryData.map((entry, idx) => (
                <div key={idx} className="flex items-center text-[10.5px] font-sans text-ink-70">
                  <span className="w-2 h-2 mr-1.5 block" style={{ backgroundColor: catColors[idx % catColors.length] }}></span>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
