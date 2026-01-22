import { PedidoRepository } from "../../domain/repositories/pedidoRepository";
import { ProductoPedidoRepository } from "../../domain/repositories/productoPedidoRepository";
import { PagoRepository } from "../../domain/repositories/pagoRepository";
import { MetodoPagoRepository } from "../../domain/repositories/metodoPagoRepository";
import { Pedido } from "../../domain/models/pedido";
import { Pago } from "../../domain/models/pago";
import { MetodoPago } from "../../domain/models/metodoPago";
import { generarReciboPDF } from "../../utils/pdfGenerator";
import { TableService } from "../apis/tableService";
import { InventoryService } from "../apis/inventoryService";
import { ClientService } from "../apis/clientService";
import { PriceCalculatorService } from "../priceCalculatorService";
import { Op } from "sequelize";
import { ServiceResult } from "../../types/pedido.types";
import { sequelizeInstance } from "../../config/db";
import { Transaction } from "sequelize";

/**
 * PaymentService - Handles payment operations
 * Responsibility: Process payments with transactions and validations
 */
export class PaymentService {
  constructor(
    private pedidoRepository: PedidoRepository,
    private productoPedidoRepository: ProductoPedidoRepository,
    private pagoRepository: PagoRepository,
    private metodoPagoRepository: MetodoPagoRepository,
    private tableService: TableService,
    private inventoryService: InventoryService,
    private clientService: ClientService,
    private priceCalculatorService: PriceCalculatorService
  ) {}

