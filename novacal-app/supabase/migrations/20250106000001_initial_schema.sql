-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Tasks table
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  due_time timestamp with time zone,
  importance integer default 2,
  description text default '',
  links text default '',
  files text default '',
  parent_custom_task_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Custom tasks table
create table public.custom_tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text default '',
  links text default '',
  files text default '',
  overall_start_time timestamp with time zone not null,
  overall_due_time timestamp with time zone not null,
  total_length_minutes integer not null,
  importance integer default 2,
  split_enabled boolean default false,
  block_duration_minutes integer default 30,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Focus sessions table
create table public.focus_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete set null,
  start_time timestamp with time zone not null,
  duration integer not null,
  task_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Completed tasks table
create table public.completed_tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete cascade not null,
  completion_date timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Working hours table
create table public.working_hours (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  day text not null,
  start text not null,
  "end" text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habits table
create table public.habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text default '',
  icon text default 'CheckCircle2',
  file text,
  schedules jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add foreign key for parent_custom_task_id
alter table public.tasks
  add constraint tasks_parent_custom_task_id_fkey
  foreign key (parent_custom_task_id)
  references public.custom_tasks(id)
  on delete cascade;

-- Create indexes for better query performance
create index tasks_user_id_idx on public.tasks(user_id);
create index tasks_start_time_idx on public.tasks(start_time);
create index custom_tasks_user_id_idx on public.custom_tasks(user_id);
create index focus_sessions_user_id_idx on public.focus_sessions(user_id);
create index completed_tasks_user_id_idx on public.completed_tasks(user_id);
create index working_hours_user_id_idx on public.working_hours(user_id);
create index habits_user_id_idx on public.habits(user_id);
