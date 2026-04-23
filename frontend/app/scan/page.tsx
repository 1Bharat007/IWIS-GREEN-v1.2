"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Image from "next/image";

export default function ScanPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    const reader = new FileReader();

    reader.onloadend = async () => {
      setLoading(true);
      setResult(null);

      const base64 = reader.result as string;
      setPreview(base64);

      // Extract GPS before mapping
      let lat = null;
      let lng = null;
      try {
        if ("geolocation" in navigator) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        }
      } catch (err) {
        console.warn("Geolocation blocked or timed out, continuing without coords.");
      }

      // Simulated AI processing delay
      await new Promise((res) => setTimeout(res, 2000));

      try {
        const data = await apiFetch("/waste/scan", {
          method: "POST",
          body: JSON.stringify({ image: base64, lat, lng }),
        });

        setResult(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn py-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-3xl mb-2">
            📸
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">Smart Waste Scanner</h1>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            Upload an image of your waste. Our AI will analyze it to suggest the best disposal method and calculate your CO₂ savings.
          </p>
        </div>

        {!preview && !loading && !result && (
          <div className="mt-8 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-3xl p-12 text-center bg-neutral-50 dark:bg-[#1E293B]/50 hover:bg-neutral-100 dark:hover:bg-[#1E293B] transition-colors cursor-pointer group relative overflow-hidden">
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            <div className="space-y-4 relative z-0">
              <div className="w-20 h-20 mx-auto rounded-full bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              </div>
              <div>
                <p className="text-lg font-medium text-neutral-900 dark:text-white">Click to upload image</p>
                <p className="text-sm text-neutral-500">or drag and drop</p>
              </div>
            </div>
          </div>
        )}

        {preview && loading && (
          <div className="relative w-full max-w-md mx-auto rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-lg">
            <div className="relative aspect-square w-full bg-black/5 flex items-center justify-center">
              <img src={preview} alt="Scanning" className="object-contain w-full h-full opacity-50 blur-[2px]" />
              
              {/* Scanning Laser Animation */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="w-full h-1 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] absolute animate-scanline" />
                <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay animate-pulse" />
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-900/80 backdrop-blur-md text-white px-6 py-3 rounded-full font-medium flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                AI is analyzing...
              </div>
            </div>
          </div>
        )}

        {result && preview && (
          <div className="grid md:grid-cols-2 gap-8 animate-fadeIn">
            <div className="relative aspect-square rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <img src={preview} alt="Result" className="object-cover w-full h-full" />
              <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                Verified
              </div>
            </div>

            <div className="space-y-6 flex flex-col justify-center">
              <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1E293B] shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Detected Material</p>
                    <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">{result.category}</h2>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xl">
                    {result.category === 'Plastic' ? '🥤' : result.category === 'Metal' ? '🥫' : result.category === 'Glass' ? '🍾' : result.category === 'Organic' ? '🥬' : '♻️'}
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">AI Confidence</span>
                    <span className="font-semibold">{result.confidence}%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-1000 ease-out rounded-full"
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-neutral-100 dark:border-neutral-800 pt-6">
                   <div>
                     <p className="text-xs text-neutral-500 mb-1">CO₂ Avoided</p>
                     <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">+{result.co2} kg</p>
                   </div>
                   <div>
                     <p className="text-xs text-neutral-500 mb-1">Points Earned</p>
                     <p className="text-lg font-semibold text-amber-500">+10</p>
                   </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-start gap-4">
                  <div className="text-2xl mt-1">💡</div>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-1">Smart Disposal Tip</h3>
                    <p className="text-sm text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                      {result.smartTip}
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => { setResult(null); setPreview(null); }}
                className="w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-2xl font-medium hover:opacity-90 transition shadow-md"
              >
                Scan Another Item
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
