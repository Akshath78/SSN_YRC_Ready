import { randomUUID } from "node:crypto";
import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

const GOOGLE_STATE_COOKIE = "google_oauth_state";

type GoogleTokenResponse = { access_token?: string; error?: string; error_description?: string };
type GoogleUserInfo = { sub?: string; name?: string; email?: string; email_verified?: boolean };

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function publicOrigin(req: Request): string {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost)?.split(",")[0]?.trim() || req.get("host");
  if (!host) throw new Error("Unable to determine public OAuth host");
  const isLocalHost = host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]");
  const forwarded = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)?.split(",")[0]?.trim();
  const proto = isLocalHost ? (forwarded || req.protocol) : "https";
  return `${proto}://${host}`;
}

function secureForRequest(req: Request): boolean {
  return publicOrigin(req).startsWith("https://");
}

function googleStateCookieOptions(req: Request) {
  const secure = secureForRequest(req);
  return { httpOnly: true, path: "/", maxAge: 10 * 60 * 1000, sameSite: secure ? "none" as const : "lax" as const, secure };
}

function encodeGoogleState(nonce: string): string {
  return Buffer.from(JSON.stringify({ nonce })).toString("base64url");
}

function decodeGoogleState(value: string): { nonce?: string } {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as { nonce?: unknown };
    return { nonce: typeof parsed.nonce === "string" ? parsed.nonce : undefined };
  } catch {
    return {};
  }
}

async function exchangeGoogleCode(code: string, redirectUri: string): Promise<GoogleTokenResponse> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const payload = await response.json() as GoogleTokenResponse;
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || payload.error || "Google token exchange failed");
  return payload;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/google/login", (req: Request, res: Response) => {
    if (!ENV.googleClientId || !ENV.googleClientSecret) {
      res.status(503).json({ error: "Google OAuth is not configured" });
      return;
    }
    const nonce = randomUUID();
    const redirectUri = `${publicOrigin(req)}/api/google/callback`;
    const state = encodeGoogleState(nonce);
    res.cookie(GOOGLE_STATE_COOKIE, nonce, googleStateCookieOptions(req));
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", ENV.googleClientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "select_account");
    res.redirect(302, url.toString());
  });

  app.get("/api/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "Google code and state are required" });
      return;
    }

    const { nonce } = decodeGoogleState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[GOOGLE_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid Google OAuth state" });
      return;
    }
    res.clearCookie(GOOGLE_STATE_COOKIE, googleStateCookieOptions(req));

    try {
      const redirectUri = `${publicOrigin(req)}/api/google/callback`;
      const token = await exchangeGoogleCode(code, redirectUri);
      const userResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      const googleUser = await userResponse.json() as GoogleUserInfo;
      if (!userResponse.ok || !googleUser.sub) throw new Error("Google user info lookup failed");

      const openId = `google:${googleUser.sub}`;
      const name = googleUser.name || googleUser.email || "READY learner";
      await db.upsertUser({
        openId,
        name,
        email: googleUser.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, { name, expiresInMs: ONE_YEAR_MS });
      res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error instanceof Error ? error.message : "unknown error");
      res.status(500).json({ error: "Google OAuth callback failed" });
    }
  });

  // Keep the starter Manus callback available for platform-level Preview sessions.
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await db.upsertUser({ openId: userInfo.openId, name: userInfo.name || null, email: userInfo.email ?? null, loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null, lastSignedIn: new Date() });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, { name: userInfo.name || "", expiresInMs: ONE_YEAR_MS });
      res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error instanceof Error ? error.message : "unknown error");
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
