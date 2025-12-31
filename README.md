# Demostración Técnica · Extracción Inteligente de Datos desde Imágenes

Aplicación web de página única desarrollada con Next.js (App Router) que demuestra un sistema de análisis visual automatizado mediante inteligencia artificial. Esta implementación utiliza modelos de visión artificial avanzados para extraer y estructurar información desde imágenes de forma automatizada.

## Requisitos del Sistema
- Node.js 18 o superior
- npm o yarn
- Token de API de Replicate (para procesamiento con IA)

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variable de entorno
# Crear archivo .env en la raíz del proyecto:
REPLICATE_API_TOKEN=tu_token_aqui
PUBLIC_BASE_URL=https://tu-dominio-publico.com
```

## Scripts Disponibles
- `npm run dev` – Inicia el servidor de desarrollo (localhost:3000)
- `npm run build` – Genera el build optimizado para producción
- `npm run start` – Ejecuta el servidor en modo producción
- `npm run lint` – Validación de código con ESLint

## Flujo de Uso
1. **Autenticación**: Ingrese el código de acceso `POC2025` para desbloquear el sistema
2. **Carga de imagen**: Arrastre una imagen al área designada o seleccione desde el explorador de archivos (también compatible con captura directa desde cámara en dispositivos móviles)
3. **Procesamiento**: Pulse el botón "Analizar imagen" para iniciar el análisis con IA
4. **Visualización**: Los datos extraídos se presentan en formato JSON estructurado

## Stack Tecnológico
- **Framework**: Next.js 14 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **IA**: Replicate API con modelo Florence-2 (detección y análisis de objetos)
- **Iconografía**: Lucide React
- **Animaciones**: Framer Motion
- **Arquitectura**: React Server Actions para procesamiento backend

## Características Técnicas
- ✅ Sistema de autenticación básico para demo
- ✅ Carga de imágenes con drag & drop
- ✅ Captura directa desde cámara en móviles (`capture="environment"`)
- ✅ Vista previa en tiempo real
- ✅ Procesamiento con modelo de visión artificial Florence-2
- ✅ Extracción de datos estructurados en formato JSON
- ✅ Interfaz responsive y moderna
- ✅ Logs detallados del proceso en servidor

## Configuración Adicional

### Acceso desde dispositivos móviles en red local
Para probar la funcionalidad de cámara desde un dispositivo móvil:

```bash
npm run dev -- -H 0.0.0.0 -p 3001
```

Luego acceda desde el móvil a: `http://<IP-DE-TU-PC>:3001`

### Variables de entorno requeridas
```env
# Token de API de Replicate (obligatorio)
REPLICATE_API_TOKEN=tu_token_de_replicate

# URL pública para acceso externo a imágenes (obligatorio para Replicate)
PUBLIC_BASE_URL=https://tu-dominio-publico.com
```

## Arquitectura del Proyecto
```
web_poc/
├── app/
│   ├── actions/
│   │   └── extract.ts        # Server Action para procesamiento con IA
│   ├── globals.css           # Estilos globales
│   ├── layout.tsx            # Layout principal
│   └── page.tsx              # Componente principal de la demo
├── public/
│   └── uploads/              # Almacenamiento temporal de imágenes
└── [archivos de configuración]
```

## Notas de Implementación
- El procesamiento de imágenes se realiza mediante el Server Action ubicado en `app/actions/extract.ts`
- El modelo utiliza Florence-2 de Replicate para detección y análisis de objetos
- Las imágenes se almacenan temporalmente en `public/uploads/` para acceso público
- El sistema incluye logs detallados en consola del servidor para depuración
- La autenticación es simplificada para propósitos demostrativos
