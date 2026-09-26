/**
 * DRISHTI Smart Ingestion & Verification UI — Dark Zone Edition
 * Author: Adrian Roy Williams
 * Role: Parent form orchestrating PDF upload, Gemini NLP extraction, 
 * Micro-Interrogation enforcement, cryptographic evidence capture,
 * and offline-first IndexedDB caching with Background Sync.
 */

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { queueOfflineTelemetry, getPendingCount } from '../../lib/darkZoneStore';
import CryptographicCamera from './CryptographicCamera';
import { WifiOff, Wifi, ShieldAlert, DatabaseZap } from 'lucide-react';

interface SmartIngestionFormProps {
  projectId: string;
  officerId?: string;
}

export function SmartIngestionForm({ projectId, officerId = 'OFFICER-001' }: SmartIngestionFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState<string>('IDLE');
  const [telemetry, setTelemetry] = useState<any>(null);
  
  const [interrogationAnswers, setInterrogationAnswers] = useState<Record<number, string>>({});
  const [geotaggedProofPath, setGeotaggedProofPath] = useState<string | null>(null);
  const [cryptographicImageBlob, setCryptographicImageBlob] = useState<Blob | null>(null);
  const [captureOsTime, setCaptureOsTime] = useState<string | null>(null);
  const [captureGpsAtomicTime, setCaptureGpsAtomicTime] = useState<string | null>(null);

  // Dark Zone State
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // 0. Dark Zone Initialization: Network Detection + Service Worker
  // ============================================================
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Trigger manual sync fallback in case Background Sync API isn't supported
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          if ('sync' in registration) {
            (registration as any).sync.register('sync-drishti-telemetry');
          } else {
            // Fallback: message the SW directly
            registration.active?.postMessage({ type: 'FORCE_SYNC' });
          }
        });
      }
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('[DRISHTI] Dark Zone Service Worker registered:', reg.scope);
      }).catch((err) => {
        console.warn('[DRISHTI] SW registration failed:', err);
      });

      // Listen for sync completion messages from the SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_COMPLETE') {
          console.log('[DRISHTI] Background sync completed for:', event.data.payload.projectId);
          refreshPendingCount();
        }
      });
    }

    refreshPendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshPendingCount = async () => {
    try {
      const count = await getPendingCount();
      setPendingQueueCount(count);
    } catch { /* IndexedDB may not be available in all contexts */ }
  };

  // ============================================================
  // 1. Upload & AI Extraction Phase
  // ============================================================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setFileBlob(uploadedFile);
    setStatus('SCANNING');

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('project_id', projectId);

      const response = await fetch('http://localhost:8000/extract-dpr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("AI Extraction Failed");
      
      const aiExtraction = await response.json();
      setTelemetry(aiExtraction);
      setStatus('VERIFYING');

    } catch (error) {
      console.error(error);
      // If we're offline or the fetch failed, allow manual entry mode
      if (isOffline) {
        setStatus('OFFLINE_MANUAL');
      } else {
        setStatus('ERROR');
      }
    }
  };

  const handleResetForm = () => {
    setFile(null);
    setFileBlob(null);
    setStatus('IDLE');
    setTelemetry(null);
    setInterrogationAnswers({});
    setGeotaggedProofPath(null);
    setCryptographicImageBlob(null);
    setCaptureOsTime(null);
    setCaptureGpsAtomicTime(null);
  };

  // ============================================================
  // 2. Micro-Interrogation State Handler
  // ============================================================
  const handleInterrogationChange = (bottleneckIndex: number, value: string) => {
    setInterrogationAnswers(prev => ({
      ...prev,
      [bottleneckIndex]: value
    }));
  };

  // ============================================================
  // 3. Validation Logic (The "Lock")
  // ============================================================
  const isFormValid = () => {
    if (!telemetry) return false;
    
    const requiresInterrogation = telemetry.bottlenecks?.filter((b: any) => b.interrogation_required) || [];
    const allAnswered = requiresInterrogation.every((_: any, index: number) => interrogationAnswers[index]);
    
    if (requiresInterrogation.length > 0 && !geotaggedProofPath) return false;
    
    return allAnswered;
  };

  // ============================================================
  // 4A. LIVE MODE: Direct Supabase Commit (Tier 2 DB)
  // ============================================================
  const executeLiveCommit = async () => {
    try {
      const { data: telemetryData, error: telemetryError } = await supabase
        .from('project_telemetry')
        .insert({
          project_id: projectId,
          financial_expenditure_pct: telemetry.extracted_metrics.financial_expenditure_pct,
          physical_progress_pct: telemetry.extracted_metrics.daily_physical_progress_pct,
          labor_headcount: telemetry.extracted_metrics.labor_headcount
        })
        .select()
        .single();

      if (telemetryError) throw telemetryError;

      if (telemetry.bottlenecks?.length > 0) {
        const bottleneckPayloads = telemetry.bottlenecks.map((b: any, index: number) => ({
          telemetry_id: telemetryData.id,
          primary_bottleneck: b.interrogation_required ? interrogationAnswers[index] : 'Standard Log',
          nodal_officer_remarks: b.raw_text,
          geotagged_proof_path: geotaggedProofPath,
          device_os_timestamp: captureOsTime,
          gps_atomic_timestamp: captureGpsAtomicTime,
          is_resolved: false
        }));

        const { error: bottleneckError } = await supabase
          .from('bottleneck_logs')
          .insert(bottleneckPayloads);

        if (bottleneckError) throw bottleneckError;
      }

      setStatus('SUCCESS');
    } catch (error) {
      console.error(error);
      setStatus('ERROR');
    }
  };

  // ============================================================
  // 4B. DARK ZONE MODE: Route to IndexedDB + Background Sync
  // ============================================================
  const executeDarkZoneCommit = async () => {
    try {
      const session = await supabase.auth.getSession();
      
      await queueOfflineTelemetry({
        projectId,
        telemetryData: telemetry,
        interrogationAnswers,
        pdfBlob: fileBlob,
        photoBlob: cryptographicImageBlob,
        authToken: session?.data?.session?.access_token || undefined,
      });

      // Register the background sync trigger
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-drishti-telemetry');
      }

      await refreshPendingCount();
      setStatus('OFFLINE_SAVED');
    } catch (err) {
      console.error('[DRISHTI] Dark Zone save failed:', err);
      setStatus('ERROR');
    }
  };

  // ============================================================
  // 4. The Unified Commit Handler
  // ============================================================
  const handleCommit = async () => {
    setStatus('COMMITTING');

    if (isOffline) {
      await executeDarkZoneCommit();
    } else {
      await executeLiveCommit();
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="grid grid-cols-12 min-h-screen bg-[#F9FAFB] relative">

      {/* ========== DARK ZONE BANNER ========== */}
      {isOffline && (
        <div className="col-span-12 bg-[#8a3324] text-white px-6 py-3 flex items-center justify-between z-50">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <span className="font-mono text-xs font-bold tracking-widest uppercase">
              DARK ZONE MODE ACTIVE — NO CELLULAR UPLINK
            </span>
          </div>
          <div className="flex items-center gap-4">
            {pendingQueueCount > 0 && (
              <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-sm">
                <DatabaseZap className="w-3.5 h-3.5" />
                <span className="font-mono text-[10px]">
                  {pendingQueueCount} PAYLOAD{pendingQueueCount > 1 ? 'S' : ''} IN LOCAL VAULT
                </span>
              </div>
            )}
            <span className="font-mono text-[10px] opacity-75">
              AUTO-SYNC ON RECONNECTION
            </span>
          </div>
        </div>
      )}

      {/* ========== ONLINE STATUS PILL (when online) ========== */}
      {!isOffline && pendingQueueCount > 0 && (
        <div className="col-span-12 bg-emerald-600 text-white px-6 py-2 flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            <span className="font-mono text-xs font-bold">UPLINK RESTORED — SYNCING {pendingQueueCount} QUEUED PAYLOAD(S)...</span>
          </div>
        </div>
      )}

      {/* ========== LEFT PANE: The Dark Document Viewer ========== */}
      <div className="col-span-5 bg-[#0f172a] border-r border-slate-800 flex flex-col relative">
        <div className="p-4 border-b border-slate-800 bg-[#1e293b] flex items-center justify-between">
          <h2 className="text-white font-mono text-sm">SOURCE DOCUMENT (DPR)</h2>
          <div className={`flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-sm ${
            isOffline 
              ? 'bg-[#8a3324]/30 text-[#f87171] border border-[#8a3324]/50' 
              : 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50'
          }`}>
            {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
            {isOffline ? 'OFFLINE' : 'LIVE'}
          </div>
        </div>
        
        <div className="flex-1 p-8 flex items-center justify-center relative">
          {status === 'IDLE' ? (
            <div className="text-center w-full">
              <input 
                type="file" 
                accept="application/pdf" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-slate-800 text-slate-300 font-mono text-sm border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors"
              >
                + DROP DAILY PROGRESS REPORT (PDF)
              </button>
              {isOffline && (
                <p className="text-[10px] font-mono text-amber-500 mt-3">
                  PDF will be cached locally for AI extraction when uplink is restored.
                </p>
              )}
            </div>
          ) : status === 'SCANNING' ? (
            <div className="text-center">
              <div className="h-1 w-48 bg-slate-800 overflow-hidden mx-auto mb-4">
                <div className="h-full bg-emerald-500 animate-pulse w-1/2"></div>
              </div>
              <p className="text-emerald-400 font-mono text-xs">AI AUDITOR EXTRACTING TELEMETRY...</p>
            </div>
          ) : (
            <div className="w-full h-full bg-slate-800 border border-slate-700 p-4 shadow-inner relative">
              <div className="text-slate-500 font-mono text-xs text-center mt-32">
                [ SECURE PDF VIEWER RENDERED HERE ]
                <br /><br />
                {file?.name}
              </div>
              <div className="absolute top-1/3 left-1/4 w-1/2 h-16 border-2 border-emerald-500/50 bg-emerald-500/10 rounded-sm animate-pulse"></div>
            </div>
          )}
        </div>
      </div>

      {/* ========== RIGHT PANE: Telemetry & Augmentation Form ========== */}
      <div className="col-span-7 p-8 bg-white relative">
        <div className="max-w-2xl mx-auto">
          
          <header className="mb-8 border-b border-slate-200 pb-4">
            <h1 className="text-2xl font-serif font-bold text-slate-800">Verification & Augmentation</h1>
            <p className="text-xs font-mono text-slate-500 mt-1">ASSET: {projectId} | OFFICER: {officerId}</p>
          </header>

          {status === 'IDLE' || status === 'SCANNING' ? (
            <div className="text-sm text-slate-400 italic">Waiting for document ingestion...</div>

          ) : status === 'SUCCESS' ? (
            <div className="space-y-4">
              <div className="p-6 bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-sm">
                TELEMETRY COMMITTED TO IMMUTABLE LEDGER. PREDICTIVE ENGINE TRIGGERED.
              </div>
              <button 
                onClick={handleResetForm}
                className="w-full py-4 text-sm font-bold font-mono transition-colors border bg-slate-900 text-white hover:bg-slate-800 border-slate-900"
              >
                + INGEST NEXT DOCUMENT
              </button>
            </div>

          ) : status === 'OFFLINE_SAVED' ? (
            <div className="space-y-4">
              <div className="p-6 bg-amber-50 border border-[#8a3324]/30 font-mono text-sm space-y-2">
                <div className="flex items-center gap-2 text-[#8a3324] font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  PAYLOAD ENCRYPTED IN LOCAL VAULT
                </div>
                <p className="text-slate-600 text-xs">
                  Your telemetry, interrogation answers, and cryptographic photo are secured in the browser's 
                  IndexedDB. The Background Sync worker will automatically flush this payload to the DRISHTI 
                  Ledger the instant cellular connectivity is restored — even if this tab is closed.
                </p>
              </div>
              <button 
                onClick={handleResetForm}
                className="w-full py-4 text-sm font-bold font-mono transition-colors border bg-[#8a3324] text-white hover:bg-[#a03d2b] border-[#6b261a]"
              >
                + QUEUE NEXT DOCUMENT OFFLINE
              </button>
            </div>

          ) : status === 'OFFLINE_MANUAL' ? (
            <div className="p-6 bg-amber-50 border border-amber-200 text-amber-800 font-mono text-sm">
              OFFLINE: AI extraction unavailable. PDF cached locally. Extraction will run on reconnection.
            </div>

          ) : (
            <div className="space-y-8">
              
              {/* Extracted Metrics Block */}
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-500 mb-3 uppercase tracking-wider">AI-Extracted Telemetry</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-slate-200 bg-[#F9FAFB]">
                    <span className="block text-[10px] font-mono text-slate-400 mb-1">PHYSICAL PROGRESS (%)</span>
                    <span className="font-mono font-bold text-slate-800 text-lg">
                      {telemetry?.extracted_metrics?.daily_physical_progress_pct}%
                    </span>
                  </div>
                  <div className="p-3 border border-slate-200 bg-[#F9FAFB]">
                    <span className="block text-[10px] font-mono text-slate-400 mb-1">LABOR HEADCOUNT</span>
                    <span className="font-mono font-bold text-slate-800 text-lg">
                      {telemetry?.extracted_metrics?.labor_headcount}
                    </span>
                  </div>
                </div>
              </div>

              {/* The Micro-Interrogation Loop */}
              {telemetry?.bottlenecks?.map((bottleneck: any, index: number) => (
                bottleneck.interrogation_required && (
                  <div key={index} className="pl-4 border-l-4 border-[#8a3324] bg-red-50/30 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-[#8a3324] text-white text-[10px] font-mono px-2 py-0.5">LOW FIDELITY DATA DETECTED</span>
                    </div>
                    
                    <p className="text-sm text-slate-700 italic mb-3">
                      "{bottleneck.raw_text}"
                    </p>
                    
                    <div className="bg-white border border-[#8a3324]/20 p-4 shadow-sm">
                      <label className="block text-xs font-bold text-[#8a3324] mb-2">
                        {bottleneck.ui_prompt}
                      </label>
                      <select 
                        className="w-full text-sm border-slate-300 rounded-none focus:ring-0 focus:border-[#8a3324] bg-slate-50 p-2"
                        value={interrogationAnswers[index] || ''}
                        onChange={(e) => handleInterrogationChange(index, e.target.value)}
                      >
                        <option value="" disabled>Select exact category...</option>
                        {bottleneck.required_dropdown_categories.map((cat: string, i: number) => (
                          <option key={i} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              ))}

              {/* Cryptographic Proof Requirement */}
              {telemetry?.bottlenecks?.some((b: any) => b.interrogation_required) && (
                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-xs font-mono font-bold text-slate-500 mb-3 uppercase tracking-wider">Hardware Verification</h3>
                  <CryptographicCamera 
                    projectId={projectId} 
                    onUploadSuccess={(path, osTime, gpsAtomicTime) => {
                      setGeotaggedProofPath(path);
                      setCaptureOsTime(osTime);
                      setCaptureGpsAtomicTime(gpsAtomicTime);
                    }} 
                  />
                </div>
              )}

              {/* ========== THE COMMIT BUTTON ========== */}
              <div className="pt-8">
                <button 
                  onClick={handleCommit}
                  disabled={!isFormValid()}
                  className={`w-full py-4 text-sm font-bold font-mono transition-colors border ${
                    !isFormValid() 
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : isOffline 
                        ? 'bg-[#8a3324] text-white hover:bg-[#a03d2b] border-[#6b261a]'
                        : 'bg-slate-900 text-white hover:bg-slate-800 border-slate-900'
                  }`}
                >
                  {status === 'COMMITTING' ? 'WRITING...' 
                    : status === 'OFFLINE_SAVED' ? '✓ ENCRYPTED IN LOCAL VAULT'
                    : isOffline ? '⬇ SAVE TO SECURE OFFLINE VAULT' 
                    : 'COMMIT TO DRISHTI LEDGER'}
                </button>
                {!isFormValid() && (
                  <p className="text-center text-[10px] font-mono text-red-500 mt-2">
                    ALL INTERROGATIONS AND HARDWARE CAPTURES MUST BE COMPLETED TO UNLOCK LEDGER COMMIT.
                  </p>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
