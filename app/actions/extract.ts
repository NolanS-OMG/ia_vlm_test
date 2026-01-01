"use server";

import Replicate from "replicate";
import { unstable_noStore as noStore } from "next/cache";

export type ExtractedPayload = Record<string, any>;

export type ExtractResponse = {
  filename: string;
  processedAt: string;
  processingTimeMs: number; // Tiempo de procesamiento de la IA en milisegundos
  payload: ExtractedPayload; // JSON estructurado del modelo visual
};

export async function extractAction(formData: FormData): Promise<ExtractResponse> {
  // Evitar que Next.js cachee esta función y sus variables de entorno
  noStore();
  
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

  // Estrategia: Convertir a Data URI (base64) para enviar directamente a Replicate
  // Esto evita problemas de acceso público a archivos en Render/Netlify
  console.time("[base64-encode]");
  const base64 = buffer.toString("base64");
  const mimeType = fileObj.type || "image/jpeg";
  const dataUri = `data:${mimeType};base64,${base64}`;
  console.log("[extractAction] Data URI generado", { mimeType, sizeKB: Math.round(dataUri.length / 1024) });
  console.timeEnd("[base64-encode]");

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
      image_input: [dataUri], // Usar Data URI en lugar de URL pública
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
