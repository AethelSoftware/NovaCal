-- Enable Row Level Security on all tables
alter table public.tasks enable row level security;
alter table public.custom_tasks enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.completed_tasks enable row level security;
alter table public.working_hours enable row level security;
alter table public.habits enable row level security;

-- Tasks RLS policies
create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Custom tasks RLS policies
create policy "Users can view their own custom tasks"
  on public.custom_tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own custom tasks"
  on public.custom_tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own custom tasks"
  on public.custom_tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own custom tasks"
  on public.custom_tasks for delete
  using (auth.uid() = user_id);

-- Focus sessions RLS policies
create policy "Users can view their own focus sessions"
  on public.focus_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own focus sessions"
  on public.focus_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own focus sessions"
  on public.focus_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own focus sessions"
  on public.focus_sessions for delete
  using (auth.uid() = user_id);

-- Completed tasks RLS policies
create policy "Users can view their own completed tasks"
  on public.completed_tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own completed tasks"
  on public.completed_tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own completed tasks"
  on public.completed_tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own completed tasks"
  on public.completed_tasks for delete
  using (auth.uid() = user_id);

-- Working hours RLS policies
create policy "Users can view their own working hours"
  on public.working_hours for select
  using (auth.uid() = user_id);

create policy "Users can insert their own working hours"
  on public.working_hours for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own working hours"
  on public.working_hours for update
  using (auth.uid() = user_id);

create policy "Users can delete their own working hours"
  on public.working_hours for delete
  using (auth.uid() = user_id);

-- Habits RLS policies
create policy "Users can view their own habits"
  on public.habits for select
  using (auth.uid() = user_id);

create policy "Users can insert their own habits"
  on public.habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habits"
  on public.habits for update
  using (auth.uid() = user_id);

create policy "Users can delete their own habits"
  on public.habits for delete
  using (auth.uid() = user_id);
