import { supabase } from './supabaseClient';

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Tasks API
export const getTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('start_time', { ascending: true });
  
  if (error) throw error;
  
  // Transform to match frontend format
  return data.map(task => ({
    id: task.id,
    name: task.title,
    start: task.start_time,
    end: task.end_time,
    due_time: task.due_time,
    importance: task.importance,
    description: task.description || '',
    links: task.links || '',
    files: task.files || '',
    parentCustomTaskId: task.parent_custom_task_id,
  }));
};

export const createTask = async (taskData) => {
  const user = await getCurrentUser();
  
  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      user_id: user.id,
      title: taskData.name,
      start_time: taskData.start,
      end_time: taskData.end,
      due_time: taskData.due_time || taskData.end,
      importance: taskData.importance || 2,
      description: taskData.description || '',
      links: taskData.links || '',
      files: taskData.files || '',
      parent_custom_task_id: taskData.parentCustomTaskId || null,
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    name: data.title,
    start: data.start_time,
    end: data.end_time,
    due_time: data.due_time,
    importance: data.importance,
    description: data.description || '',
    links: data.links || '',
    files: data.files || '',
  };
};

export const updateTask = async (taskId, updates) => {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.title = updates.name;
  if (updates.start !== undefined) dbUpdates.start_time = updates.start;
  if (updates.end !== undefined) dbUpdates.end_time = updates.end;
  if (updates.due_time !== undefined) dbUpdates.due_time = updates.due_time;
  if (updates.importance !== undefined) dbUpdates.importance = updates.importance;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.links !== undefined) dbUpdates.links = updates.links;
  if (updates.files !== undefined) dbUpdates.files = updates.files;
  
  const { data, error } = await supabase
    .from('tasks')
    .update(dbUpdates)
    .eq('id', taskId)
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    name: data.title,
    start: data.start_time,
    end: data.end_time,
    due_time: data.due_time,
    importance: data.importance,
    description: data.description || '',
    links: data.links || '',
    files: data.files || '',
  };
};

export const deleteTask = async (taskId) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
  
  if (error) throw error;
  return { message: 'Task deleted' };
};

// Custom Tasks API
export const createCustomTask = async (customTaskData) => {
  const user = await getCurrentUser();
  
  const { data: customTask, error: ctError } = await supabase
    .from('custom_tasks')
    .insert([{
      user_id: user.id,
      name: customTaskData.name,
      description: customTaskData.description || '',
      links: customTaskData.links || '',
      files: customTaskData.files || '',
      overall_start_time: customTaskData.start,
      overall_due_time: customTaskData.due,
      total_length_minutes: customTaskData.length,
      importance: customTaskData.importance || 2,
      split_enabled: customTaskData.splitEnabled || false,
      block_duration_minutes: customTaskData.blockDuration || 30,
    }])
    .select()
    .single();
  
  if (ctError) throw ctError;
  
  // If split is enabled, create subtasks
  if (customTaskData.splitEnabled) {
    const tasks = [];
    let remaining = customTaskData.length;
    let currentStart = new Date(customTaskData.start);
    const dueTime = new Date(customTaskData.due);
    const blockDuration = customTaskData.blockDuration || 30;
    let blockNum = 1;
    
    while (remaining > 0 && currentStart < dueTime) {
      const blockEnd = new Date(currentStart.getTime() + blockDuration * 60000);
      const actualEnd = blockEnd > dueTime ? dueTime : blockEnd;
      const actualDuration = (actualEnd - currentStart) / 60000;
      
      tasks.push({
        user_id: user.id,
        title: `${customTaskData.name} (${blockNum})`,
        start_time: currentStart.toISOString(),
        end_time: actualEnd.toISOString(),
        due_time: dueTime.toISOString(),
        importance: customTaskData.importance || 2,
        description: customTaskData.description || '',
        links: customTaskData.links || '',
        files: customTaskData.files || '',
        parent_custom_task_id: customTask.id,
      });
      
      remaining -= actualDuration;
      currentStart = actualEnd;
      blockNum++;
    }
    
    if (tasks.length > 0) {
      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(tasks);
      
      if (tasksError) throw tasksError;
    }
  } else {
    // Create single task
    const taskEnd = new Date(new Date(customTaskData.start).getTime() + customTaskData.length * 60000);
    const actualEnd = taskEnd > new Date(customTaskData.due) ? new Date(customTaskData.due) : taskEnd;
    
    const { error: taskError } = await supabase
      .from('tasks')
      .insert([{
        user_id: user.id,
        title: customTaskData.name,
        start_time: customTaskData.start,
        end_time: actualEnd.toISOString(),
        due_time: customTaskData.due,
        importance: customTaskData.importance || 2,
        description: customTaskData.description || '',
        links: customTaskData.links || '',
        files: customTaskData.files || '',
        parent_custom_task_id: customTask.id,
      }]);
    
    if (taskError) throw taskError;
  }
  
  return { message: 'Custom task created', id: customTask.id };
};

