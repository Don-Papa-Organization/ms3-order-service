import { Request, Response } from "express";

/**
 * Validaciones reutilizables para controladores
 * Simplifica la lógica de validación y proporciona respuestas consistentes
 */

export function validateAuthenticated(req: Request, res: Response): number | null {
  const idUsuario = req.user?.id;
  if (!idUsuario) {
    res.status(401).json({ 
      success: false,
      message: "Usuario no autenticado" 
    });
    return null;
  }
  return idUsuario;
}

export function validateIntegerId(value: string, fieldName: string, res: Response): number | null {
  const id = parseInt(value);
  if (isNaN(id)) {
    res.status(400).json({
      success: false,
      message: `${fieldName} inválido`
    });
    return null;
  }
  return id;
}

export function validateRequiredFields(data: any, fields: string[], res: Response): boolean {
  for (const field of fields) {
    if (!data[field]) {
      res.status(400).json({
        success: false,
        message: `El campo '${field}' es requerido`
      });
      return false;
    }
  }
  return true;
}

export function validateIntegerFields(data: any, fields: string[], res: Response): boolean {
  for (const field of fields) {
    if (data[field] !== undefined && !Number.isInteger(data[field])) {
      res.status(400).json({
        success: false,
        message: `El campo '${field}' debe ser un número entero`
      });
      return false;
    }
  }
  return true;
}
