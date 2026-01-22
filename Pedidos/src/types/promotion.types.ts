/**
 * DTOs para el sistema de promociones
 */

export interface PromocionDto {
  idPromocion?: number;
  nombre: string;
  descripcion: string;
  fechaInicio: Date;
  fechaFin: Date;
  tipoPromocion: 'porcentaje' | 'precio_fijo';
  activo: boolean;
}

export interface ProductoPromocionDto {
  idProductoPromocion?: number;
  precioPromocional?: number;
  porcentajeDescuento?: number;
  cantidadMinima: number;
  idProducto: number;
  idPromocion: number;
}

export interface PromocionEventoDiaDto {
  idPromocionEventoDia?: number;
  idPromocion: number;
  idEventoDiaSemana: number;
}

/**
 * Respuesta del endpoint de promociones de un producto
 */
export interface PromocionesProductoResponse {
  idProducto: number;
  totalPromociones: number;
  promociones: ProductoPromocionConDetalle[];
}

/**
 * Producto promoción con detalles de la promoción
 */
export interface ProductoPromocionConDetalle extends ProductoPromocionDto {
  detallePromocion: PromocionDto;
}

/**
 * DTO del producto desde inventario
 */
export interface ProductoDto {
  idProducto?: number;
  nombre: string;
  precio: number;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
  descripcion?: string;
  urlImagen?: string;
  idCategoria?: number;
}
