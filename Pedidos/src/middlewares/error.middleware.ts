import { Request, Response, NextFunction } from "express";

/**
 * Clase de error personalizada para la aplicación
 * Extiende Error nativo y agrega statusCode HTTP
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Middleware central para manejo de errores
 * Captura todos los errores y los formatea en respuesta estándar
 * DEBE SER EL ÚLTIMO MIDDLEWARE REGISTRADO
 */
export const errorMiddleware = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error.message || "Error interno del servidor";

  console.error(`[ERROR] ${statusCode} - ${message}`, error);

  res.status(statusCode).json({
    success: false,
    data: null,
    message,
    timestamp: new Date().toISOString()
  });
};
