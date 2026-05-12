create table if not exists public.lead_seguimientos (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  tipo text not null check (tipo in ('CONTACTO', 'SEGUIMIENTO')),
  fecha timestamptz not null,
  observaciones text,
  agent_id uuid not null references public.agents(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists lead_seguimientos_lead_id_fecha_idx
  on public.lead_seguimientos (lead_id, fecha desc);

create index if not exists lead_seguimientos_agent_id_fecha_idx
  on public.lead_seguimientos (agent_id, fecha desc);

create index if not exists lead_seguimientos_tipo_fecha_idx
  on public.lead_seguimientos (tipo, fecha);
