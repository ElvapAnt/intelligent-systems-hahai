const TOKEN_KEY = "internToken";
const ADMIN_LOGGED_IN_KEY = "adminLoggedIn";

export function setInternToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function getInternToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearInternToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function isInternLoggedIn() {
  return !!getInternToken();
}

export function setAdminLoggedIn(value) {
  sessionStorage.setItem(ADMIN_LOGGED_IN_KEY, value ? "true" : "false");
}

export function isAdminLoggedIn() {
  return sessionStorage.getItem(ADMIN_LOGGED_IN_KEY) === "true";
}

export function clearAdminLoggedIn() {
  sessionStorage.removeItem(ADMIN_LOGGED_IN_KEY);
}

export function isAnyoneLoggedIn() {
  return isInternLoggedIn() || isAdminLoggedIn();
}

export function getRole() {
  if (isAdminLoggedIn()) return "admin";
  if (isInternLoggedIn()) return "intern";
  return null;
}