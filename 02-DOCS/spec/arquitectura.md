# Arquitectura del Proyecto

> **Última actualización:** 10/11/2026

## 1. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript |
| Router | TanStack Router (file-based routing) |
| Estado/Caché | TanStack Query (React Query) |
| UI | shadcn/ui + Radix UI + Lucide React |
| Estilos | Tailwind CSS con variables semánticas |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Despliegue | Vercel |
| Testing | Vitest |

## 2. Estructura de Carpetas
src/
├── components/ # Componentes React reutilizables
│ ├── ui/ # Componentes base de shadcn
│ ├── auth/ # Login, cambio de password
│ ├── csv-import/ # Importación CSV (PanelMapeoColumnas)
│ ├── inventario/ # Modales de inventario
│ ├── palets/ # Gestión de palets/lotes
│ └── ubicaciones/ # Mapa2D, Mapa2DModal
│
├── routes/ # Rutas de TanStack Router
│ └── _authenticated/ # Rutas protegidas (dashboard, productos, etc.)
│
├── lib/ # Utilidades y lógica de negocio
│ ├── csv-mapper.ts # Mapeo de columnas CSV
│ ├── csv-parser.ts # Parser de archivos CSV
│ ├── csv-transformer.ts # Transformación de datos CSV
│ ├── mapeo-storage.ts # Persistencia de mapeos en Supabase
│ └── tiposUbicacion.ts # Tipos TypeScript para ubicaciones
│
├── hooks/ # Custom hooks de React
└── styles.css # Variables CSS globales (colores semánticos)

## 3. Flujo de Datos
Usuario → Componente React → TanStack Query → Supabase Client → PostgreSQL
↓
Caché local (React Query)
↓
UI actualizada

## 4. Patrones de Código

- **Componentes:** Funcionales con TypeScript. Props tipadas.
- **Queries:** Usar `useQuery` de TanStack Query para datos de servidor.
- **Mutaciones:** Usar `useMutation` para escrituras (siempre vía `movimientos`, nunca directo a `stock`).
- **Rutas:** File-based routing en `src/routes/`. Prefijo `_authenticated` para rutas protegidas.

## 5. Convenciones

- Nombres de archivos: PascalCase para componentes, camelCase para utilidades.
- Commits: formato Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`).
- Ramas: `feature/<descripcion>`, `fix/<descripcion>`.
- Pull Requests obligatorios para fusionar en `main`.