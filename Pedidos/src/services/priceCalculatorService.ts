import { PromotionService } from './apis/promotionService';
import { InventoryService } from './apis/inventoryService';
import { ProductoPromocionConDetalle, PromocionDto } from '../types/promotion.types';

/**
 * Resultado del cálculo de precio con promoción
 */
export interface PriceCalculationResult {
  precioOriginal: number;
  precioFinal: number;
  descuentoAplicado: number;
  porcentajeDescuento: number;
  promocionAplicada: ProductoPromocionConDetalle | null;
  tienePromocion: boolean;
}

/**
 * Resultado del cálculo total de un pedido
 */
export interface OrderTotalCalculationResult {
  subtotalOriginal: number;
  subtotalConDescuento: number;
  descuentoTotal: number;
  productosConDescuento: ProductoConDescuento[];
}

/**
 * Producto con información de descuento aplicado
 */
export interface ProductoConDescuento {
  idProducto: number;
  cantidad: number;
  precioOriginal: number;
  precioUnitarioFinal: number;
  subtotalOriginal: number;
  subtotalFinal: number;
  descuentoAplicado: number;
  tienePromocion: boolean;
  promocionAplicada: ProductoPromocionConDetalle | null;
}

/**
 * Servicio de lógica de negocio para cálculo de precios con promociones.
 * Separado de las llamadas HTTP para mejor testeo y mantenibilidad.
 */
export class PriceCalculatorService {
  private promotionService: PromotionService;
  private inventoryService: InventoryService;

  constructor() {
    this.promotionService = new PromotionService();
    this.inventoryService = new InventoryService();
  }

  /**
   * Calcular el precio final de un producto aplicando promociones activas
   * @param idProducto ID del producto
   * @param cantidad Cantidad de productos a comprar
   * @param accessToken Token de autenticación del usuario
   * @returns Objeto con precio final, descuento aplicado y detalles de la promoción
   */
  async calcularPrecioConPromocion(
    idProducto: number,
    cantidad: number,
    accessToken?: string
  ): Promise<PriceCalculationResult> {
    let precioOriginal = 0;
    
    try {
      // 1. Obtener el producto del inventario para obtener el precio original
      const producto = await this.inventoryService.getProductoById(idProducto, accessToken);
      
      if (!producto) {
        throw new Error(`Producto con ID ${idProducto} no encontrado en inventario`);
      }

      precioOriginal = producto.precio;

      // 2. Obtener promociones del producto
      const promocionesData = await this.promotionService.getPromocionesDeProducto(idProducto, accessToken);

      // 3. Si no hay promociones, retornar precio original
      if (!promocionesData || !promocionesData.promociones || promocionesData.promociones.length === 0) {
        return this.buildResultSinPromocion(precioOriginal);
      }

      // 4. Calcular mejor promoción aplicable
      const mejorPromocion = this.seleccionarMejorPromocion(
        promocionesData.promociones,
        precioOriginal,
        cantidad
      );

      // 5. Si se encontró una promoción válida, aplicarla
      if (mejorPromocion) {
        return this.buildResultConPromocion(
          precioOriginal,
          mejorPromocion.precioFinal,
          mejorPromocion.descuentoCalculado,
          mejorPromocion.promocion
        );
      }

      // 6. Si ninguna promoción aplicó
      return this.buildResultSinPromocion(precioOriginal);
    } catch (error: any) {
      console.error('Error al calcular precio con promoción:', error.message);
      // En caso de error, devolver precio original sin descuento
      return this.buildResultSinPromocion(precioOriginal);
    }
  }

  /**
   * Seleccionar la mejor promoción aplicable de una lista
   * @param promociones Lista de promociones del producto
   * @param precioOriginal Precio original del producto
   * @param cantidad Cantidad solicitada
   * @returns Mejor promoción con precio calculado o null
   */
  private seleccionarMejorPromocion(
    promociones: ProductoPromocionConDetalle[],
    precioOriginal: number,
    cantidad: number
  ): { promocion: ProductoPromocionConDetalle; precioFinal: number; descuentoCalculado: number } | null {
    const ahora = new Date();
    let mejorPromocion: ProductoPromocionConDetalle | null = null;
    let mayorDescuento = 0;
    let precioConDescuento = precioOriginal;

    for (const productoPromocion of promociones) {
      const detallePromocion = productoPromocion.detallePromocion;

      // Validar que la promoción esté activa
      if (!this.esPromocionValida(detallePromocion, ahora)) continue;

      // Validar cantidad mínima
      if (cantidad < productoPromocion.cantidadMinima) continue;

      // Calcular precio con descuento
      const resultado = this.calcularDescuento(productoPromocion, precioOriginal);

      // Guardar la mejor promoción (mayor descuento)
      if (resultado.descuentoCalculado > mayorDescuento) {
        mayorDescuento = resultado.descuentoCalculado;
        precioConDescuento = resultado.precioFinal;
        mejorPromocion = productoPromocion;
      }
    }

    if (mejorPromocion) {
      return {
        promocion: mejorPromocion,
        precioFinal: precioConDescuento,
        descuentoCalculado: mayorDescuento,
      };
    }

    return null;
  }

