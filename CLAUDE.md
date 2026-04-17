@AGENTS.md

# DeAltura — Plataforma de Gestión de Leads

## Propósito
Plataforma web para gestión de leads con dos perfiles: **Administrador** y **Usuario**. El chatbot NO es parte de este proyecto — solo se visualiza su data.

## Stack
- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Base de datos:** Supabase (PostgreSQL) — base ya creada
- **Auth:** Tabla propia `public.users` con bcrypt + JWT en cookie HttpOnly. **NO usar Supabase Auth.**
- **Deploy:** Vercel

## Estructura de Carpetas

```
app/
  page.tsx                  ← Raíz: redirige según rol
  login/page.tsx            ← Pantalla de login
  admin/
    layout.tsx              ← Layout con sidebar (solo admin)
    page.tsx                ← Redirige a /admin/usuarios
    usuarios/page.tsx       ← CRUD de usuarios
  dashboard/                ← (pendiente) Vista del perfil usuario
  api/
    auth/login/route.ts     ← POST login
    auth/logout/route.ts    ← POST logout
    admin/usuarios/         ← GET, POST, PUT, DELETE usuarios

components/                 ← Componentes UI reutilizables
lib/
  supabase.ts               ← Clientes Supabase (admin + anon)
  auth.ts                   ← JWT: crear/verificar/leer sesión
types/
  index.ts                  ← Interfaces TypeScript
proxy.ts                    ← Protección de rutas por rol
```

## Reglas Clave

- **Las consultas a BD van en `app/api/**/route.ts`** — nunca en page.tsx del cliente
- Lógica reutilizable compartida va en `lib/`
- Usar `supabaseAdmin` (service role) en API routes del servidor
- Rutas protegidas: `/admin/*` → role `admin`, `/dashboard/*` → role `user`
- El esquema de cada tabla lo provee el usuario antes de codificar — nunca asumir estructura
- No construir chatbot, solo consumir su data

## Perfiles

### Administrador (`role = 'admin'`)
- Pantallas de mantenimiento (CRUD) en `/admin/*`
- Acceso actual: gestión de usuarios

### Usuario (`role = 'user'`)
- Dashboard con leads asignados en `/dashboard`
- Ver conversaciones cliente-chatbot por lead

## Tabla de Usuarios (`public.users`)

```sql
create table public.users (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  password_hash text,
  name text,
  role text,           -- 'admin' | 'user'
  created_at timestamptz default now(),
  is_active boolean default true
);
```

## Variables de Entorno (`.env`)

```
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
```

## Flujo de Petición

```
page.tsx (fetch) → /api/route.ts (valida sesión + query) → lib/supabase.ts → Supabase
```

## Convenciones Next.js 16

- El archivo de middleware se llama `proxy.ts` y exporta `proxy` (no `middleware`)
- Leer `node_modules/next/dist/docs/` ante cualquier duda de API
