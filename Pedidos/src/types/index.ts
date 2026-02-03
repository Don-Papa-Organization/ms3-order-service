/**
 * Tipo genérico para respuestas HTTP estandarizadas
 * Todos los endpoints deben retornar este formato
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  timestamp: string;
}
