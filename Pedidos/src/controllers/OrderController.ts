import { Request, Response } from "express";
import { DIContainer } from "../di/container";
import { OrderValidator } from "../validators/orderValidator";
import { OrderMapper } from "../domain/mappers/orderMapper";
import { extractToken } from "../utils/tokenExtractor";
import { PaginationMetaDto } from "../domain/dtos/response/PaginatedResponseDto";

/**
 * OrderController - Handles HTTP requests for orders
 * Uses DI Container, Validators, and Mappers for clean separation
 */
export class OrderController {
  private cartService = DIContainer.getCartService();
  private orderService = DIContainer.getOrderService();
  private orderQueryService = DIContainer.getOrderQueryService();

  /**
   * CU022 - Add product to cart
   * POST /api/orders/cart/product
   */
  addProductToCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const { idProducto, cantidad } = req.body;
      const idUsuario = OrderValidator.validateAuthenticatedUser(req, res);
      if (!idUsuario) return;

      if (!OrderValidator.validateRequiredFields({ idProducto, cantidad }, ['idProducto', 'cantidad'], res)) {
        return;
      }

      if (!OrderValidator.validateIntegerFields({ idProducto, cantidad }, ['idProducto', 'cantidad'], res)) {
        return;
      }

      const accessToken = extractToken(req);
      const resultado = await this.cartService.addProductToCart(
        idUsuario,
        idProducto,
        cantidad,
        accessToken
      );

