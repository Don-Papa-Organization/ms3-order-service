import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwtUtil";
import { TipoUsuario } from "../types/express";
import { extractToken } from "../utils/tokenExtractor";

export const authenticateToken = (req: Request, res: Response, next: NextFunction): any => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: "No se proporcionó access token" });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    req.user = payload;
    return next();
  } catch (error: any) {
    console.error("Error en autenticación:", error.message);
    return res.status(500).json({ message: "Error interno de autenticación" });
  }
};

export const requireUsuarioActivo = (req: Request, res: Response, next: NextFunction): any => {
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado" });
  }
  if (!req.user.activo) {
    return res.status(403).json({ message: "Usuario no activo" });
  }
  return next();
};

export const requireRoles = (...rolesPermitidos: TipoUsuario[]) => (req: Request, res: Response, next: NextFunction): any => {
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado" });
  }
  if (!req.user.activo) {
    return res.status(403).json({ message: "Usuario no activo" });
  }
  if (!rolesPermitidos.includes(req.user.tipoUsuario)) {
    return res.status(403).json({ message: "No tiene permisos para esta operación" });
  }
  return next();
};