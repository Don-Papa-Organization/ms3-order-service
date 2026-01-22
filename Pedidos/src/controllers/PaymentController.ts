import { Request, Response } from "express";
import { DIContainer } from "../di/container";
import { OrderValidator } from "../validators/orderValidator";
import { PaymentMapper } from "../domain/mappers/paymentMapper";
import { extractToken } from "../utils/tokenExtractor";
import { PaginationMetaDto } from "../domain/dtos/response/PaginatedResponseDto";

/**
 * PaymentController - Handles HTTP requests for payments
 * Uses DI Container, Validators, and Mappers for clean separation
 */
export class PaymentController {
  private paymentService = DIContainer.getPaymentService();

  /**
   * CU39 - List pending payment orders with pagination
   * GET /api/payments/pending-orders?page=1&limit=20
   */
  listPendingPaymentOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const { pedidos, total } = await this.paymentService.listPendingPaymentOrders(page, limit);

      const pagination: PaginationMetaDto = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      };

      res.status(200).json({
        success: true,
        message: "Lista de pedidos por pagar obtenida exitosamente",
        data: pedidos.map(p => ({
          idPedido: p.idPedido,
          idUsuario: p.idUsuario,
          total: p.total,
          estado: p.estado,
          canalVenta: p.canalVenta,
          fechaPedido: p.fechaPedido,
          direccionEntrega: p.direccionEntrega
        })),
        pagination
      });

    } catch (error: any) {
      console.error("Error al listar pedidos por pagar:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener la lista de pedidos por pagar",
        error: error.message
      });
    }
  };

  /**
   * CU39/CU40 - Register payment for order
   * POST /api/payments/register/:idPedido
   */
  registerPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { idMetodoPago, direccionEntrega } = req.body;
      const idPedido = OrderValidator.validateIntegerId(req.params.idPedido, "ID de pedido", res);
      if (!idPedido) return;

      const idUsuario = req.user!.id;

      if (!OrderValidator.validateRequiredFields({ idMetodoPago }, ['idMetodoPago'], res)) {
        return;
      }

      if (!OrderValidator.validateIntegerFields({ idMetodoPago }, ['idMetodoPago'], res)) {
        return;
      }

      const accessToken = extractToken(req);
      const resultado = await this.paymentService.registerPayment(
        idPedido,
        idUsuario,
        idMetodoPago,
        direccionEntrega,
        accessToken
      );

      res.status(resultado.status).json(resultado.data || { success: false, message: resultado.message });
    } catch (error: any) {
      console.error("Error al registrar pago:", error);
      res.status(500).json({
        success: false,
        message: "Error al registrar el pago. Intente nuevamente",
        error: error.message
      });
    }
  };

  /**
   * CU40 - List payment methods
   * GET /api/payments/methods
   */
  listPaymentMethods = async (req: Request, res: Response): Promise<void> => {
    try {
      const metodos = await this.paymentService.listPaymentMethods();

      res.status(200).json({
        success: true,
        message: "Métodos de pago obtenidos exitosamente",
        data: metodos.map(m => ({
          idMetodoPago: m.idMetodo,
          nombre: m.nombre
        }))
      });

    } catch (error: any) {
      console.error("Error al listar métodos de pago:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener métodos de pago",
        error: error.message
      });
    }
  };

  /**
   * Create payment method
   * POST /api/payments/methods
   */
  createPaymentMethod = async (req: Request, res: Response): Promise<void> => {
    try {
      const { nombre } = req.body;

      if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
        res.status(400).json({
          success: false,
          message: "El campo 'nombre' es requerido y debe ser un texto válido"
        });
        return;
      }

      const resultado = await this.paymentService.createPaymentMethod(nombre.trim());
      res.status(resultado.status).json(resultado.data || { success: false, message: resultado.message });
    } catch (error: any) {
      console.error("Error al crear método de pago:", error);
      res.status(500).json({
        success: false,
        message: "Error al crear el método de pago",
        error: error.message
      });
    }
  };

  /**
   * Get payment method by ID
   * GET /api/payments/methods/:idMetodo
   */
  getPaymentMethodById = async (req: Request, res: Response): Promise<void> => {
    try {
      const idMetodo = OrderValidator.validateIntegerId(req.params.idMetodo, "ID de método de pago", res);
      if (!idMetodo) return;

      const metodo = await this.paymentService.getPaymentMethodById(idMetodo);

      if (!metodo) {
        res.status(404).json({
          success: false,
          message: "Método de pago no encontrado"
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          idMetodoPago: metodo.idMetodo,
          nombre: metodo.nombre
        }
      });
    } catch (error: any) {
      console.error("Error al obtener método de pago:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener el método de pago",
        error: error.message
      });
    }
  };

  /**
   * Update payment method
   * PUT /api/payments/methods/:idMetodo
   */
  updatePaymentMethod = async (req: Request, res: Response): Promise<void> => {
    try {
      const { nombre } = req.body;
      const idMetodo = OrderValidator.validateIntegerId(req.params.idMetodo, "ID de método de pago", res);
      if (!idMetodo) return;

      if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
        res.status(400).json({
          success: false,
          message: "El campo 'nombre' es requerido y debe ser un texto válido"
        });
        return;
      }

      const resultado = await this.paymentService.updatePaymentMethod(idMetodo, nombre.trim());
      res.status(resultado.status).json(resultado.data || { success: false, message: resultado.message });
    } catch (error: any) {
      console.error("Error al actualizar método de pago:", error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar el método de pago",
        error: error.message
      });
    }
  };

  /**
   * Delete payment method
   * DELETE /api/payments/methods/:idMetodo
   */
  deletePaymentMethod = async (req: Request, res: Response): Promise<void> => {
    try {
      const idMetodo = OrderValidator.validateIntegerId(req.params.idMetodo, "ID de método de pago", res);
      if (!idMetodo) return;

      const resultado = await this.paymentService.deletePaymentMethod(idMetodo);
      res.status(resultado.status).json(resultado.data || { success: false, message: resultado.message });
    } catch (error: any) {
      console.error("Error al eliminar método de pago:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar el método de pago",
        error: error.message
      });
    }
  };

  /**
   * CU041 - Get payment history with filters and pagination
   * GET /api/payments/history?page=1&limit=20
   */
  getPaymentHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fechaInicio, fechaFin, idMetodoPago, estado } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filtros: any = {};

      if (fechaInicio) {
        filtros.fechaInicio = new Date(fechaInicio as string);
      }

      if (fechaFin) {
        filtros.fechaFin = new Date(fechaFin as string);
      }

      if (idMetodoPago) {
        filtros.idMetodoPago = parseInt(idMetodoPago as string);
      }

      if (estado) {
        filtros.estado = estado as string;
      }

      const { pagos, total } = await this.paymentService.getPaymentHistory(page, limit, filtros);

      const pagination: PaginationMetaDto = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      };

      res.status(200).json({
        success: true,
        message: "Historial de pagos obtenido exitosamente",
        data: PaymentMapper.toWithDetailsDtoList(pagos),
        pagination
      });

    } catch (error: any) {
      console.error("Error al obtener historial de pagos:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener el historial de pagos",
        error: error.message
      });
    }
  };

  /**
   * Get all payments (admin only) with pagination
   * GET /api/payments/all?page=1&limit=20
   */
  getAllPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const { pagos, total } = await this.paymentService.getAllPayments(page, limit);

      const pagination: PaginationMetaDto = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      };

      res.status(200).json({
        success: true,
        message: "Lista completa de pagos obtenida exitosamente",
        data: PaymentMapper.toWithDetailsDtoList(pagos),
        pagination
      });

    } catch (error: any) {
      console.error("Error al obtener todos los pagos:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener la lista completa de pagos",
        error: error.message
      });
    }
  };

  /**
   * CU041 - Get payment detail
   * GET /api/payments/:idPago
   */
  getPaymentDetail = async (req: Request, res: Response): Promise<void> => {
    try {
      const idPago = OrderValidator.validateIntegerId(req.params.idPago, "ID de pago", res);
      if (!idPago) return;

      const detalle = await this.paymentService.getPaymentDetail(idPago);

      res.status(200).json({
        success: true,
        message: "Detalle de pago obtenido exitosamente",
        data: PaymentMapper.toWithDetailsDto(detalle)
      });

    } catch (error: any) {
      console.error("Error al obtener detalle de pago:", error);
      
      if (error.message === "Pago no encontrado") {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Error al obtener el detalle del pago",
        error: error.message
      });
    }
  };

  /**
   * CU041 - Download payment receipt (PDF)
   * GET /api/payments/:idPago/receipt
   */
  downloadReceipt = async (req: Request, res: Response): Promise<void> => {
    try {
      const idPago = OrderValidator.validateIntegerId(req.params.idPago, "ID de pago", res);
      if (!idPago) return;

      const detalle = await this.paymentService.getPaymentDetail(idPago);

      if (!detalle.urlComprobante) {
        res.status(404).json({
          success: false,
          message: "El pago no tiene comprobante generado"
        });
        return;
      }

      const path = require('path');
      const fs = require('fs');
      
      const rutaArchivo = path.resolve(detalle.urlComprobante);

      if (!fs.existsSync(rutaArchivo)) {
        res.status(404).json({
          success: false,
          message: "Archivo de comprobante no encontrado"
        });
        return;
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=recibo_${idPago}.pdf`);
      
      const fileStream = fs.createReadStream(rutaArchivo);
      fileStream.pipe(res);

    } catch (error: any) {
      console.error("Error al descargar comprobante:", error);
      res.status(500).json({
        success: false,
        message: "Error al descargar el comprobante",
        error: error.message
      });
    }
  };
}
