export interface PagoDto {
    idPago?: number;
    urlComprobante: string;
    monto: number;
    fechaPago: Date;
    idPedido: number;
    idMetodoPago: number;
}
