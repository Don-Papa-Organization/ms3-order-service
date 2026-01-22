export interface PedidoDto {
    idPedido?: number;
    total: number;
    canalVenta: 'web' | 'fisico';
    estado: 'sin_confirmar' | 'pendiente' | 'entregado' | 'cancelado';
    fechaPedido: Date;
    direccionEntrega?: string;
    idUsuario: number;
}
