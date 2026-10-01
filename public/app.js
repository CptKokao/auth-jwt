const $ = (id) => document.getElementById(id);
let accessToken = "";

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function renderToken() {
  $("token").textContent = accessToken;
  const info = accessToken ? decodeToken(accessToken) : null;
  $("user-info").textContent = info ? `${info.email} · ${info.role}` : "";
}

function clearToken() {
  accessToken = "";
  renderToken();
  log("Access-токен очищен (кука refreshToken осталась у браузера)");
}

function log(data, status) {
  const out = $("output");
  const s = status !== undefined ? String(status) : "";
  const cls = status >= 200 && status < 300 ? "ok" : "err";
  out.innerHTML = "";
  const span = document.createElement("span");
  span.className = "status " + cls;
  span.textContent = s ? "HTTP " + s + "\n\n" : "";
  out.appendChild(span);
  out.appendChild(
    document.createTextNode(
      typeof data === "string" ? data : JSON.stringify(data, null, 2),
    ),
  );
}

async function api(path, { method = "GET", body } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers["Authorization"] = "Bearer " + accessToken;

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { status: res.status, data };
}

async function signup() {
  const email = $("signup-email").value;
  const password = $("signup-password").value;
  const { status, data } = await api("/api/auth/signup", {
    method: "POST",
    body: { email, password },
  });
  if (status === 201 && data && data.accessToken)
    accessToken = data.accessToken;
  renderToken();
  log(data, status);
}

async function login() {
  const email = $("login-email").value;
  const password = $("login-password").value;
  const { status, data } = await api("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (status === 200 && data && data.accessToken)
    accessToken = data.accessToken;
  renderToken();
  log(data, status);
}

async function me() {
  const { status, data } = await api("/api/auth/me");
  log(data, status);
}

async function admin() {
  const { status, data } = await api("/api/auth/admin");
  log(data, status);
}

async function refresh() {
  const { status, data } = await api("/api/auth/refresh", { method: "POST" });
  if (status === 200 && data && data.accessToken)
    accessToken = data.accessToken;
  renderToken();
  log(data, status);
}

async function logout() {
  const { status, data } = await api("/api/auth/logout", { method: "POST" });
  accessToken = "";
  renderToken();
  log(data ?? "OK", status);
}

$("btn-signup").addEventListener("click", signup);
$("btn-login").addEventListener("click", login);
$("btn-me").addEventListener("click", me);
$("btn-refresh").addEventListener("click", refresh);
$("btn-admin").addEventListener("click", admin);
$("btn-logout").addEventListener("click", logout);
$("btn-clear").addEventListener("click", clearToken);

renderToken();
