export interface UpdateOrderStatusRequestDto {
  nuevoEstado: 'sin_confirmar' | 'pendiente' | 'entregado' | 'cancelado';
}
