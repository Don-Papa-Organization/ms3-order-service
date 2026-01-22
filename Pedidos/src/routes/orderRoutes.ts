import { Router } from "express";
import { OrderController } from "../controllers/OrderController";
import { authenticateToken, requireRoles, requireUsuarioActivo } from "../middlewares/authMiddleware";
import { TipoUsuario } from "../types/express";

const router = Router();
const orderController = new OrderController();

/** CU022 - Añadir productos al carrito */
router.post(
  "/cart/product",
  authenticateToken,
  requireUsuarioActivo,
  requireRoles(TipoUsuario.cliente),
  orderController.addProductToCart
);

/** Obtener carrito actual del cliente */
router.get(
  "/cart",
  authenticateToken,
  requireUsuarioActivo,
  requireRoles(TipoUsuario.cliente),
  orderController.getCart
);

/** Actualizar cantidad de un producto en el carrito */
router.patch(
  "/cart/product/:idProductoPedido",
  authenticateToken,
  requireUsuarioActivo,
  requireRoles(TipoUsuario.cliente),
  orderController.updateProductQuantity
);

/** Eliminar un producto específico del carrito */
router.delete(
  "/cart/product/:idProductoPedido",
  authenticateToken,
  requireUsuarioActivo,
  requireRoles(TipoUsuario.cliente),
  orderController.removeProductFromCart
);

/** Vaciar el carrito completo */
router.delete(
  "/cart",
  authenticateToken,
  requireUsuarioActivo,
  requireRoles(TipoUsuario.cliente),
  orderController.clearCart
);

/** CU035 - Confirmar pedido (cambiar de carrito a pedido confirmado) */
router.post(
  "/confirm",
  authenticateToken,
  requireUsuarioActivo,
  requireRoles(TipoUsuario.cliente),
  orderController.confirmOrder
);

/** CU033 - Consultar historial de pedidos del cliente */
router.get(
  "/history",
  authenticateToken,
  requireUsuarioActivo,
  requireRoles(TipoUsuario.cliente),
  orderController.listOrderHistory
);

/** CU034 - Listar pedidos en curso del cliente */
router.get(
  "/in-progress",
  authenticateToken,
  requireUsuarioActivo,
  requireRoles(TipoUsuario.cliente),
  orderController.listOrdersInProgress
);

/** CU038 - Listar todos los pedidos del sistema */
router.get(
  "/all",
  authenticateToken,
  requireUsuarioActivo,
  requireRoles(TipoUsuario.empleado, TipoUsuario.administrador),
  orderController.listAllOrders
);

/** CU48 - Crear pedido presencial (en mesa o para llevar) */
router.post(
  "/create-customer-order",
  authenticateToken,
  requireUsuarioActivo,
  requireRoles(TipoUsuario.empleado, TipoUsuario.administrador),
  orderController.createCustomerOrder
);

/** CU37 - Agregar productos a un pedido existente */
router.post(
  "/:idPedido/product",
  authenticateToken,
  requireUsuarioActivo,
  requireRoles(TipoUsuario.empleado, TipoUsuario.administrador),
  orderController.addProductToOrder
);

/** Eliminar un producto específico de una orden (empleado/admin) */
router.delete(
  "/:idPedido/product/:idProductoPedido",
  authenticateToken,
  requireUsuarioActivo,
  requireRoles(TipoUsuario.empleado, TipoUsuario.administrador),
  orderController.removeProductFromOrder
);

/** CU033 - Consultar detalle completo de un pedido del cliente */
router.get(
  "/:idPedido/detail",
  authenticateToken,
  requireUsuarioActivo,
  requireRoles(TipoUsuario.cliente),
  orderController.getCustomerOrderDetail
);

/** CU38 - Cambiar estado de un pedido */
router.patch(
  "/:idPedido/status",
  authenticateToken,
  requireUsuarioActivo,
  requireRoles(TipoUsuario.empleado, TipoUsuario.administrador),
  orderController.updateOrderStatus
);

/** Cancelar un pedido (cliente) */
router.patch(
  "/:idPedido/cancel",
  authenticateToken,
  requireUsuarioActivo,
  requireRoles(TipoUsuario.cliente),
  orderController.cancelOrder
);

/** CU034 - Consultar estado de un pedido específico */
router.get(
  "/status/:idPedido",
  authenticateToken,
  requireUsuarioActivo,
  requireRoles(TipoUsuario.cliente),
  orderController.checkOrderStatus
);

/** Obtener detalles de un pedido por ID */
router.get(
  "/:idPedido",
  authenticateToken,
  requireUsuarioActivo,
  requireRoles(TipoUsuario.empleado, TipoUsuario.administrador),
  orderController.getOrderById
);

/** Eliminar una orden completa (empleado/admin) */
router.delete(
  "/:idPedido",
  authenticateToken,
  requireUsuarioActivo,
  requireRoles(TipoUsuario.empleado, TipoUsuario.administrador),
  orderController.deleteOrder
);

export default router;
