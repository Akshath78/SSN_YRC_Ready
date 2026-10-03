export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Start the application-owned Google OAuth flow. */
export const startGoogleLogin = () => {
  window.location.href = "/api/google/login";
};
