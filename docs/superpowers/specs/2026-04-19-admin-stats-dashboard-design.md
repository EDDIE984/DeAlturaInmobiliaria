# Admin Stats Dashboard — Design Spec
**Date:** 2026-04-19  
**Status:** Approved

---

## Context

DeAltura es una plataforma de gestión de leads para una inmobiliaria. Los agentes (role=user) gestionan leads asignados a ellos. El administrador necesita una vista global de cómo va la gestión de ventas: cuántos leads entran, cuántos se convierten en ventas, y cómo se desempeña cada agente. Actualmente el admin solo tiene CRUD de usuarios en `/admin/usuarios` y no tiene ninguna vista analítica.

---

## Objetivo

Crear un dashboard estadístico en `/admin/dashboard` que permita al administrador:
- Ver KPIs globales de la inmobiliaria filtrados por período de tiempo
- Visualizar tendencias y distribuciones con gráficas
- Comparar el rendimiento de cada agente en una tabla de ranking

---

## Arquitectura

### Rutas nuevas

| Ruta | Tipo | Propósito |
|---|---|---|
| `/admin/dashboard` | Page | Dashboard estadístico del admin |
| `/api/admin/stats` | GET | KPIs globales filtrados por `from` y `to` |
| `/api/admin/stats/agents` | GET | Métricas por agente en el mismo rango |

### Archivos nuevos

```
app/admin/dashboard/page.tsx
app/api/admin/stats/route.ts
app/api/admin/stats/agents/route.ts
components/admin/StatCard.tsx
components/admin/LeadsLineChart.tsx
components/admin/ClassificationPie.tsx
components/admin/SourceBarChart.tsx
components/admin/ResultsPie.tsx
components/admin/AgentsTable.tsx
```

### Archivos modificados

- `app/admin/layout.tsx` — agregar enlace "Dashboard" en el sidebar antes de "Usuarios"

---

## Layout de la página

```
[ Filtro de período ]
  Botones: Esta semana | Este mes | Últimos 3 meses | Rango personalizado

[ 5 tarjetas KPI ]
  Total Leads | Ventas | Tasa de Conversión | Sin Gestionar | Seguimientos Pendientes

[ Fila de gráficas — 2 columnas ]
  [ Tendencia de leads (línea) ]   [ Clasificación (pie) ]
  [ Por fuente (barras horiz.) ]   [ Resultados (pie) ]

[ Tabla de ranking de agentes ]
```

---

## KPIs

| Tarjeta | Cálculo | Fuente |
|---|---|---|
| Total Leads | COUNT leads en el período | `leads.created_at` BETWEEN from/to |
| Ventas | COUNT leads con `resultado = 'VENTA'` | `leads.resultado` |
| Tasa de Conversión | ventas ÷ (ventas + no_ventas) × 100 | calculado en API |
| Sin Gestionar | Leads sin registros en `lead_seguimientos` | LEFT JOIN seguimientos |
| Seguimientos Pendientes | `lead_seguimientos` con `fecha > NOW()` | `lead_seguimientos.fecha` |

---

## Gráficas

| Gráfica | Tipo | Datos |
|---|---|---|
| Tendencia de leads | Línea (recharts LineChart) | Leads nuevos por día (rango ≤1 mes) o por semana (rango >1 mes) |
| Clasificación | Pie (recharts PieChart) | COUNT leads por `classification`: caliente/tibio/frio |
| Por fuente | Barras horizontales (recharts BarChart) | COUNT leads por `source` |
| Resultados | Pie (recharts PieChart) | COUNT por `resultado`: VENTA / NO_VENTA / sin resultado |

**Librería:** `recharts` — compatible con Next.js App Router, sin configuración adicional.

---

## Tabla de agentes

Columnas: Agente | Leads asignados | Ventas | No Ventas | Conversión % | Sin Gestionar | Pend. seguimientos

Ordenada por Ventas descendente. Todos los agentes activos aparecen aunque tengan 0 leads.

---

## Filtro de período

- Botones rápidos: "Esta semana" / "Este mes" / "Últimos 3 meses"
- Botón "Rango personalizado" despliega dos date inputs (from, to)
- Estado vive en el componente (`useState`) — no en URL
- Al cambiar el período se re-fetches ambas APIs (`/api/admin/stats` y `/api/admin/stats/agents`)

---

## API: GET /api/admin/stats

**Query params:** `from` (ISO), `to` (ISO)  
**Auth:** Requiere sesión con `role = 'admin'`

**Response:**
```typescript
{
  total_leads: number,
  ventas: number,
  no_ventas: number,
  tasa_conversion: number,      // porcentaje 0-100
  sin_gestionar: number,
  seguimientos_pendientes: number,
  leads_por_dia: { fecha: string, count: number }[],
  leads_por_clasificacion: { clasificacion: string, count: number }[],
  leads_por_fuente: { fuente: string, count: number }[],
  leads_por_resultado: { resultado: string, count: number }[]
}
```

**Tablas consultadas:** `leads`, `lead_seguimientos`

---

## API: GET /api/admin/stats/agents

**Query params:** `from` (ISO), `to` (ISO)  
**Auth:** Requiere sesión con `role = 'admin'`

**Response:**
```typescript
{
  agents: {
    id: string,
    name: string,
    total_leads: number,
    ventas: number,
    no_ventas: number,
    tasa_conversion: number,
    sin_gestionar: number,
    seguimientos_pendientes: number
  }[]
}
```

**Tablas consultadas:** `agents`, `leads`, `lead_seguimientos`

---

## Patrón de data fetching

Igual al patrón existente en `app/dashboard/page.tsx`: cliente con `useState` + `useEffect` + fetch. No se usan Server Components para estas rutas dinámicas con filtros.

---

## Verificación

1. Navegar a `/admin/dashboard` — debe cargar con datos del mes actual por defecto
2. Cambiar a "Esta semana" — todas las tarjetas y gráficas deben actualizarse
3. Usar "Rango personalizado" con fechas arbitrarias — debe funcionar correctamente
4. Verificar que la tabla de agentes muestra todos los agentes activos
5. Verificar que un agente con 0 leads aparece en la tabla con valores en 0
6. Verificar que el enlace "Dashboard" en el sidebar del admin lleva a esta página
7. Verificar que un usuario con `role = 'user'` recibe 403 al llamar las APIs
