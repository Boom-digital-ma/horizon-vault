"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

interface PDFViewerProps {
  slug: string;
  userEmail: string;
}

export default function PDFViewer({ slug, userEmail }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Load PDF.js CDN Script
  useEffect(() => {
    if ((window as any).pdfjsLib) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    script.async = true;
    script.onload = () => {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
      setScriptLoaded(true);
    };
    script.onerror = () => {
      setError("Impossible de charger le moteur de rendu PDF (CDN hors ligne).");
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove the script to allow caching across instances, but clean up if needed
    };
  }, []);

  // 2. Fetch PDF Blob from our API
  useEffect(() => {
    if (!scriptLoaded) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadPDF = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Session expirée");
        }

        const res = await fetch(`/api/studies/${slug}/pdf`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Erreur serveur (${res.status})`);
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        const pdfjsLib = (window as any).pdfjsLib;
        const loadingTask = pdfjsLib.getDocument({ url });
        const doc = await loadingTask.promise;

        if (isMounted) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setPageNum(1);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("PDF loading error:", err);
        if (isMounted) {
          setError(err.message || "Erreur de chargement du document PDF.");
          setLoading(false);
        }
      }
    };

    loadPDF();

    return () => {
      isMounted = false;
    };
  }, [slug, scriptLoaded]);
  
  // 2.5 Auto-scale PDF page to fit width and height on resize / page load
  useEffect(() => {
    if (!pdfDoc) return;

    const adjustScale = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const container = containerRef.current;
        if (!container) return;

        const isMobile = window.innerWidth < 640;
        const paddingWidth = isMobile ? 32 : 64;
        
        // In fullscreen, we only need to account for the PDFViewer's own toolbar and padding.
        // In normal mode, we also account for the site headers, layout margins, and outer wrappers.
        const paddingHeight = isFullscreen 
          ? (isMobile ? 80 : 120) 
          : (isMobile ? 130 : 200);
        
        const availableWidth = container.clientWidth - paddingWidth;
        const availableHeight = window.innerHeight - paddingHeight;

        const scaleW = availableWidth / unscaledViewport.width;
        const scaleH = availableHeight / unscaledViewport.height;
        
        // Fit both width and height to keep the full page visible on screen
        const fitScale = Math.min(scaleW, scaleH);

        if (fitScale < 1.2) {
          setScale(Math.max(0.4, Number(fitScale.toFixed(2))));
        } else {
          setScale(1.2);
        }
      } catch (err) {
        console.error("Scale adjustment error:", err);
      }
    };

    adjustScale();
    window.addEventListener("resize", adjustScale);
    return () => window.removeEventListener("resize", adjustScale);
  }, [pdfDoc, pageNum, isFullscreen]);

  // 3. Render Page to Canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        // Cancel any pending render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(pageNum);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        // Calculate device pixel ratio for sharp rendering
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        context.scale(dpr, dpr);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        renderTaskRef.current = null;
      } catch (err: any) {
        if (err.name !== "RenderingCancelledException") {
          console.error("Render error:", err);
        }
      }
    };

    renderPage();
  }, [pdfDoc, pageNum, scale]);

  // 4. Block copy, right click, and print key shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+P / Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        e.stopPropagation();
        alert("L'impression de ce document est désactivée par mesure de sécurité.");
      }
      // Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        e.stopPropagation();
        alert("Le téléchargement de ce document est désactivé.");
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("contextmenu", handleContextMenu, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, []);

  const changePage = (offset: number) => {
    setPageNum((prev) => Math.min(Math.max(prev + offset, 1), numPages));
  };

  const zoom = (factor: number) => {
    setScale((prev) => Math.min(Math.max(prev * factor, 0.6), 2.5));
  };

  // Watermark text grid setup
  const watermarkText = `${userEmail} • CONFIDENTIEL MAWARIF • ${new Date().toLocaleDateString("fr-FR")}`;

  return (
    <div className={`flex flex-col items-center bg-[#F8F9FA] select-none ${
      isFullscreen 
        ? "fixed inset-0 z-[9999] w-screen h-screen rounded-none border-none" 
        : "w-full rounded-xl border border-gray-200/80 shadow-sm overflow-hidden"
    }`}>
      {/* Hide content completely when printing */}
      <style jsx global>{`
        @media print {
          body {
            display: none !important;
          }
        }
      `}</style>
      
      {/* Premium Toolbar */}
      <div className="w-full bg-white border-b border-gray-200/80 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNum <= 1 || loading}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Page précédente"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs font-semibold text-gray-700 min-w-16 text-center">
            {loading ? "..." : `Page ${pageNum} / ${numPages}`}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={pageNum >= numPages || loading}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Page suivante"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Center Brand Logo (always visible, even in fullscreen) */}
        <div className="flex items-center gap-2 pointer-events-none select-none">
          <img
            src="/images/logo.png"
            alt="MawaRif Logo"
            className="h-6 w-auto object-contain"
          />
          <span className="font-serif text-[10px] tracking-[0.15em] text-[#1A3C34] font-bold hidden sm:inline">
            MAWARIF
          </span>
        </div>

        {/* Zoom & Protection & Fullscreen */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => zoom(0.85)}
              disabled={loading}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
              title="Zoom arrière"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
              </svg>
            </button>
            <span className="text-xs font-mono text-gray-500 w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => zoom(1.15)}
              disabled={loading}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
              title="Zoom avant"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            disabled={loading}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer flex items-center gap-1"
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-5V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 border border-amber-200/50 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] text-amber-800 font-semibold uppercase tracking-wider">Aperçu protégé</span>
          </div>
        </div>
      </div>

      {/* Render Area */}
      <div 
        ref={containerRef}
        className={`w-full flex justify-center p-4 sm:p-8 overflow-auto relative bg-gray-100/40 ${
          isFullscreen ? "flex-1" : "min-h-[60vh]"
        }`}
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
            <div className="w-8 h-8 border-3 border-[#1A3C34] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-gray-500 mt-3 uppercase tracking-widest">Génération du rendu protégé...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-lg border border-red-100 shadow-sm max-w-md my-auto">
            <svg className="w-12 h-12 text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm font-semibold text-gray-800">{error}</p>
            <p className="text-xs text-gray-500 mt-1">Veuillez contacter l&apos;administrateur si le problème persiste.</p>
          </div>
        )}

        {/* Canvas & Watermark Container */}
        {!error && scriptLoaded && (
          <div 
            className="relative bg-white shadow-md border border-gray-200/50 overflow-hidden"
            style={{ 
              width: canvasRef.current?.style.width || "auto",
              height: canvasRef.current?.style.height || "auto",
              userSelect: "none",
              WebkitUserSelect: "none"
            }}
          >
            {/* The PDF Page Canvas */}
            <canvas ref={canvasRef} className="block pointer-events-none" />

            {/* Repeating Translucent Watermark Overlay */}
            <div 
              className="absolute inset-0 pointer-events-none overflow-hidden select-none z-10 grid grid-cols-2 grid-rows-3 opacity-[0.05] text-black font-mono font-bold text-[9px] uppercase tracking-widest"
              style={{ transform: "rotate(-25deg) scale(1.15)" }}
            >
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-6 gap-2 text-center">
                  <img
                    src="/images/logo.png"
                    alt=""
                    className="h-10 w-auto object-contain grayscale contrast-125"
                  />
                  <span className="whitespace-nowrap">{watermarkText}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
