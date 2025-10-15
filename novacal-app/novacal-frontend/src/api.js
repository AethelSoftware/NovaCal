import { supabase } from './lib/supabaseClient';

export async function authedFetch(tableName, options = {}) {
  const { method = 'GET', body } = options;

  let query = supabase.from(tableName);

  switch (method) {
    case 'GET':
      query = query.select();
      break;
    case 'POST':
      query = query.insert(body);
      break;
    case 'PATCH':
      query = query.update(body).match({ id: body.id });
      break;
    case 'DELETE':
      query = query.delete().match({ id: body.id });
      break;
    default:
      return Promise.reject(new Error(`Unsupported method: ${method}`));
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}
