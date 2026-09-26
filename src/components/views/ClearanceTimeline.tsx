import React from 'react';
import { Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface TimelineEvent {
  id: string;
  agency: string;
  action: string;
  date: string;
  status: 'approved' | 'pending' | 'rejected' | 'in_progress';
  delayDays: number;
  notes?: string;
}

const mockEvents: TimelineEvent[] = [
  {
    id: 'EVT-001',
    agency: 'Ministry of Environment',
    action: 'Forest Clearance Phase 1',
    date: '2025-01-15',
    status: 'approved',
    delayDays: 0,
    notes: 'Initial clearance granted based on preliminary environmental impact assessment.'
  },
  {
    id: 'EVT-002',
    agency: 'State Land Authority',
    action: 'Land Acquisition Request',
    date: '2025-03-10',
    status: 'approved',
    delayDays: 14,
    notes: 'Approved after a 14-day delay due to local panchayat disputes.'
  },
  {
    id: 'EVT-003',
    agency: 'Ministry of Finance',
    action: 'Tranche 2 Fund Disbursal',
    date: '2025-08-05',
    status: 'pending',
    delayDays: 45,
    notes: 'Pending review of utilization certificates from Tranche 1.'
  },
  {
    id: 'EVT-004',
    agency: 'National Highways Authority',
    action: 'Utility Shifting Clearance',
    date: '2025-09-20',
    status: 'in_progress',
    delayDays: 12,
  }
];

export function ClearanceTimeline() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="bg-white p-6 border border-slate-200 rounded-sm shadow-sm max-w-3xl">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h3 className="text-sm uppercase font-bold text-slate-700 tracking-wide">Immutable Audit Ledger</h3>
        <p className="text-xs text-slate-500 mt-1">Inter-ministerial requests, clearances, and bottleneck tracking.</p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="relative border-l border-slate-200 ml-3 space-y-8"
      >
        {mockEvents.map((event, idx) => (
          <motion.div key={event.id} variants={itemVariants} className="pl-6 relative">
            {/* Timeline Node */}
            <motion.div 
              whileHover={{ scale: 1.2 }}
              className={`absolute -left-3 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white z-10 ${
                event.status === 'approved' ? 'border-emerald-500 text-emerald-500' :
                event.status === 'pending' ? 'border-red-500 text-red-500' :
                event.status === 'in_progress' ? 'border-amber-500 text-amber-500' :
                'border-slate-400 text-slate-400'
              }`}
            >
              {event.status === 'approved' && <CheckCircle className="w-3.5 h-3.5" />}
              {event.status === 'pending' && <AlertCircle className="w-3.5 h-3.5" />}
              {event.status === 'in_progress' && <RefreshCw className="w-3 h-3" />}
            </motion.div>

            <motion.div 
              whileHover={{ x: 5, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}
              className="bg-slate-50 p-4 border border-slate-200 rounded-sm transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{event.agency}</span>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight mt-0.5">{event.action}</h4>
                </div>
                <div className="text-xs font-mono text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-sm">
                  {event.date}
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-3">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm border ${
                  event.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  event.status === 'pending' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {event.status.replace('_', ' ')}
                </span>
                
                {event.delayDays > 0 && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                    <Clock className="w-3.5 h-3.5" /> {event.delayDays} Days Delay
                  </span>
                )}
              </div>

              {event.notes && (
                <div className="mt-3 text-xs text-slate-600 border-t border-slate-200 pt-3">
                  <span className="font-semibold">Audit Note:</span> {event.notes}
                </div>
              )}
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
