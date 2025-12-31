"use client";

import type { ExtractResponse } from "./actions/extract";
import { extractAction } from "./actions/extract";
import { Camera, ImagePlus, Loader2, Lock, ShieldCheck, UploadCloud } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

function formatJson(payload: unknown) {
  return JSON.stringify(payload, null, 2);
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 ring-1 ring-white/10">
      {children}
    </span>
  );
}

function SectionCard({ children, title, icon }: { children: React.ReactNode; title: string; icon: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl shadow-indigo-900/40 backdrop-blur">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-sm font-semibold uppercase tracking-tight text-slate-200">
        <span className="text-indigo-200">{icon}</span>
        {title}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

function StatusLabel({ isUnlocked }: { isUnlocked: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white">
      <span className={`flex h-2.5 w-2.5 rounded-full ${isUnlocked ? "bg-emerald-400" : "bg-amber-400"}`} />
      {isUnlocked ? "Sistema activo" : "Sistema bloqueado"}
    </div>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-8 lg:px-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-indigo-100">
              <ShieldCheck className="h-5 w-5" />
              Demostración Técnica · IA Visual
            </div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Extracción Inteligente de Datos desde Imágenes</h1>
            <p className="max-w-2xl text-sm text-slate-200 sm:text-base">
              Esta demostración técnica ilustra un sistema de análisis visual automatizado utilizando modelos de IA avanzados.
              Permite la extracción estructurada de información desde imágenes mediante procesamiento en tiempo real.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-indigo-100">
              <Badge>Next.js 14 · App Router</Badge>
              <Badge>Replicate AI · Florence-2</Badge>
              <Badge>React Server Actions</Badge>
              <Badge>TypeScript</Badge>
            </div>
          </div>
          <div className="flex h-[120px] w-[200px] items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-indigo-900/50 to-violet-900/50 shadow-glow">
            <div className="text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-indigo-300" />
              <p className="mt-2 text-xs font-semibold text-indigo-200">AI Vision</p>
              <p className="text-[10px] text-slate-300">Demo Técnica</p>
            </div>
          </div>
        </motion.div>

        <ClientShell />
      </div>
    </main>
  );
}

function ClientShell() {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Autocarga desde localStorage si ya se validó antes
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("poc-pass") : null;
    if (saved === "POC2025") {
      setPassword(saved);
      setIsUnlocked(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handlePasswordSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (password.trim() === "POC2025") {
        setIsUnlocked(true);
        setError(null);
        if (typeof window !== "undefined") {
          localStorage.setItem("poc-pass", "POC2025");
        }
      } else {
        setIsUnlocked(false);
        setError("Contraseña incorrecta: usa POC2025");
      }
    },
    [password]
  );

  const assignFile = useCallback((incoming: File) => {
    if (!incoming.type.startsWith("image/")) {
      setError("Sólo se aceptan imágenes");
      return;
    }
    setError(null);
    setResult(null);
    setFile(incoming);
    const url = URL.createObjectURL(incoming);
    setPreview(url);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const dropped = event.dataTransfer.files?.[0];
      if (dropped) assignFile(dropped);
    },
    [assignFile]
  );

  const handleBrowse = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const picked = event.target.files?.[0];
      if (picked) assignFile(picked);
    },
    [assignFile]
  );

  const handleProcess = useCallback(async () => {
    if (!isUnlocked) {
      setError("Debes validar la contraseña antes de procesar");
      return;
    }
    if (!file) {
      setError("Selecciona una imagen primero");
      return;
    }
    setIsProcessing(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("password", password.trim());
      const data = await extractAction(formData);
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fallo el mock. Intenta de nuevo.";
      setError(message);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [file, isUnlocked, password]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <SectionCard title="Autenticación" icon={<Lock className="h-4 w-4" />}>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-300">Código de Acceso</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa el código de demo"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-300"
                />
                <Keycap />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:ring-2 focus:ring-indigo-300"
            >
              <ShieldCheck className="h-4 w-4" />
              Acceder a la demo
            </button>
            <StatusLabel isUnlocked={isUnlocked} />
            {error && <p className="text-sm text-rose-200">{error}</p>}
            <div className="rounded-lg bg-indigo-950/30 p-3 text-xs text-slate-300">
              <p className="font-semibold text-indigo-200 mb-1">ℹ️ Instrucciones:</p>
              <p>Esta demostración requiere autenticación. Utilice el código proporcionado para acceder al sistema de análisis visual.</p>
            </div>
          </form>
        </SectionCard>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <SectionCard title="Entrada de Imagen" icon={<UploadCloud className="h-4 w-4" />}>
          {!isUnlocked ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 bg-white/5 text-center text-slate-300">
              <Lock className="h-8 w-8 text-slate-200" />
              <p className="font-semibold">Acceso restringido</p>
              <p className="text-sm">Autentíquese para habilitar el sistema de carga</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative flex h-64 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed ${
                  isDragging ? "border-indigo-300 bg-indigo-500/10" : "border-white/10 bg-white/5"
                } px-4 text-center text-slate-200 transition`}
              >
                <UploadCloud className="h-10 w-10" />
                <div>
                  <p className="font-semibold">Cargar imagen para análisis</p>
                  <p className="text-sm text-slate-300">Arrastra aquí o haz clic para seleccionar</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleBrowse}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>

              <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-sm text-indigo-100">
                  <Camera className="h-4 w-4" />
                  Vista previa y procesamiento
                </div>
                <p className="text-sm text-slate-200">
                  Soporta captura directa desde cámara en dispositivos móviles o selección de archivos existentes. 
                  La imagen se procesa mediante un modelo de visión artificial avanzado.
                </p>
                {preview ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden rounded-lg">
                    <img
                      src={preview}
                      alt={file?.name ?? "preview"}
                      className="h-40 w-full object-cover"
                    />
                  </motion.div>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-white/10 text-sm text-slate-300">
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Sin imagen seleccionada
                  </div>
                )}
                <button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Procesando con IA...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Analizar imagen
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Datos Extraídos" icon={<ImagePlus className="h-4 w-4" />}>
          {!isUnlocked ? (
            <p className="text-sm text-slate-300">Autentíquese para visualizar los resultados del análisis.</p>
          ) : isProcessing ? (
            <div className="flex items-center gap-3 text-slate-200">
              <Loader2 className="h-5 w-5 animate-spin" />
              Procesamiento en curso · Analizando contenido visual...
            </div>
          ) : result ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-indigo-950/30 p-3 mb-2">
                <p className="text-xs font-semibold text-indigo-200 mb-2">📊 Resumen del análisis</p>
                <div className="flex flex-col gap-1 text-xs text-slate-300">
                  <span><span className="text-indigo-300 font-medium">Archivo:</span> {result.filename}</span>
                  <span><span className="text-indigo-300 font-medium">Procesado:</span> {new Date(result.processedAt).toLocaleString()}</span>
                  <span><span className="text-indigo-300 font-medium">Tiempo de IA:</span> <span className="text-emerald-300 font-semibold">{(result.processingTimeMs / 1000).toFixed(2)}s</span> <span className="text-slate-400">({result.processingTimeMs}ms)</span></span>
                  <span><span className="text-indigo-300 font-medium">Estado:</span> <span className="text-emerald-300">✓ Completado exitosamente</span></span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-300">Estructura de datos JSON:</p>
                <pre className="max-h-72 overflow-auto rounded-lg bg-slate-950/80 p-4 text-sm text-indigo-100 ring-1 ring-white/10 whitespace-pre-wrap break-words">
                  {formatJson(result.payload)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center text-slate-300">
              <ImagePlus className="h-8 w-8 text-slate-400" />
              <div>
                <p className="font-semibold text-sm">Sin datos disponibles</p>
                <p className="text-xs mt-1">Cargue una imagen y ejecute el análisis para ver los resultados</p>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function Keycap() {
  return (
    <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center rounded-md bg-indigo-500/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-100 ring-1 ring-indigo-400/50">
      POC2025
    </span>
  );
}
