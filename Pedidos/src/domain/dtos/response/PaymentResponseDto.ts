export interface PaymentResponseDto {
  idPago: number;
  urlComprobante: string;
  monto: number;
  fechaPago: Date;
  idPedido: number;
  idMetodoPago: number;
}

export interface PaymentWithDetailsResponseDto extends PaymentResponseDto {
  metodoPago?: {
    idMetodoPago: number;
    nombre: string;
  };
  pedido?: {
    idPedido: number;
    idUsuario: number;
    total: number;
    estado: string;
    fechaPedido: Date;
    direccionEntrega?: string;
    canalVenta: string;
    idMesa?: number;
  };
}

export interface PaymentMethodResponseDto {
  idMetodo: number;
  nombre: string;
}
