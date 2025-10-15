const API_URL = "http://127.0.0.1:5000";

export async function authedFetch(url, options = {}) {
    const token = localStorage.getItem("api_token");
    return fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    });
  }