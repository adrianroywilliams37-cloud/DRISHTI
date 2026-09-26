import React, { useEffect, useState } from 'react';

interface FraudEvent {
  worker_id: string;
  project_id: string;
  previous_project_id: string;
  time_diff_mins: string;
  timestamp: string;
}

// Renders inside the PMG Dashboard
export function BiometricFraudNode({ projectId }: { projectId: string }) {
  const [fraudEvents, setFraudEvents] = useState<FraudEvent[]>([]);

  useEffect(() => {
    const fetchFraudEvents = async () => {
      try {
        // Fetch from local node server since Supabase is mocked for the hackathon
        const response = await fetch('/api/biometric/status');
        const data = await response.json();
        if (data.frauds) {
          // Filter frauds for this specific project
          const relevantFrauds = data.frauds.filter((f: FraudEvent) => f.project_id === projectId);
          setFraudEvents(relevantFrauds);
        }
      } catch (err) {
        console.error("Failed to fetch biometric status", err);
      }
    };

    if (projectId) {
      fetchFraudEvents();
    }

    // Poll every 2 seconds for the live demo effect
    const intervalId = setInterval(fetchFraudEvents, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, [projectId]);

  if (fraudEvents.length === 0) return null; // Only render if fraud is detected

  return (
    <div className="p-4 border bg-[#8a3324]/10 border-[#8a3324] mt-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-mono font-bold uppercase text-slate-600">Liveness verification</span>
        <span className="bg-[#8a3324] text-white text-[10px] font-mono px-2 py-0.5 animate-pulse">
            SPOOFING DETECTED
        </span>
      </div>
      <div className="flex flex-col gap-2 mt-3">
        {fraudEvents.map((event, idx) => (
            <div key={idx} className="text-sm">
                <span className={`text-xl font-mono font-bold text-[#8a3324]`}>
                CRITICAL WARNING
                </span>
                <p className="mt-1 text-xs font-mono text-[#8a3324] border-t border-[#8a3324]/20 pt-2">
                Worker {event.worker_id} flagged for impossible travel. Checked in here just {event.time_diff_mins} mins after checking into Project {event.previous_project_id}. DBT Escrow Frozen.
                </p>
            </div>
        ))}
      </div>
    </div>
  );
}
