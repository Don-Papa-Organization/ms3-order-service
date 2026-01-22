/**
 * Enumeraciones para valores de dominio de pedidos
 * Proporciona type-safety y evita strings mágicos
 */

export enum EstadoPedido {
  SIN_CONFIRMAR = 'sin_confirmar',
  PENDIENTE = 'pendiente',
  ENTREGADO = 'entregado',
  CANCELADO = 'cancelado'
}

export enum CanalVenta {
  WEB = 'web',
  FISICO = 'fisico'
}

/**
 * Resultado estándar de operaciones de servicio
 * Permite al controlador decidir el código HTTP sin múltiples catch
 */
export interface ServiceResult<T = any> {
  status: number;
  message?: string;
  data?: T;
}
