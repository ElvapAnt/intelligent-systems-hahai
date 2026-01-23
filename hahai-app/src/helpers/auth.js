const TOKEN_KEY = "internToken";
const RFZO_TOKEN_KEY = "rfzoToken";

export function setInternToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function getInternToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearInternToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}