  /**
   * Validar si una promoción está activa y dentro del rango de fechas
   */
  private esPromocionValida(detallePromocion: PromocionDto, fechaActual: Date): boolean {
    if (!detallePromocion || !detallePromocion.activo) return false;

    const fechaInicio = new Date(detallePromocion.fechaInicio);
    const fechaFin = new Date(detallePromocion.fechaFin);

    return fechaActual >= fechaInicio && fechaActual <= fechaFin;
  }

  /**
   * Calcular el descuento según el tipo de promoción
   */
  private calcularDescuento(
    productoPromocion: ProductoPromocionConDetalle,
    precioOriginal: number
  ): { precioFinal: number; descuentoCalculado: number } {
    let descuentoCalculado = 0;
    let precioFinal = precioOriginal;

    // Precio fijo promocional tiene prioridad
    if (productoPromocion.precioPromocional !== null && productoPromocion.precioPromocional !== undefined) {
      precioFinal = productoPromocion.precioPromocional;
      descuentoCalculado = ((precioOriginal - precioFinal) / precioOriginal) * 100;
    } 
    // Porcentaje de descuento
    else if (productoPromocion.porcentajeDescuento !== null && productoPromocion.porcentajeDescuento !== undefined) {
      descuentoCalculado = productoPromocion.porcentajeDescuento;
      precioFinal = precioOriginal * (1 - descuentoCalculado / 100);
    }

    return {
      precioFinal: Number(precioFinal.toFixed(2)),
      descuentoCalculado: Number(descuentoCalculado.toFixed(2)),
    };
  }

  /**
   * Construir resultado sin promoción
   */
  private buildResultSinPromocion(precioOriginal: number): PriceCalculationResult {
    return {
      precioOriginal,
      precioFinal: precioOriginal,
      descuentoAplicado: 0,
      porcentajeDescuento: 0,
      promocionAplicada: null,
      tienePromocion: false,
    };
  }

  /**
   * Construir resultado con promoción aplicada
   */
  private buildResultConPromocion(
    precioOriginal: number,
    precioFinal: number,
    porcentajeDescuento: number,
    promocion: any
  ): PriceCalculationResult {
    return {
      precioOriginal,
      precioFinal: Number(precioFinal.toFixed(2)),
      descuentoAplicado: Number((precioOriginal - precioFinal).toFixed(2)),
      porcentajeDescuento: Number(porcentajeDescuento.toFixed(2)),
      promocionAplicada: promocion,
      tienePromocion: true,
    };
  }

  /**
   * Calcular el precio total de un pedido aplicando promociones a cada producto
   * @param productos Array de productos con {idProducto, cantidad}
   * @param accessToken Token de autenticación del usuario
   * @returns Objeto con detalles del cálculo total
   */
  async calcularTotalPedidoConPromociones(
    productos: Array<{ idProducto: number; cantidad: number }>,
    accessToken?: string
  ): Promise<OrderTotalCalculationResult> {
    const productosConDescuento = await Promise.all(
      productos.map(async (producto) => {
        const resultado = await this.calcularPrecioConPromocion(
          producto.idProducto,
          producto.cantidad,
          accessToken
        );

        return {
          idProducto: producto.idProducto,
          cantidad: producto.cantidad,
          precioOriginal: resultado.precioOriginal,
          precioUnitarioFinal: resultado.precioFinal,
          subtotalOriginal: resultado.precioOriginal * producto.cantidad,
          subtotalFinal: resultado.precioFinal * producto.cantidad,
          descuentoAplicado: resultado.descuentoAplicado * producto.cantidad,
          tienePromocion: resultado.tienePromocion,
          promocionAplicada: resultado.promocionAplicada,
        };
      })
    );

    const subtotalOriginal = productosConDescuento.reduce((sum, p) => sum + p.subtotalOriginal, 0);
    const subtotalConDescuento = productosConDescuento.reduce((sum, p) => sum + p.subtotalFinal, 0);
    const descuentoTotal = subtotalOriginal - subtotalConDescuento;

    return {
      subtotalOriginal: Number(subtotalOriginal.toFixed(2)),
      subtotalConDescuento: Number(subtotalConDescuento.toFixed(2)),
      descuentoTotal: Number(descuentoTotal.toFixed(2)),
      productosConDescuento,
    };
  }
}