      res.status(resultado.status).json(resultado.data || { success: false, message: resultado.message });
    } catch (error: any) {
      console.error("Error al añadir producto al carrito:", error);
      res.status(500).json({ 
        success: false,
        message: "Error al añadir producto al carrito",
        error: error.message 
      });
    }
  };

  /**
   * Get current cart
   * GET /api/orders/cart
   */
  getCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const idUsuario = OrderValidator.validateAuthenticatedUser(req, res);
      if (!idUsuario) return;

      const carrito = await this.cartService.getCurrentCart(idUsuario);

      if (!carrito) {
        res.status(200).json({
          success: true,
          message: "El carrito está vacío",
          data: null
        });
        return;
      }

      const productos = await this.cartService.getCartProducts(idUsuario);

      res.status(200).json({
        success: true,
        data: {
          pedido: OrderMapper.toDto(carrito),
          productos: productos.map(p => OrderMapper.toProductDto(p))
        }
      });

    } catch (error: any) {
      console.error("Error al obtener carrito:", error);
      res.status(500).json({ 
        success: false,
        message: "Error al obtener el carrito",
        error: error.message 
      });
    }
  };

  /**
   * CU035 - Confirm order
   * POST /api/orders/confirm
   */
  confirmOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { direccionEntrega } = req.body;
      const idUsuario = OrderValidator.validateAuthenticatedUser(req, res);
      if (!idUsuario) return;

      const accessToken = extractToken(req);
      const resultado = await this.orderService.confirmOrder(
        idUsuario,
        { direccionEntrega },
        accessToken
      );

      res.status(resultado.status).json(resultado.data || { success: false, message: resultado.message });
    } catch (error: any) {
      console.error("Error al confirmar pedido:", error);
      res.status(500).json({ 
        success: false,
        message: "Error al confirmar el pedido. Intente más tarde",
        error: error.message 
      });
    }
  };

  /**
   * CU37 - Add product to existing order
   * POST /api/orders/:idPedido/product
   */
  addProductToOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { idProducto, cantidad } = req.body;
      const idPedido = OrderValidator.validateIntegerId(req.params.idPedido, "ID de pedido", res);
      if (!idPedido) return;

      if (!OrderValidator.validateRequiredFields({ idProducto, cantidad }, ['idProducto', 'cantidad'], res)) {
        return;
      }

      if (!OrderValidator.validateIntegerFields({ idProducto, cantidad }, ['idProducto', 'cantidad'], res)) {
        return;
      }

      const accessToken = extractToken(req);
      const resultado = await this.orderService.addProductToOrder(
        idPedido,
        idProducto,
        cantidad,
        accessToken
      );

      const productos = await this.orderQueryService.getOrderProducts(idPedido);

      res.status(200).json({
        success: true,
        message: resultado.mensaje,
        data: {
          pedido: {
            ...OrderMapper.toDto(resultado.pedido),
            cantidadProductos: productos.length
          },
          productoPedido: OrderMapper.toProductDto(resultado.productoPedido)
        }
      });

    } catch (error: any) {
      console.error("Error al agregar producto al pedido:", error);

      if (error.message === "El pedido no existe") {
        res.status(404).json({ success: false, message: error.message });
        return;
      }

      if (error.message.includes("cancelado") || error.message.includes("sin stock") || error.message.includes("no está disponible")) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }

      res.status(500).json({ 
        success: false,
        message: "Error al agregar producto al pedido",
        error: error.message 
      });
    }
  };

  /**
   * Get order by ID
   * GET /api/orders/:idPedido
   */
  getOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
      const idPedido = OrderValidator.validateIntegerId(req.params.idPedido, "ID de pedido", res);
      if (!idPedido) return;

      const pedido = await this.orderQueryService.getOrderById(idPedido);

      if (!pedido) {
        res.status(404).json({
          success: false,
          message: "El pedido no existe"
        });
        return;
      }

      const productos = await this.orderQueryService.getOrderProducts(idPedido);

      res.status(200).json({
        success: true,
        data: {
          pedido: OrderMapper.toDto(pedido),
          productos: productos.map(p => OrderMapper.toProductDto(p))
        }
      });

    } catch (error: any) {
      console.error("Error al obtener pedido:", error);
      res.status(500).json({ 
        success: false,
        message: "Error al obtener el pedido",
        error: error.message 
      });
    }
  };

  /**
   * CU033 - List order history with pagination
   * GET /api/orders/history?page=1&limit=20
   */
  listOrderHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const idUsuario = OrderValidator.validateAuthenticatedUser(req, res);
      if (!idUsuario) return;

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filtros: any = {};

      if (req.query.fechaInicio && req.query.fechaFin) {
        filtros.fechaInicio = new Date(req.query.fechaInicio as string);
        filtros.fechaFin = new Date(req.query.fechaFin as string);

        if (!OrderValidator.validateDateRange(filtros.fechaInicio, filtros.fechaFin, res)) {
          return;
        }
      }

      if (req.query.estado) {
        const estadosValidos = ['pendiente', 'entregado', 'cancelado'];
        const estado = req.query.estado as string;
        
        if (!estadosValidos.includes(estado)) {
          res.status(400).json({
            success: false,
            message: `Estado inválido. Estados válidos: ${estadosValidos.join(', ')}`
          });
          return;
        }
        
        filtros.estado = estado;
      }

      const { orders, total } = await this.orderQueryService.getOrderHistory(idUsuario, page, limit, filtros);

      if (orders.length === 0) {
        res.status(200).json({
          success: true,
          message: "No se encontraron pedidos anteriores",
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        });
        return;
      }

      const pedidosFormateados = await Promise.all(orders.map(async (pedido) => {
        const productos = await this.orderQueryService.getOrderProducts(pedido.idPedido);
        return {
          ...OrderMapper.toDto(pedido),
          cantidadProductos: productos.length
        };
      }));

      const pagination: PaginationMetaDto = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      };

      res.status(200).json({
        success: true,
        message: "Historial de pedidos obtenido exitosamente",
        data: pedidosFormateados,
        pagination
      });

    } catch (error: any) {
      console.error("Error al obtener historial de pedidos:", error);
      res.status(500).json({
        success: false,
        message: "Error al cargar los pedidos. Intente nuevamente",
        error: error.message
      });
    }
  };

  /**
   * CU033 - Get customer order detail
   * GET /api/orders/:idPedido/detail
   */
  getCustomerOrderDetail = async (req: Request, res: Response): Promise<void> => {
    try {
      const idUsuario = OrderValidator.validateAuthenticatedUser(req, res);
      if (!idUsuario) return;

      const idPedido = OrderValidator.validateIntegerId(req.params.idPedido, "ID de pedido", res);
      if (!idPedido) return;

      const pedido = await this.orderQueryService.getCustomerOrderDetail(idPedido, idUsuario);

      if (!pedido) {
        res.status(404).json({
          success: false,
          message: "Pedido no encontrado o no tiene acceso a este pedido"
        });
        return;
      }

      const productos = await this.orderQueryService.getOrderProducts(pedido.idPedido);

      res.status(200).json({
        success: true,
        message: "Detalle del pedido obtenido exitosamente",
        data: {
          ...OrderMapper.toDto(pedido),
          productos: productos.map(p => OrderMapper.toProductDto(p))
        }
      });

    } catch (error: any) {
      console.error("Error al obtener detalle del pedido:", error);
      res.status(500).json({
        success: false,
        message: "Error al cargar los pedidos. Intente nuevamente",
        error: error.message
      });
    }
  };

  /**
   * CU034 - List orders in progress with pagination
   * GET /api/orders/in-progress?page=1&limit=20
   */
  listOrdersInProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const idUsuario = OrderValidator.validateAuthenticatedUser(req, res);
      if (!idUsuario) return;

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const { orders, total } = await this.orderQueryService.getOrdersInProgress(idUsuario, page, limit);

      if (orders.length === 0) {
        res.status(200).json({
          success: true,
          message: "No tiene pedidos ni reservas en curso",
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        });
        return;
      }

      const pagination: PaginationMetaDto = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      };

      res.status(200).json({
        success: true,
        message: "Pedidos en curso obtenidos exitosamente",
        data: OrderMapper.toDtoList(orders),
        pagination
      });

    } catch (error: any) {
      console.error("Error al obtener pedidos en curso:", error);
      res.status(500).json({
        success: false,
        message: "Error al consultar el estado. Intente más tarde",
        error: error.message
      });
    }
  };

  /**
   * CU034 - Check order status
   * GET /api/orders/status/:idPedido
   */
  checkOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const idUsuario = OrderValidator.validateAuthenticatedUser(req, res);
      if (!idUsuario) return;

      const idPedido = OrderValidator.validateIntegerId(req.params.idPedido, "ID de pedido", res);
      if (!idPedido) return;

      const pedido = await this.orderQueryService.checkOrderStatus(idPedido, idUsuario);

      if (!pedido) {
        res.status(404).json({
          success: false,
          message: "Número no válido. Verifique e intente nuevamente"
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Estado del pedido obtenido exitosamente",
        data: OrderMapper.toDto(pedido)
      });

    } catch (error: any) {
      console.error("Error al consultar estado del pedido:", error);
      res.status(500).json({
        success: false,
        message: "Error al consultar el estado. Intente más tarde",
        error: error.message
      });
    }
  };

  /**
   * CU38 - Update order status
   * PATCH /api/orders/:idPedido/status
   */
  updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { nuevoEstado } = req.body;
      const idPedido = OrderValidator.validateIntegerId(req.params.idPedido, "ID de pedido", res);
      if (!idPedido) return;

      if (!OrderValidator.validateRequiredFields({ nuevoEstado }, ['nuevoEstado'], res)) {
        return;
      }

      const pedidoActualizado = await this.orderService.updateOrderStatus(idPedido, nuevoEstado);

      res.status(200).json({
        success: true,
        message: "Estado del pedido actualizado exitosamente",
        data: {
          ...OrderMapper.toDto(pedidoActualizado),
          estadoActual: pedidoActualizado.estado
        }
      });

    } catch (error: any) {
      console.error("Error al marcar estado del pedido:", error);

      if (error.message.includes("Estado no válido") || error.message.includes("Transición de estado no permitida")) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }

      if (error.message.includes("ya está en estado") || error.message.includes("ya está cancelado")) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }

      if (error.message.includes("debe tener un pago registrado")) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }

      if (error.message.includes("no existe o fue eliminado")) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Error al actualizar el estado del pedido. Intente nuevamente",
        error: error.message
      });
    }
  };

  /**
   * CU038 - List all orders with pagination
   * GET /api/orders/all?page=1&limit=20
   */
  listAllOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const { orders, total } = await this.orderQueryService.listAllOrders(page, limit);

      const pagination: PaginationMetaDto = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      };

      res.status(200).json({
        success: true,
        message: "Lista de pedidos obtenida exitosamente",
        data: OrderMapper.toDtoList(orders),
        pagination
      });

    } catch (error: any) {
      console.error("Error al listar pedidos:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener la lista de pedidos",
        error: error.message
      });
    }
  };

  /**
   * CU48 - Create customer order (presencial)
   * POST /api/orders/create-customer-order
   */
  createCustomerOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { productos, idMesa } = req.body;
      const idUsuarioEmpleado = OrderValidator.validateAuthenticatedUser(req, res);
      if (!idUsuarioEmpleado) return;

      if (!productos || !Array.isArray(productos) || productos.length === 0) {
        res.status(400).json({
          success: false,
          message: "Debe proporcionar al menos un producto"
        });
        return;
      }

      for (const producto of productos) {
        if (!OrderValidator.validateRequiredFields(producto, ['idProducto', 'cantidad'], res)) {
          return;
        }

        if (!OrderValidator.validateIntegerFields(producto, ['idProducto', 'cantidad'], res)) {
          return;
        }

        if (!OrderValidator.validatePositiveNumber(producto.cantidad, "Cantidad", res)) {
          return;
        }
      }

      if (idMesa !== undefined && !Number.isInteger(idMesa)) {
        res.status(400).json({
          success: false,
          message: "El campo 'idMesa' debe ser un número entero"
        });
        return;
      }

      const accessToken = extractToken(req);
      const resultado = await this.orderService.createCustomerOrder(
        idUsuarioEmpleado,
        productos,
        idMesa,
        accessToken
      );

      res.status(201).json({
        success: true,
        message: resultado.mensaje,
        data: {
          pedido: {
            ...OrderMapper.toDto(resultado.pedido),
            tipoPedido: resultado.pedido.idMesa ? 'Mesa' : 'Para llevar'
          },
          productos: resultado.productos.map(p => OrderMapper.toProductDto(p)),
          rutaPDF: resultado.rutaPDF
        }
      });

    } catch (error: any) {
      console.error("Error al realizar pedido del cliente:", error);

      if (error.message.includes("no está disponible") || error.message.includes("Stock insuficiente") || error.message.includes("mesa") || error.message.includes("Mesa")) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }

      if (error.message.includes("error al generar recibo PDF") || error.message.includes("error al actualizar estado de la mesa")) {
        res.status(201).json({
          success: true,
          message: "Pedido creado exitosamente",
          warning: error.message
        });
        return;
      }

      if (error.message.includes("Error de conexión")) {
        res.status(503).json({ success: false, message: error.message });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Error al registrar el pedido. Intente nuevamente",
        error: error.message
      });
    }
  };

  /**
   * Update product quantity in cart
   * PATCH /api/orders/cart/product/:idProductoPedido
   */
  updateProductQuantity = async (req: Request, res: Response): Promise<void> => {
    try {
      const { cantidad } = req.body;
      const idProductoPedido = OrderValidator.validateIntegerId(req.params.idProductoPedido, "ID de producto", res);
      if (!idProductoPedido) return;

      if (!OrderValidator.validateRequiredFields({ cantidad }, ['cantidad'], res)) {
        return;
      }

      if (!OrderValidator.validateIntegerFields({ cantidad }, ['cantidad'], res)) {
        return;
      }

      const idUsuario = req.user!.id;

      const resultado = await this.cartService.updateProductQuantity(idProductoPedido, cantidad, idUsuario);

      res.status(resultado.status).json(resultado);
    } catch (error: any) {
      console.error("Error al actualizar cantidad del producto:", error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar cantidad del producto',
        error: error.message
      });
    }
  };

  /**
   * Remove product from cart
   * DELETE /api/orders/cart/product/:idProductoPedido
   */
  removeProductFromCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const idProductoPedido = OrderValidator.validateIntegerId(req.params.idProductoPedido, "ID de producto", res);
      if (!idProductoPedido) return;

      const idUsuario = req.user!.id;

      const resultado = await this.cartService.removeProductFromCart(idProductoPedido, idUsuario);

      res.status(resultado.status).json(resultado);
    } catch (error: any) {
      res.status(500).json({
        message: 'Error al eliminar producto del carrito',
        error: error.message
      });
    }
  };

  /**
   * Clear cart
   * DELETE /api/orders/cart
   */
  clearCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const idUsuario = req.user!.id;

      const resultado = await this.cartService.clearCart(idUsuario);

      res.status(resultado.status).json(resultado);
    } catch (error: any) {
      res.status(500).json({
        message: 'Error al vaciar carrito',
        error: error.message
      });
    }
  };

  /**
   * Cancel order
   * PATCH /api/orders/:idPedido/cancel
   */
  cancelOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const idPedido = OrderValidator.validateIntegerId(req.params.idPedido, "ID de pedido", res);
      if (!idPedido) return;

      const idUsuario = req.user!.id;

      const resultado = await this.orderService.cancelOrder(idPedido, idUsuario);

      res.status(resultado.status).json(resultado);
    } catch (error: any) {
      res.status(500).json({
        message: 'Error al cancelar pedido',
        error: error.message
      });
    }
  };

  /**
   * Remove product from order (employee/admin)
   * DELETE /api/orders/:idPedido/product/:idProductoPedido
   */
  removeProductFromOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const idProductoPedido = OrderValidator.validateIntegerId(req.params.idProductoPedido, "ID de producto", res);
      if (!idProductoPedido) return;

      const resultado = await this.orderService.removeProductFromOrder(idProductoPedido);

      res.status(resultado.status).json(resultado);
    } catch (error: any) {
      res.status(500).json({
        message: 'Error al eliminar producto del pedido',
        error: error.message
      });
    }
  };

  /**
   * Delete order (employee/admin)
   * DELETE /api/orders/:idPedido
   */
  deleteOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const idPedido = OrderValidator.validateIntegerId(req.params.idPedido, "ID de pedido", res);
      if (!idPedido) return;

      const resultado = await this.orderService.deleteOrder(idPedido);

      res.status(resultado.status).json(resultado);
    } catch (error: any) {
      res.status(500).json({
        message: 'Error al eliminar pedido',
        error: error.message
      });
    }
  };
}