  /**
   * Register payment for order (CU39/CU40) - WITH TRANSACTION
   * Critical operation: reduces inventory, registers payment, updates order
   */
  async registerPayment(
    idPedido: number,
    idUsuario: number,
    idMetodoPago: number,
    direccionEntrega?: string,
    accessToken?: string
  ): Promise<ServiceResult> {
    const transaction: Transaction = await sequelizeInstance.transaction();

    try {
      const pedido = await this.pedidoRepository.findById(idPedido);

      if (!pedido) {
        await transaction.rollback();
        return { 
          status: 404, 
          message: "El pedido no existe" 
        };
      }

      if (pedido.idUsuario !== idUsuario) {
        await transaction.rollback();
        return {
          status: 403,
          message: "No tiene permiso para pagar este pedido"
        };
      }

      if (pedido.estado !== 'sin_confirmar') {
        await transaction.rollback();
        return { 
          status: 400, 
          message: `El pedido no puede ser pagado. Estado actual: ${pedido.estado}` 
        };
      }

      const metodoPago = await this.metodoPagoRepository.findById(idMetodoPago);
      if (!metodoPago) {
        await transaction.rollback();
        return { 
          status: 400, 
          message: "Método de pago no válido" 
        };
      }

      const productos = await this.productoPedidoRepository.findByPedido(idPedido);

      if (productos.length === 0) {
        await transaction.rollback();
        return { 
          status: 400, 
          message: "El pedido no tiene productos" 
        };
      }

      // Calculate total with promotions
      let totalConPromociones = 0;
      for (const productoPedido of productos) {
        try {
          const calculoPromocion = await this.priceCalculatorService.calcularPrecioConPromocion(
            productoPedido.idProducto,
            productoPedido.cantidad,
            accessToken
          );

          const subtotalConPromocion = calculoPromocion.precioFinal * productoPedido.cantidad;
          totalConPromociones += subtotalConPromocion;

          await this.productoPedidoRepository.update(productoPedido.idProductoPedido, {
            precioUnitario: calculoPromocion.precioFinal,
            subtotal: subtotalConPromocion
          });
        } catch (error) {
          console.error(`Error al calcular promoción para producto ${productoPedido.idProducto}:`, error);
          totalConPromociones += Number(productoPedido.subtotal);
        }
      }
      totalConPromociones = Number(totalConPromociones.toFixed(2));

      let direccionFinal = direccionEntrega || pedido.direccionEntrega || '';

      // Validate stock BEFORE processing payment
      for (const productoPedido of productos) {
        const productoActual = await this.inventoryService.getProductoById(
          productoPedido.idProducto,
          accessToken
        );

        if (!productoActual || !productoActual.activo) {
          await transaction.rollback();
          return {
            status: 400,
            message: `El producto con ID ${productoPedido.idProducto} ya no está disponible`
          };
        }

        if (productoActual.stockActual < productoPedido.cantidad) {
          await transaction.rollback();
          return {
            status: 400,
            message: `Stock insuficiente para el producto con ID ${productoPedido.idProducto}. Disponible: ${productoActual.stockActual}, Requerido: ${productoPedido.cantidad}`
          };
        }
      }

      // CRITICAL: Reduce stock atomically
      try {
        for (const productoPedido of productos) {
          await this.inventoryService.reducirStock(
            productoPedido.idProducto,
            productoPedido.cantidad,
            accessToken
          );
        }
      } catch (stockError: any) {
        await transaction.rollback();
        return {
          status: 500,
          message: `Error al reducir inventario: ${stockError.message}`
        };
      }

      // Register payment
      const pago = await this.pagoRepository.create({
        idPedido,
        idMetodoPago,
        monto: totalConPromociones,
        fechaPago: new Date(),
        urlComprobante: ''
      });

      // Update order to 'pendiente'
      await this.pedidoRepository.update(idPedido, {
        total: totalConPromociones,
        estado: 'pendiente',
        direccionEntrega: direccionFinal
      });

      const pedidoActualizado = await this.pedidoRepository.findById(idPedido) as Pedido;

      // Generate PDF receipt
      let rutaPDF: string;
      let nombreMesa: string | undefined;

      if (pedidoActualizado.idMesa) {
        try {
          const mesas = await this.tableService.getAllMesas();
          const mesa = mesas.find((m: any) => m.idMesa === pedidoActualizado.idMesa);
          if (mesa) {
            nombreMesa = `Mesa ${mesa.numeroMesa}`;
          }
        } catch (error) {
          console.error("Error al obtener información de mesa:", error);
        }
      }

      try {
        rutaPDF = await generarReciboPDF({
          pedido: pedidoActualizado,
          productos: productos,
          nombreMesa: nombreMesa
        });

        await this.pagoRepository.update(pago.idPago, {
          urlComprobante: rutaPDF
        });
      } catch (error: any) {
        console.error("Error al generar PDF:", error);
        await transaction.rollback();
        return { 
          status: 500, 
          message: "Pago registrado pero error al generar recibo PDF" 
        };
      }

      await transaction.commit();

      const pagoFinal = await this.pagoRepository.findById(pago.idPago) as Pago;

      return {
        status: 201,
        data: {
          success: true,
          message: "Pago registrado exitosamente",
          data: {
            pedido: {
              idPedido: pedidoActualizado.idPedido,
              total: pedidoActualizado.total,
              estado: pedidoActualizado.estado,
              canalVenta: pedidoActualizado.canalVenta,
              fechaPedido: pedidoActualizado.fechaPedido,
              idMesa: pedidoActualizado.idMesa
            },
            pago: {
              idPago: pagoFinal.idPago,
              urlComprobante: pagoFinal.urlComprobante,
              monto: pagoFinal.monto,
              fechaPago: pagoFinal.fechaPago,
              idPedido: pagoFinal.idPedido,
              idMetodoPago: pagoFinal.idMetodoPago
            },
            rutaPDF
          }
        }
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * List pending payment orders (CU39)
   */
  async listPendingPaymentOrders(
    page: number = 1,
    limit: number = 20
  ): Promise<{ pedidos: Pedido[]; total: number }> {
    const offset = (page - 1) * limit;

    const { rows: pedidos, count: total } = await this.pedidoRepository.findAndCountAll({
      where: {
        estado: 'sin_confirmar'
      },
      order: [['fechaPedido', 'DESC']],
      limit,
      offset
    });

    return { pedidos, total };
  }

  /**
   * List payment methods (CU40)
   */
  async listPaymentMethods(): Promise<MetodoPago[]> {
    return await this.metodoPagoRepository.findAll();
  }

  /**
   * Get all payments (admin only)
   */
  async getAllPayments(
    page: number = 1,
    limit: number = 20
  ): Promise<{ pagos: Pago[]; total: number }> {
    const offset = (page - 1) * limit;

    const { rows: pagos, count: total } = await this.pagoRepository.findAndCountAll({
      include: [
        { model: Pedido, as: 'pedido' },
        { model: MetodoPago, as: 'metodoPago' }
      ],
      order: [['fechaPago', 'DESC']],
      limit,
      offset
    });

    return { pagos, total };
  }

  /**
   * Create payment method
   */
  async createPaymentMethod(nombre: string): Promise<ServiceResult> {
    const metodoExistente = await this.metodoPagoRepository.findByNombre(nombre);
    
    if (metodoExistente) {
      return {
        status: 400,
        message: "Ya existe un método de pago con ese nombre"
      };
    }

    const nuevoMetodo = await this.metodoPagoRepository.create({ nombre });

    return {
      status: 201,
      data: {
        success: true,
        message: "Método de pago creado exitosamente",
        data: {
          idMetodo: nuevoMetodo.idMetodo,
          nombre: nuevoMetodo.nombre
        }
      }
    };
  }

  /**
   * Get payment method by ID
   */
  async getPaymentMethodById(idMetodo: number): Promise<MetodoPago | null> {
    return await this.metodoPagoRepository.findById(idMetodo);
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(idMetodo: number, nombre: string): Promise<ServiceResult> {
    const metodo = await this.metodoPagoRepository.findById(idMetodo);

    if (!metodo) {
      return {
        status: 404,
        message: "Método de pago no encontrado"
      };
    }

    const metodoConMismoNombre = await this.metodoPagoRepository.findByNombre(nombre);
    
    if (metodoConMismoNombre && metodoConMismoNombre.idMetodo !== idMetodo) {
      return {
        status: 400,
        message: "Ya existe otro método de pago con ese nombre"
      };
    }

    await this.metodoPagoRepository.update(idMetodo, { nombre });
    const metodoActualizado = await this.metodoPagoRepository.findById(idMetodo);

    return {
      status: 200,
      data: {
        success: true,
        message: "Método de pago actualizado exitosamente",
        data: {
          idMetodo: metodoActualizado!.idMetodo,
          nombre: metodoActualizado!.nombre
        }
      }
    };
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(idMetodo: number): Promise<ServiceResult> {
    const metodo = await this.metodoPagoRepository.findById(idMetodo);

    if (!metodo) {
      return {
        status: 404,
        message: "Método de pago no encontrado"
      };
    }

    const pagosConMetodo = await this.pagoRepository.findAll({
      where: { idMetodoPago: idMetodo }
    });

    if (pagosConMetodo.length > 0) {
      return {
        status: 400,
        message: "No se puede eliminar el método de pago porque tiene pagos asociados"
      };
    }

    await this.metodoPagoRepository.delete(idMetodo);

    return {
      status: 200,
      data: {
        success: true,
        message: "Método de pago eliminado exitosamente"
      }
    };
  }

  /**
   * Get payment history with filters (CU041)
   */
  async getPaymentHistory(
    page: number = 1,
    limit: number = 20,
    filtros: {
      fechaInicio?: Date;
      fechaFin?: Date;
      idMetodoPago?: number;
      estado?: string;
    }
  ): Promise<{ pagos: Pago[]; total: number }> {
    const whereClausePago: any = {};
    const whereClausePedido: any = {};

    if (filtros.fechaInicio && filtros.fechaFin) {
      whereClausePago.fechaPago = {
        [Op.between]: [filtros.fechaInicio, filtros.fechaFin]
      };
    } else if (filtros.fechaInicio) {
      whereClausePago.fechaPago = {
        [Op.gte]: filtros.fechaInicio
      };
    } else if (filtros.fechaFin) {
      whereClausePago.fechaPago = {
        [Op.lte]: filtros.fechaFin
      };
    }

    if (filtros.idMetodoPago) {
      whereClausePago.idMetodoPago = filtros.idMetodoPago;
    }

    if (filtros.estado) {
      whereClausePedido.estado = filtros.estado;
    }

    const offset = (page - 1) * limit;

    const pagos = await this.pagoRepository.findAllWithRelations(whereClausePago, whereClausePedido);
    
    // Manual pagination since findAllWithRelations doesn't support limit/offset directly
    const total = pagos.length;
    const paginatedPagos = pagos.slice(offset, offset + limit);

    return { pagos: paginatedPagos, total };
  }

  /**
   * Get payment detail (CU041)
   */
  async getPaymentDetail(idPago: number): Promise<Pago> {
    const pago = await this.pagoRepository.findByIdWithRelations(idPago);

    if (!pago) {
      throw new Error("Pago no encontrado");
    }

    return pago;
  }
}
