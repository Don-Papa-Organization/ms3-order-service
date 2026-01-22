import { Request } from "express";

/**
 * Extrae el token de acceso de las cookies o del header Authorization
 * Soporta múltiples clientes (browser con cookies, mobile/API con headers)
 */
export function extractToken(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/accessToken=([^;]+)/);
    if (match?.[1]) return match[1];
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }

  return undefined;
}
