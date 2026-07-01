-- T D MANI ERP Database Schema

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text default 'admin',
  created_at timestamp with time zone default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  second_phone text,
  email text,
  address text,
  area text,
  vat_number text,
  tax_office text,
  customer_type text,
  notes text,
  created_at timestamp with time zone default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  customer_id uuid references customers(id),
  title text not null,
  job_type text check (job_type in ('invoice','cash')),
  address text,
  area text,
  maps_url text,
  category text,
  description text,
  agreed_amount numeric default 0,
  vat numeric default 0,
  withholding numeric default 0,
  paid_amount numeric default 0,
  status text default 'active',
  progress integer default 0,
  start_date date,
  deadline date,
  created_at timestamp with time zone default now()
);

create table crews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text,
  phone text,
  email text,
  notes text,
  created_at timestamp with time zone default now()
);

insert into crews (name, specialty) values
('OSMANAJ', 'Καλούπι / Οικοδομή'),
('MICI', 'Ηλεκτρολογικά');

create table project_crews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  crew_id uuid references crews(id),
  agreement_amount numeric default 0,
  paid_amount numeric default 0,
  notes text,
  created_at timestamp with time zone default now()
);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text unique not null,
  customer_id uuid references customers(id),
  job_type text check (job_type in ('invoice','cash')),
  status text default 'pending',
  description text,
  subtotal numeric default 0,
  vat numeric default 0,
  withholding numeric default 0,
  payable numeric default 0,
  issue_date date default current_date,
  expiry_date date,
  created_at timestamp with time zone default now()
);

create table quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quotes(id) on delete cascade,
  work_name text not null,
  pricing_mode text,
  quantity numeric default 0,
  unit_price numeric default 0,
  fixed_price numeric default 0,
  materials numeric default 0,
  labor numeric default 0,
  other_costs numeric default 0,
  profit_percent numeric default 0,
  line_total numeric default 0
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  customer_id uuid references customers(id),
  crew_id uuid references crews(id),
  payment_type text,
  method text,
  amount numeric not null,
  payment_date date default current_date,
  notes text,
  created_at timestamp with time zone default now()
);

create table inventory (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  supplier text,
  quantity numeric default 0,
  min_quantity numeric default 0,
  purchase_price numeric default 0,
  notes text,
  created_at timestamp with time zone default now()
);

create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type text,
  project_id uuid references projects(id),
  customer_id uuid references customers(id),
  crew_id uuid references crews(id),
  event_date date,
  event_time time,
  reminder text,
  notes text,
  created_at timestamp with time zone default now()
);
