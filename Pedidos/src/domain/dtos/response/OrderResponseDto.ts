export interface OrderResponseDto {
  idPedido: number;
  idUsuario: number;
  total: number;
  estado: string;
  canalVenta: string;
  fechaPedido: Date;
  direccionEntrega?: string;
  idMesa?: number;
}

export interface OrderWithProductsResponseDto extends OrderResponseDto {
  productos: OrderProductResponseDto[];
  cantidadProductos?: number;
}

export interface OrderProductResponseDto {
  idProductoPedido: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface CartResponseDto {
  pedido: OrderResponseDto;
  productos: OrderProductResponseDto[];
}
