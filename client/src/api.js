// api.js - every request the React app makes to the Express server.
// Each function returns the JSON the server sends back, or throws an
// Error with a readable message if something went wrong.

async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',               // send the session cookie
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options
  });

  // Not logged in (or the session ran out) -> back to the login page
  if (res.status === 401) {
    window.location.assign('/login.html');
    throw new Error('Please log in again.');
  }

  let data = null;
  try { data = await res.json(); } catch { /* no JSON body */ }

  if (!res.ok) {
    throw new Error((data && data.error) || 'Something went wrong. Please try again.');
  }
  return data;
}

// Who is logged in: { id, username, email }
export const getMe = () => request('/api/me');

// The closet
export const getItems = () => request('/api/items');
export const addItem = item =>
  request('/api/items', { method: 'POST', body: JSON.stringify(item) });
export const updateItem = (id, item) =>
  request(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(item) });
export const deleteItem = id =>
  request(`/api/items/${id}`, { method: 'DELETE' });