// Focus Sessions API
export const getFocusSessions = async () => {
  const { data, error } = await supabase
    .from('focus_sessions')
    .select(`
      *,
      tasks (
        id,
        title
      )
    `)
    .order('start_time', { ascending: false });
  
  if (error) throw error;
  
  return data.map(session => ({
    id: session.id,
    task_id: session.task_id,
    task_name: session.tasks?.title || 'Unassigned',
    start_time: session.start_time,
    duration: session.duration,
    task_completed: session.task_completed,
  }));
};

export const createFocusSession = async (sessionData) => {
  const user = await getCurrentUser();
  
  const { data, error } = await supabase
    .from('focus_sessions')
    .insert([{
      user_id: user.id,
      task_id: sessionData.task_id || null,
      start_time: new Date().toISOString(),
      duration: sessionData.duration,
      task_completed: sessionData.task_completed || false,
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  // If task completed, add to completed tasks
  if (sessionData.task_completed && sessionData.task_id) {
    await supabase
      .from('completed_tasks')
      .insert([{
        user_id: user.id,
        task_id: sessionData.task_id,
        completion_date: new Date().toISOString(),
      }]);
  }
  
  // Fetch task name
  let taskName = 'Unassigned';
  if (data.task_id) {
    const { data: task } = await supabase
      .from('tasks')
      .select('title')
      .eq('id', data.task_id)
      .single();
    if (task) taskName = task.title;
  }
  
  return {
    id: data.id,
    task_id: data.task_id,
    task_name: taskName,
    start_time: data.start_time,
    duration: data.duration,
    task_completed: data.task_completed,
  };
};

export const deleteFocusSession = async (sessionId) => {
  const { error } = await supabase
    .from('focus_sessions')
    .delete()
    .eq('id', sessionId);
  
  if (error) throw error;
  return { message: 'Focus session deleted' };
};

// Completed Tasks API
export const getCompletedTasks = async () => {
  const { data, error } = await supabase
    .from('completed_tasks')
    .select(`
      *,
      tasks (
        id,
        title
      )
    `)
    .order('completion_date', { ascending: false });
  
  if (error) throw error;
  
  return data.map(ct => ({
    id: ct.id,
    task_id: ct.task_id,
    task_name: ct.tasks?.title || 'Unknown',
    completion_date: ct.completion_date,
  }));
};

export const completeTask = async (taskId) => {
  const user = await getCurrentUser();
  
  const { data, error } = await supabase
    .from('completed_tasks')
    .insert([{
      user_id: user.id,
      task_id: taskId,
      completion_date: new Date().toISOString(),
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  // Fetch task name
  const { data: task } = await supabase
    .from('tasks')
    .select('title')
    .eq('id', taskId)
    .single();
  
  return {
    id: data.id,
    task_id: taskId,
    task_name: task?.title || 'Unknown',
    completion_date: data.completion_date,
  };
};

export const deleteCompletedTask = async (completedTaskId) => {
  const { error } = await supabase
    .from('completed_tasks')
    .delete()
    .eq('id', completedTaskId);
  
  if (error) throw error;
  return { message: 'Completed task deleted' };
};

// Working Hours API
export const getWorkingHours = async () => {
  const { data, error } = await supabase
    .from('working_hours')
    .select('*')
    .order('day', { ascending: true });
  
  if (error) throw error;
  return data;
};

export const saveWorkingHours = async (hours) => {
  const user = await getCurrentUser();
  
  // Delete existing hours for these days
  const days = hours.map(h => h.day);
  await supabase
    .from('working_hours')
    .delete()
    .in('day', days);
  
  // Insert new hours
  const hoursData = hours.map(h => ({
    user_id: user.id,
    day: h.day,
    start: h.start,
    end: h.end,
  }));
  
  const { error } = await supabase
    .from('working_hours')
    .insert(hoursData);
  
  if (error) throw error;
  return { message: 'Hours saved' };
};

// Habits API
export const getHabits = async () => {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data;
};

export const createHabit = async (habitData) => {
  const user = await getCurrentUser();
  
  const { data, error } = await supabase
    .from('habits')
    .insert([{
      user_id: user.id,
      name: habitData.name,
      description: habitData.description || '',
      icon: habitData.icon || 'CheckCircle2',
      file: habitData.file || null,
      schedules: habitData.schedules,
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateHabit = async (habitId, updates) => {
  const { data, error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', habitId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteHabit = async (habitId) => {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId);
  
  if (error) throw error;
  return { message: 'Habit deleted' };
};

// Auto-schedule API (complex logic - might need edge function)
export const autoScheduleTasks = async (taskIds) => {
  // This is a complex function that was in the backend
  // For now, we'll implement a simplified version
  // In production, this should be an edge function
  
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .in('id', taskIds);
  
  if (error) throw error;
  
  // Simplified auto-scheduling logic
  // You might want to create a Supabase Edge Function for this
  const scheduled = [];
  
  for (const task of tasks) {
    const duration = new Date(task.end_time) - new Date(task.start_time);
    const newStart = new Date();
    const newEnd = new Date(newStart.getTime() + duration);
    
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
      })
      .eq('id', task.id);
    
    if (!updateError) {
      scheduled.push({
        id: task.id,
        start: newStart.toISOString(),
        end: newEnd.toISOString(),
      });
    }
  }
  
  return { scheduled };
};
