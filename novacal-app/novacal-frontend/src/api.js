export async function authedFetch(url, options = {}) {
    const token = localStorage.getItem("api_token");
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    });
  }