# Índice General y Mapa del Proyecto: Inventario Pintura - LM

> **Última actualización:** 10/11/2026  
> **Versión del documento:** 1.0.0  
> **Estado:** En producción (Vercel)

## 1. Visión General
**Inventario Pintura - LM** es un sistema profesional de gestión de inventario jerárquico diseñado para una tienda de pinturas. Permite el control de stock por ubicaciones específicas (secciones, pasillos, armarios, altos, cross, cajas y reserva), integrando escáner de código de barras, ajustes rápidos, métricas en tiempo real, gestión de usuarios con permisos granulares y exportación a Excel/PDF.

## 2. Stack Tecnológico

| Capa | Tecnología | Notas |
| --- | --- | --- |
| **Frontend** | React 18, TypeScript, TanStack Router, TanStack Query | Arquitectura basada en rutas y caché de servidor. |
| **UI / Estilos** | Tailwind CSS, Radix UI, Lucide React, shadcn/ui | Sistema de diseño semántico (colores ámbar, modo oscuro). |
| **Backend / BD** | Supabase (PostgreSQL) | Row Level Security (RLS) activo en todas las tablas. |
| **Despliegue** | Vercel | CI/CD automático desde la rama `main`. |
| **Testing** | Vitest | Tests unitarios para lógica de negocio. |
| **Herramientas** | Git, ESLint, Prettier, Bun, rsc-harness | `rsc-harness` para memoria y reglas de agentes IA. |

## 3. Arquitectura Crítica (Regla de Oro)

⚠️ **Principio fundamental del Stock:** El cliente (frontend) **NUNCA** escribe directamente en la tabla `stock`. 
- La tabla `stock` tiene `GRANT SELECT` para usuarios autenticados.
- Toda modificación se realiza mediante `INSERT` en la tabla `movimientos`.
- Un **trigger en PostgreSQL** (`actualizar_stock`) calcula y actualiza el stock de forma atómica y segura.

## 4. Mapa de Documentación SPEC

Esta carpeta contiene la documentación técnica detallada del proyecto. Utiliza estos documentos como fuente de verdad para el desarrollo y la asistencia de IA.

| Documento | Descripción | Estado |
| --- | --- | --- |
| **[arquitectura.md](./arquitectura.md)** | Estructura de carpetas `src/`, flujo de datos, dependencias y patrones de código. | 🟡 Pendiente |
| **[base-datos.md](./base-datos.md)** | Esquema de Supabase, tablas, relaciones, triggers, RLS y políticas de seguridad. | 🟡 Pendiente |
| **[sistema-diseno.md](./sistema-diseno.md)** | Variables CSS, colores semánticos (shadcn), tema ámbar, modo oscuro y componentes UI. | 🟡 Pendiente |
| **[flujos-usuario.md](./flujos-usuario.md)** | Paso a paso de tareas clave (importar CSV, revertir lote, ajustar stock, escaneo). | 🟡 Pendiente |

## 5. Enlaces de Acceso Rápido

- 🚀 **Aplicación en Producción:** [inventario-pintura-local.vercel.app](https://inventario-pintura-local.vercel.app)
- 📦 **Repositorio GitHub:** [github.com/.../inventario-pintura-local](https://github.com/recursos-email-pintureria/inventario-pintura-local)
- 📋 **Panel de Despliegues Vercel:** [vercel.com/.../deployments](https://vercel.com/aritx26-3717/~/deployments)
- 🗄️ **Panel de Supabase:** [app.supabase.com](https://app.supabase.com)

## 6. Historial de Cambios Recientes

- **v1.3.0-semanticos (Nov 2026):** Migración completa a variables semánticas shadcn/ui. Color primario cambiado a ámbar para mejor contraste WCAG AA. Corrección de legibilidad en modo oscuro.
- **v1.2.0-visual (Oct 2026):** Iconos específicos por ubicación, paleta de colores distintiva, confirmaciones visuales (AlertDialog) para acciones críticas.