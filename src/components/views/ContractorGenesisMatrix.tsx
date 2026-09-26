/**
 * DRISHTI Contractor Genesis Risk Matrix
 * Author: Adrian Roy Williams
 * Role: Procurement interface evaluating bidder telemetry and enforcing 
 * algorithmic risk recommendations before contract award.
 */

import React, { useState } from 'react';

export function ContractorGenesisMatrix() {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  // Simulated bidder data from the e-Procurement portal
  const activeBidder = {
    contractor_id: "IN-LNT-8492",
    company_name: "Apex Infrastructure Solutions",
    bid_amount_cr: 450.5,
    telemetry: {
      past_projects_completed: 12,
      avg_delay_variance_days: 145,
      active_litigation_count: 3,
      current_liquidity_ratio: 0.85,
      subcontractor_churn_pct: 18.5
    }
  };

  const runGenesisEngine = async () => {
    setIsEvaluating(true);
    
    try {
      // API call to the mock Genesis Engine on the backend
      const response = await fetch('/api/evaluate-bidder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractor_id: activeBidder.contractor_id,
          company_name: activeBidder.company_name,
          ...activeBidder.telemetry
        })
      });
      
      const result = await response.json();
      setTimeout(() => {
        setEvaluationResult(result);
        setIsEvaluating(false);
      }, 1500); // Artificial delay to simulate ML processing

    } catch (err) {
      console.error(err);
      setIsEvaluating(false);
    }
  };

  return (
    <div className="grid grid-cols-12 min-h-[500px] bg-white border border-slate-200">
      
      {/* LEFT PANE: Bidder Telemetry Dossier */}
      <div className="col-span-5 p-6 border-r border-slate-200 bg-[#F9FAFB]">
        <header className="mb-6">
          <h2 className="text-xl font-serif font-bold text-slate-800">Tender Evaluation Node</h2>
          <p className="text-xs font-mono text-slate-500 mt-1">L1 BIDDER PROFILE</p>
        </header>

        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-800">{activeBidder.company_name}</h3>
          <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 mt-1 inline-block">
            ID: {activeBidder.contractor_id}
          </span>
          <p className="mt-4 text-sm text-slate-600 border-l-2 border-slate-300 pl-3">
            Bid Amount: <strong className="font-mono text-slate-800">₹{activeBidder.bid_amount_cr} Cr</strong>
          </p>
        </div>

        <div className="space-y-3">
          <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase">5-Year Historical Telemetry</span>
          
          <div className="flex justify-between text-xs border-b border-slate-200 pb-2">
            <span className="text-slate-500">Completed Mega-Projects</span>
            <span className="font-mono font-bold">{activeBidder.telemetry.past_projects_completed}</span>
          </div>
          <div className="flex justify-between text-xs border-b border-slate-200 pb-2">
            <span className="text-slate-500">Avg. Delay Variance</span>
            <span className="font-mono font-bold text-amber-600">+{activeBidder.telemetry.avg_delay_variance_days} Days</span>
          </div>
          <div className="flex justify-between text-xs border-b border-slate-200 pb-2">
            <span className="text-slate-500">Active Litigations/Stays</span>
            <span className="font-mono font-bold text-red-600">{activeBidder.telemetry.active_litigation_count}</span>
          </div>
          <div className="flex justify-between text-xs pb-2">
            <span className="text-slate-500">Liquidity Ratio (Acid Test)</span>
            <span className="font-mono font-bold">{activeBidder.telemetry.current_liquidity_ratio}</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Genesis Matrix Output */}
      <div className="col-span-7 p-8 flex flex-col justify-center relative">
        {!evaluationResult ? (
          <div className="text-center w-full">
            <button 
              onClick={runGenesisEngine}
              disabled={isEvaluating}
              className="px-6 py-3 bg-slate-900 text-white font-mono text-sm font-bold border border-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isEvaluating ? 'EXECUTING RANDOM FOREST ENSEMBLE...' : 'RUN GENESIS RISK EVALUATION'}
            </button>
            {isEvaluating && (
              <div className="mt-4 h-1 w-64 bg-slate-100 mx-auto overflow-hidden">
                <div className="h-full bg-emerald-500 w-1/3 animate-pulse"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in w-full max-w-md mx-auto">
            
            <div className={`p-6 border mb-6 ${
              evaluationResult.render_color === 'mahogany' ? 'bg-[#8a3324]/5 border-[#8a3324] text-[#8a3324]' :
              evaluationResult.render_color === 'amber' ? 'bg-amber-50 border-amber-400 text-amber-800' :
              'bg-emerald-50 border-emerald-400 text-emerald-800'
            }`}>
              <span className="block text-[10px] font-mono mb-2 uppercase tracking-widest">
                Probability of Project Default
              </span>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-5xl font-mono font-bold">
                  {(evaluationResult.genesis_score * 100).toFixed(1)}%
                </span>
                <span className="text-sm font-bold pb-1 uppercase">{evaluationResult.risk_tier}</span>
              </div>
            </div>

            <div className="mb-8">
              <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-3">
                Primary Risk Drivers
              </span>
              <ul className="space-y-2">
                {evaluationResult.primary_risk_drivers.map((driver: string, i: number) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className={`mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                      evaluationResult.render_color === 'mahogany' ? 'bg-[#8a3324]' : 'bg-emerald-500'
                    }`}></span>
                    {driver}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-200">
              <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase">
                Algorithmic Mandate
              </span>
              
              {evaluationResult.recommended_action === 'REJECT_TECHNICAL_BID' ? (
                <button className="w-full py-3 bg-white text-[#8a3324] border border-[#8a3324] font-mono text-xs font-bold hover:bg-red-50 transition-colors cursor-pointer">
                  EXECUTE BID REJECTION (BLACKLIST PROTOCOL)
                </button>
              ) : (
                <button className="w-full py-3 bg-emerald-600 text-white font-mono text-xs font-bold hover:bg-emerald-500 transition-colors cursor-pointer">
                  AUTHORIZE PROCUREMENT (L1 AWARD)
                </button>
              )}
              
              <button className="w-full py-3 bg-transparent text-slate-500 border border-slate-300 border-dashed font-mono text-xs hover:bg-slate-50 transition-colors cursor-pointer">
                OVERRIDE AI MANDATE (REQUIRES PMG PIN)
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
