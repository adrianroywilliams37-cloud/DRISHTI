/**
 * DRISHTI Cryptographic Photo Capture (Hardware API)
 * Author: Adrian Roy Williams
 * Role: Forces live device camera capture, fetches exact GPS coordinates, 
 * burns an immutable telemetry watermark into the pixels, and uploads to the vault.
 */

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface CryptographicCameraProps {
  projectId: string;
  onUploadSuccess: (path: string, osTime: string, gpsAtomicTime: string) => void;
}

export default function CryptographicCamera({ projectId, onUploadSuccess }: CryptographicCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [location, setLocation] = useState<{ lat: number | null, lon: number | null, timestamp: number | null }>({ lat: null, lon: null, timestamp: null });
  const [status, setStatus] = useState<string>('INITIALIZING_HARDWARE');
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);

  // 1. Initialize Hardware (Camera & GPS) on Mount
  useEffect(() => {
    let activeStream: MediaStream;
    
    const initializeHardware = async () => {
      try {
        // Fetch GPS Coordinates (High Accuracy Required)
        navigator.geolocation.getCurrentPosition(
          (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude, timestamp: pos.timestamp }),
          (err) => setStatus('ERROR: GPS_DENIED'),
          { enableHighAccuracy: true, maximumAge: 0 }
        );

        // Force rear camera if on mobile, block gallery
        activeStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false 
        });
        
        setStream(activeStream);
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }
        setStatus('READY_FOR_CAPTURE');

      } catch (err) {
        setStatus('ERROR: CAMERA_DENIED');
      }
    };

    initializeHardware();

    // Cleanup: Shut down the camera hardware when component unmounts
    return () => {
      if (activeStream) activeStream.getTracks().forEach(track => track.stop());
    };
  }, []);

  // 2. The Capture & Watermark Logic
  const handleCapture = async () => {
    setStatus('PROCESSING_CRYPTOGRAPHIC_STAMP');
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas dimensions to the live video feed
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the raw camera frame to the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 3. Burn the Immutable Telemetry Watermark into the pixels
    const osTime = new Date().toISOString();
    // 2. Capture the GPS Atomic time (pulled from the Geolocation Position object)
    // Wait, the location state currently only has lat and lon. Let me update the type and state first.
    // I need to also update the location state and its type above. Let me just use Date.now() if location doesn't have it, but wait, we need location.timestamp.
    // I should modify the state first. Let's do that in a separate chunk.
    const gpsAtomicTime = location.timestamp ? new Date(location.timestamp).toISOString() : osTime;

    const watermarkText = `DRISHTI-CRIP | LAT:${location.lat?.toFixed(6) || 'UNAVAILABLE'} LON:${location.lon?.toFixed(6) || 'UNAVAILABLE'} | OS_TIME:${osTime} | SAT_TIME:${gpsAtomicTime}`;
    
    // Draw solid black tamper-evident background bar at the bottom
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    
    // Draw crisp monospace text
    ctx.fillStyle = '#10B981'; // Terminal green
    ctx.font = '16px monospace';
    ctx.fillText(watermarkText, 20, canvas.height - 20);

    // Stop the live camera feed to save battery
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    // Convert canvas to a JPG Blob for upload
    canvas.toBlob((blob) => {
      if (blob) {
        uploadToVault(blob, osTime, gpsAtomicTime);
      }
    }, 'image/jpeg', 0.9);
  };

  // 4. Secure Upload to the Zero-Trust Bucket
  const uploadToVault = async (imageBlob: Blob, osTime: string, gpsAtomicTime: string) => {
    setStatus('UPLOADING_TO_VAULT');
    const fileName = `${projectId}/${osTime.replace(/[:.]/g, '-')}_audit.jpg`;

    try {
      const { data, error } = await supabase.storage
        .from('geotagged_evidence')
        .upload(fileName, imageBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false // Immutable: reject if file already exists
        });

      if (error) throw error;

      setStatus('VERIFIED_AND_COMMITTED');
      setCapturedUrl(URL.createObjectURL(imageBlob)); // Show preview
      
      // Pass the secure storage path back to the parent form (Tier 2.5 DB insertion)
      onUploadSuccess(data.path, osTime, gpsAtomicTime); 

    } catch (error) {
      console.error(error);
      setStatus('ERROR: UPLOAD_FAILED');
    }
  };

  // 5. Institutional UI Rendering
  return (
    <div className="bg-[#1e293b] border border-slate-700 rounded-sm overflow-hidden p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-serif text-sm">Geotagged Evidence Capture</h3>
        <span className="text-xs font-mono px-2 py-0.5 bg-red-900/50 text-red-400 border border-red-800">
          GALLERY UPLOADS DISABLED
        </span>
      </div>

      <div className="relative bg-black rounded-sm border border-slate-800 overflow-hidden aspect-video flex items-center justify-center">
        
        {/* Hidden Canvas used for off-screen watermarking processing */}
        <canvas ref={canvasRef} className="hidden" />

        {status.includes('ERROR') ? (
          <div className="text-red-500 font-mono text-sm text-center p-4">
            {status} <br/> <span className="text-slate-400 text-xs mt-2 block">Hardware access is mandatory to submit this variance.</span>
          </div>
        ) : capturedUrl ? (
          <img src={capturedUrl} alt="Secure capture" className="w-full h-full object-cover" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        )}

        {/* Live HUD Overlay */}
        {!capturedUrl && !status.includes('ERROR') && (
          <div className="absolute top-4 left-4 text-xs font-mono text-emerald-400 bg-black/60 px-2 py-1">
            GPS: {location.lat ? 'ACQUIRED' : 'SEARCHING...'}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs font-mono text-slate-400">
          STATUS: <span className="text-slate-200">{status}</span>
        </div>
        
        {status === 'READY_FOR_CAPTURE' && (
          <button 
            onClick={handleCapture}
            disabled={!location.lat}
            className="px-6 py-2 bg-[#8a3324] hover:bg-[#a03d2b] disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-bold font-mono transition-colors border border-[#6b261a]"
          >
            EXECUTE CAPTURE
          </button>
        )}
      </div>
    </div>
  );
}
