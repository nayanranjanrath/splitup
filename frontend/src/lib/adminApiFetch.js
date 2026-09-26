const API_URL = "http://localhost:3000";

export async function adminApiFetch(
  path,
  { method = "GET", body } = {}
) {
  let res;

  try {
    res = await fetch(API_URL + path, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Unable to connect to server");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const adminLogin = ({ email, password }) =>
  adminApiFetch("/adminlogin", {
    method: "POST",
    body: {
      email,
      password,
    },
  });