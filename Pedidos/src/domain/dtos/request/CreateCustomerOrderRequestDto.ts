export interface CreateCustomerOrderRequestDto {
  productos: Array<{
    idProducto: number;
    cantidad: number;
  }>;
  idMesa?: number;
}
