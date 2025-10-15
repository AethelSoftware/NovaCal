import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Task {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  due_time: string | null;
  importance: number;
  user_id: string;
}

interface FreeSlot {
  start: Date;
  end: Date;
}

function findFreeSlots(existingTasks: Task[], dayStart: Date, dayEnd: Date): FreeSlot[] {
  const slots: FreeSlot[] = [];
  let prevEnd = dayStart;

  const sorted = existingTasks.sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  for (const task of sorted) {
    const taskStart = new Date(task.start_time);
    const taskEnd = new Date(task.end_time);

    if (taskStart > prevEnd) {
      slots.push({ start: prevEnd, end: taskStart });
    }
    prevEnd = taskEnd > prevEnd ? taskEnd : prevEnd;
  }

  if (prevEnd < dayEnd) {
    slots.push({ start: prevEnd, end: dayEnd });
  }

  return slots;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from JWT
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get request body
    const { task_ids } = await req.json();

    if (!task_ids || !Array.isArray(task_ids) || task_ids.length === 0) {
      return new Response(JSON.stringify({ error: 'No task IDs provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch tasks to schedule
    const { data: unscheduledTasks, error: fetchError } = await supabaseClient
      .from('tasks')
      .select('*')
      .in('id', task_ids)
      .eq('user_id', user.id);

    if (fetchError || !unscheduledTasks || unscheduledTasks.length === 0) {
      return new Response(JSON.stringify({ error: 'No matching tasks found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find min start and max due time
    const minStart = new Date(
      Math.min(...unscheduledTasks.map(t => new Date(t.start_time).getTime()))
    );
    const maxDue = new Date(
      Math.max(
        ...unscheduledTasks.map(t => 
          new Date(t.due_time || t.end_time).getTime()
        )
      )
    );

    // Fetch already scheduled tasks in the time range
    const { data: scheduledTasks } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', minStart.toISOString())
      .lte('end_time', maxDue.toISOString())
      .not('id', 'in', `(${task_ids.join(',')})`);

    const DAY_START = 8; // 8 AM
    const DAY_END = 22;  // 10 PM

    // Sort tasks by priority
    const sortedTasks = unscheduledTasks.sort((a, b) => {
      const aDue = new Date(a.due_time || a.end_time).getTime();
      const bDue = new Date(b.due_time || b.end_time).getTime();
      if (aDue !== bDue) return aDue - bDue;

      if (a.importance !== b.importance) return b.importance - a.importance;

      const aDuration = new Date(a.end_time).getTime() - new Date(a.start_time).getTime();
      const bDuration = new Date(b.end_time).getTime() - new Date(b.start_time).getTime();
      return bDuration - aDuration;
    });

    const scheduledUpdates: Array<{ id: string; start: string; end: string }> = [];
    const currentScheduled = [...(scheduledTasks || [])];

    for (const task of sortedTasks) {
      const taskDuration =
        (new Date(task.end_time).getTime() - new Date(task.start_time).getTime()) / 60000;
      const deadlineDay = new Date(task.due_time || task.end_time);
      let dayCursor = new Date();
      dayCursor.setHours(0, 0, 0, 0);

      let placed = false;

      while (dayCursor <= deadlineDay && !placed) {
        const dayStart = new Date(dayCursor);
        dayStart.setHours(DAY_START, 0, 0, 0);
        const dayEnd = new Date(dayCursor);
        dayEnd.setHours(DAY_END, 0, 0, 0);

        // Get tasks for this day
        const dayTasks = currentScheduled.filter(t => {
          const tStart = new Date(t.start_time);
          return (
            tStart.getFullYear() === dayCursor.getFullYear() &&
            tStart.getMonth() === dayCursor.getMonth() &&
            tStart.getDate() === dayCursor.getDate()
          );
        });

        const freeSlots = findFreeSlots(dayTasks, dayStart, dayEnd);

        for (const slot of freeSlots) {
          const slotLength = (slot.end.getTime() - slot.start.getTime()) / 60000;

          if (slotLength >= taskDuration) {
            const newStart = slot.start;
            const newEnd = new Date(newStart.getTime() + taskDuration * 60000);

            // Update task in database
            await supabaseClient
              .from('tasks')
              .update({
                start_time: newStart.toISOString(),
                end_time: newEnd.toISOString(),
              })
              .eq('id', task.id);

            scheduledUpdates.push({
              id: task.id,
              start: newStart.toISOString(),
              end: newEnd.toISOString(),
            });

            // Add to scheduled list
            currentScheduled.push({
              ...task,
              start_time: newStart.toISOString(),
              end_time: newEnd.toISOString(),
            });

            placed = true;
            break;
          }
        }

        if (placed) break;
        dayCursor.setDate(dayCursor.getDate() + 1);
      }
    }

    return new Response(JSON.stringify({ scheduled: scheduledUpdates }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in auto-schedule function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
