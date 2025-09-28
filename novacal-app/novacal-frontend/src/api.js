export async function authedFetch(endpoint, options = {}) {
  // This is the critical change for production deployment 
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const fullUrl = `${API_BASE_URL}${endpoint}`; // e.g., https://api.render.com/api/tasks

  const token = localStorage.getItem("api_token");

  // Headers setup remains the same
  const headers = {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
  };

  return fetch(fullUrl, { // <-- Now fetches the complete, external URL
      ...options,
      headers,
  });
}