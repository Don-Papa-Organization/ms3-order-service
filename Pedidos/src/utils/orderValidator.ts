import { Request, Response } from "express";

/**
 * Centralized validator for common validations
 * Eliminates code duplication across controllers
 */
export class OrderValidator {
  /**
   * Validate authenticated user from request
   */
  static validateAuthenticatedUser(req: Request, res: Response): number | null {
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

  /**
   * Validate and parse integer ID from string
   */
  static validateIntegerId(value: string, fieldName: string, res: Response): number | null {
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

  /**
   * Validate required fields in object
   */
  static validateRequiredFields(data: any, fields: string[], res: Response): boolean {
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

  /**
   * Validate that fields are integers
   */
  static validateIntegerFields(data: any, fields: string[], res: Response): boolean {
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

  /**
   * Validate positive number
   */
  static validatePositiveNumber(value: number, fieldName: string, res: Response): boolean {
    if (value <= 0) {
      res.status(400).json({
        success: false,
        message: `${fieldName} debe ser mayor a 0`
      });
      return false;
    }
    return true;
  }

  /**
   * Validate date range
   */
  static validateDateRange(fechaInicio: Date, fechaFin: Date, res: Response): boolean {
    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      res.status(400).json({
        success: false,
        message: "Formato de fecha inválido. Use formato ISO (YYYY-MM-DD)"
      });
      return false;
    }

    if (fechaInicio > fechaFin) {
      res.status(400).json({
        success: false,
        message: "La fecha de inicio debe ser anterior a la fecha de fin"
      });
      return false;
    }

    return true;
  }
}
