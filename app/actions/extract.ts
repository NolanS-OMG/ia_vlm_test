"use server";

import Replicate from "replicate";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export type ExtractedPayload = Record<string, any>;

export type ExtractResponse = {
  filename: string;
  processedAt: string;
  processingTimeMs: number; // Tiempo de procesamiento de la IA en milisegundos
  payload: ExtractedPayload; // JSON estructurado del modelo visual
};

export async function extractAction(formData: FormData): Promise<ExtractResponse> {
  console.log("[extractAction] Inicio");

  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateToken) {
    console.error("[extractAction] Falta REPLICATE_API_TOKEN en entorno");
    throw new Error("Falta REPLICATE_API_TOKEN");
  }

  const clientPassword = formData.get("password");
  if (clientPassword !== "POC2025") {
    console.error("[extractAction] Password inválida o ausente en la request");
    throw new Error("Password inválida");
  }

  const replicate = new Replicate({ auth: replicateToken });
  console.log("[extractAction] Replicate listo");

  const file = formData.get("file");
  if (!file || typeof file !== "object" || !(file as File).arrayBuffer) {
    console.error("[extractAction] FormData no contiene 'file' válido");
    throw new Error("FormData sin 'file' válido");
  }

  const fileObj = file as File;
  const filename = fileObj.name || "imagen.jpg";
  console.log("[extractAction] Archivo", { name: filename, type: fileObj.type, size: fileObj.size });

  // Buffer y Blob
  console.time("[bufferize]");
  const arrayBuffer = await fileObj.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  console.timeEnd("[bufferize]");
  console.log("[extractAction] Buffer", { bytes: buffer.byteLength });

  const blob = new Blob([new Uint8Array(buffer)], { type: fileObj.type || "application/octet-stream" });
  console.log("[extractAction] Blob", { type: blob.type, size: blob.size });

  // Estrategia de URL de imagen para Replicate
  const publicBase = process.env.PUBLIC_BASE_URL;
  
  if (!publicBase) {
    console.error("[extractAction] Falta PUBLIC_BASE_URL en variables de entorno");
    throw new Error("PUBLIC_BASE_URL no configurado. Configúralo en Render con tu URL (ej: https://tu-app.onrender.com)");
  }
  
  console.log("[extractAction] Usando PUBLIC_BASE_URL:", publicBase.substring(0, 30) + "...");

  console.log("[extractAction] Generando URL temporal local");
  console.time("[local-save]");
  const ext = guessExt(fileObj.type) || ".bin";
  const rand = crypto.randomUUID().replace(/-/g, "");
  const localName = `${rand}${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  const localPath = path.join(uploadsDir, localName);
  await fs.writeFile(localPath, buffer);
  const uploadUrl = joinUrl(publicBase, `/uploads/${localName}`);
  console.log("[extractAction] Imagen guardada temporalmente", { localPath, uploadUrl });
  console.timeEnd("[local-save]");

  const model = "openai/gpt-4.1-mini";

  const system_prompt =
    "Actúa como un analista de datos visuales experto en estructuración de información.\n" +
    "Tu objetivo es realizar un escaneo completo de la imagen y extraer toda la información relevante en un formato JSON estructurado.\n\n" +
    "INSTRUCCIONES:\n" +
    "1. \"resumen\": Describe de forma técnica y detallada qué es la imagen y su propósito (máximo 30 palabras).\n" +
    "2. \"campos\": Identifica cada dato específico escrito en la imagen (nombres, cifras, fechas, códigos, direcciones). \n" +
    "   - Para cada dato, crea un objeto: {\"name\": \"nombre_del_campo\", \"type\": \"string|number|date|id\", \"value\": \"valor\"}.\n" +
    "   - Usa nombres de campos descriptivos en minúsculas y unidos por guiones bajos (snake_case).\n" +
    "3. \"tags\": Genera una lista de etiquetas que categoricen la imagen (mínimo 3, máximo 6).\n\n" +
    "REGLAS DE CALIDAD:\n" +
    "- Si no hay texto o datos legibles, el array \"campos\" debe estar vacío [].\n" +
    "- No inventes datos que no sean visibles.\n" +
    "- Devuelve ÚNICAMENTE el objeto JSON, sin comentarios ni formato Markdown.\n\n" +
    "ESQUEMA DE SALIDA:\n" +
    "{\n  \"resumen\": \"\",\n  \"campos\": [],\n  \"tags\": []\n}";
  
  const prompt = "Analiza esta imagen y extrae toda la información relevante siguiendo el formato JSON especificado en las instrucciones.";

  console.log("[extractAction] Ejecutando modelo visual con streaming", { model });
  const startTime = Date.now();
  console.time("[replicate:gpt-4.1-mini]");
  let modelOutput = "";
  try {
    const input = {
      prompt,
      image_input: [uploadUrl],
      system_prompt
    };
    
    for await (const event of replicate.stream(model, { input })) {
      modelOutput += event;
      // Log periódico para ver el progreso (cada 100 caracteres aprox)
      if (modelOutput.length % 100 < 10) {
        console.log("[extractAction] Streaming...", modelOutput.length, "chars");
      }
    }
    console.log("[extractAction] Streaming completo. Output (preview)", preview(modelOutput));
  } catch (err) {
    console.error("[extractAction] Error en ejecución del modelo visual", err);
    throw new Error("Error ejecutando modelo visual en Replicate");
  } finally {
    console.timeEnd("[replicate:gpt-4.1-mini]");
  }
  const endTime = Date.now();
  const processingTimeMs = endTime - startTime;

  // Limpieza de archivo temporal
  try {
    await fs.unlink(path.join(process.cwd(), "public", "uploads", localName));
    console.log("[extractAction] Archivo temporal eliminado", { localPath });
  } catch (err) {
    console.warn("[extractAction] No se pudo eliminar temporal", err);
  }
  let parsed: any = modelOutput;
  try {
    if (typeof modelOutput === "string") {
      parsed = JSON.parse(modelOutput);
    }
  } catch (err) {
    console.warn("[extractAction] No se pudo parsear JSON, se devuelve raw", err);
  }

  const response: ExtractResponse = {
    filename,
    processedAt: new Date().toISOString(),
    processingTimeMs,
    payload: parsed
  };

  console.log("[extractAction] Respuesta final (preview)", preview(response));
  console.log("[extractAction] Tiempo de procesamiento:", processingTimeMs, "ms (", (processingTimeMs / 1000).toFixed(2), "s)");
  return response;
}

function preview(value: unknown) {
  try {
    const str = typeof value === "string" ? value : JSON.stringify(value);
    return str && str.length > 500 ? str.slice(0, 500) + "..." : str;
  } catch {
    return "[no-serializable]";
  }
}

function safeString(value: any) {
  try {
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function guessExt(mime?: string) {
  if (!mime) return null;
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/bmp": ".bmp"
  };
  return map[mime] || null;
}

function joinUrl(base: string, p: string) {
  try {
    const u = new URL(base);
    return new URL(p, u).toString();
  } catch {
    return `${base}${p}`;
  }
}
