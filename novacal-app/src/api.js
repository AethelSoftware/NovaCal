// src/api.js
// Complete API wrapper for Supabase - replaces old Flask backend calls

import { supabase } from './lib/supabaseClient';
import { 
  getTasks, 
  getFocusSessions, 
  getCompletedTasks,
  createTask,
  updateTask,
  deleteTask,
  createFocusSession,
  deleteFocusSession,
  completeTask,
  deleteCompletedTask,
  createCustomTask,
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit
} from './lib/supabaseApi';

/**
 * Wrapper function to maintain compatibility with existing authedFetch calls
 * Maps old Flask API routes to new Supabase functions
 */
export async function authedFetch(endpoint, options = {}) {
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const method = options.method || 'GET';
    let body = null;
    
    // Parse body if it exists
    if (options.body) {
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      } catch (e) {
        console.error('Failed to parse body:', e);
        body = options.body;
      }
    }

    // Route to appropriate Supabase function
    // Handle basic endpoints
    if (endpoint === 'tasks') {
      if (method === 'GET') {
        const data = await getTasks();
        return createMockResponse(data);
      } else if (method === 'POST') {
        const data = await createTask(body);
        return createMockResponse(data);
      }
    }

    if (endpoint === 'focus_sessions') {
      if (method === 'GET') {
        const data = await getFocusSessions();
        return createMockResponse(data);
      } else if (method === 'POST') {
        const data = await createFocusSession(body);
        return createMockResponse(data);
      }
    }

    if (endpoint === 'completed_tasks') {
      if (method === 'GET') {
        const data = await getCompletedTasks();
        return createMockResponse(data);
      } else if (method === 'POST') {
        const data = await completeTask(body.task_id);
        return createMockResponse(data);
      }
    }

    if (endpoint === 'custom_tasks') {
      if (method === 'POST') {
        const data = await createCustomTask(body);
        return createMockResponse(data);
      }
    }

    if (endpoint === 'habits') {
      if (method === 'GET') {
        const data = await getHabits();
        return createMockResponse(data);
      } else if (method === 'POST') {
        const data = await createHabit(body);
        return createMockResponse(data);
      }
    }

    // Handle dynamic endpoints with IDs
    const parts = endpoint.split('/');
    
    if (parts[0] === 'tasks' && parts.length === 2) {
      const taskId = parts[1];
      if (method === 'PATCH') {
        const data = await updateTask(taskId, body);
        return createMockResponse(data);
      } else if (method === 'DELETE') {
        const data = await deleteTask(taskId);
        return createMockResponse(data);
      }
    }

    if (parts[0] === 'focus_sessions' && parts.length === 2) {
      const sessionId = parts[1];
      if (method === 'DELETE') {
        const data = await deleteFocusSession(sessionId);
        return createMockResponse(data);
      }
    }

    if (parts[0] === 'completed_tasks' && parts.length === 2) {
      const completedId = parts[1];
      if (method === 'DELETE') {
        const data = await deleteCompletedTask(completedId);
        return createMockResponse(data);
      }
    }

    if (parts[0] === 'habits' && parts.length === 2) {
      const habitId = parts[1];
      if (method === 'PATCH') {
        const data = await updateHabit(habitId, body);
        return createMockResponse(data);
      } else if (method === 'DELETE') {
        const data = await deleteHabit(habitId);
        return createMockResponse(data);
      }
    }
    
    throw new Error(`Unhandled endpoint: ${method} ${endpoint}`);
    
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    
    // Return error response in fetch-compatible format
    return createMockResponse(
      { error: error.message || 'Unknown error' }, 
      false, 
      500
    );
  }
}

/**
 * Creates a mock Response object compatible with fetch API
 * This ensures compatibility with existing code that expects fetch responses
 */
function createMockResponse(data, ok = true, status = 200) {
  const responseData = data;
  
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    
    json: async () => {
      // If there was an error and data is not ok, throw it
      if (!ok && responseData.error) {
        return responseData;
      }
      return responseData;
    },
    
    text: async () => JSON.stringify(responseData),
    
    // Add other Response methods for completeness
    clone: function() {
      return createMockResponse(responseData, ok, status);
    },
    
    arrayBuffer: async () => {
      throw new Error('arrayBuffer not implemented');
    },
    
    blob: async () => {
      throw new Error('blob not implemented');
    },
    
    formData: async () => {
      throw new Error('formData not implemented');
    }
  };
}

// Re-export Supabase client for direct use if needed
export { supabase };