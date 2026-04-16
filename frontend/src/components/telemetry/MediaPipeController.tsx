'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * TENSOR '26 HIGH-INTEGRITY MEDIAPIPE CONTROLLER
 * Bypasses Turbopack static analysis failures for UMD modules.
 */
export default function MediaPipeController({ onTelemetry }: { onTelemetry: (data: any) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('Initializing Forensic Engine...');

  useEffect(() => {
    let faceMesh: any = null;
    let camera: any = null;

    const startForensicPulse = async () => {
      try {
        // 1. DYNAMICALLY LOAD LEGACY PACKAGES (Bypass static export checks)
        const fm = await import('@mediapipe/face_mesh');
        const cu = await import('@mediapipe/camera_utils');

        // 2. EXTRACT CONSTRUCTORS FROM UMD WRAPPER
        const FaceMeshConstructor = fm.FaceMesh || (fm as any).default;
        const CameraConstructor = cu.Camera || (cu as any).default;

        if (!FaceMeshConstructor || !CameraConstructor) {
           throw new Error('Neural primitives not resolved');
        }

        faceMesh = new FaceMeshConstructor({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        faceMesh.onResults((results: any) => {
          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            onTelemetry({
              gaze: { x: landmarks[468].x, y: landmarks[468].y },
              lipSync: Math.abs(landmarks[13].y - landmarks[14].y),
              isLookingAway: landmarks[468].x < 0.4 || landmarks[468].x > 0.6,
              t: Date.now()
            });
          }
        });

        if (videoRef.current) {
          camera = new CameraConstructor(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current) await faceMesh.send({ image: videoRef.current });
            },
            width: 640,
            height: 480,
          });
          camera.start();
          setStatus('Neural Pulse Active');
        }
      } catch (err) {
        console.error('Forensic Engine Crash:', err);
        setStatus('Engine Offline');
      }
    };

    if (typeof window !== 'undefined') {
       startForensicPulse();
    }

    return () => {
      if (camera) camera.stop();
      if (faceMesh) faceMesh.close();
    };
  }, [onTelemetry]);

  return (
    <div className="relative w-full h-full bg-black/40 rounded-[32px] overflow-hidden group border border-white/5">
      <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1] opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/80 backdrop-blur-xl rounded-full border border-white/10">
         <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${status.includes('Active') ? 'bg-cyan-500 shadow-[0_0_10px_#00f2ff]' : 'bg-red-500'}`} />
         <span className="text-[8px] font-black uppercase text-white tracking-[0.2em]">{status}</span>
      </div>
      <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-[32px] group-hover:border-cyan-500/20 transition-all duration-500" />
    </div>
  );
}
