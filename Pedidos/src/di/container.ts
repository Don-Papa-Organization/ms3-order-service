import { PedidoRepository } from "../domain/repositories/pedidoRepository";
import { ProductoPedidoRepository } from "../domain/repositories/productoPedidoRepository";
import { PagoRepository } from "../domain/repositories/pagoRepository";
import { MetodoPagoRepository } from "../domain/repositories/metodoPagoRepository";
import { InventoryService } from "../services/apis/inventoryService";
import { ClientService } from "../services/apis/clientService";
import { TableService } from "../services/apis/tableService";
import { PromotionService } from "../services/apis/promotionService";
import { PriceCalculatorService } from "../services/priceCalculatorService";
import { CartService } from "../services/cart/CartService";
import { OrderService } from "../services/order/OrderService";
import { OrderQueryService } from "../services/order/OrderQueryService";
import { PaymentService } from "../services/payment/PaymentService";

/**
 * Dependency Injection Container
 * Simple manual DI implementation
 */
export class DIContainer {
  // Repositories (Singleton)
  private static pedidoRepository = new PedidoRepository();
  private static productoPedidoRepository = new ProductoPedidoRepository();
  private static pagoRepository = new PagoRepository();
  private static metodoPagoRepository = new MetodoPagoRepository();

  // External API Services (Singleton)
  private static inventoryService = new InventoryService();
  private static clientService = new ClientService();
  private static tableService = new TableService();
  private static promotionService = new PromotionService();

  // Business Logic Services (Singleton)
  private static priceCalculatorService = new PriceCalculatorService();
  
  // Main Services (Singleton) - Lazy initialization
  private static cartServiceInstance: CartService;
  private static orderServiceInstance: OrderService;
  private static orderQueryServiceInstance: OrderQueryService;
  private static paymentServiceInstance: PaymentService;

  /**
   * Get CartService instance (Singleton)
   */
  static getCartService(): CartService {
    if (!this.cartServiceInstance) {
      this.cartServiceInstance = new CartService(
        this.pedidoRepository,
        this.productoPedidoRepository,
        this.inventoryService
      );
    }
    return this.cartServiceInstance;
  }

  /**
   * Get OrderService instance (Singleton)
   */
  static getOrderService(): OrderService {
    if (!this.orderServiceInstance) {
      this.orderServiceInstance = new OrderService(
        this.pedidoRepository,
        this.productoPedidoRepository,
        this.pagoRepository,
        this.inventoryService,
        this.clientService,
        this.tableService,
        this.priceCalculatorService
      );
    }
    return this.orderServiceInstance;
  }

  /**
   * Get OrderQueryService instance (Singleton)
   */
  static getOrderQueryService(): OrderQueryService {
    if (!this.orderQueryServiceInstance) {
      this.orderQueryServiceInstance = new OrderQueryService(
        this.pedidoRepository,
        this.productoPedidoRepository
      );
    }
    return this.orderQueryServiceInstance;
  }

  /**
   * Get PaymentService instance (Singleton)
   */
  static getPaymentService(): PaymentService {
    if (!this.paymentServiceInstance) {
      this.paymentServiceInstance = new PaymentService(
        this.pedidoRepository,
        this.productoPedidoRepository,
        this.pagoRepository,
        this.metodoPagoRepository,
        this.tableService,
        this.inventoryService,
        this.clientService,
        this.priceCalculatorService
      );
    }
    return this.paymentServiceInstance;
  }

  /**
   * Get PriceCalculatorService instance (Singleton)
   */
  static getPriceCalculatorService(): PriceCalculatorService {
    return this.priceCalculatorService;
  }
}
