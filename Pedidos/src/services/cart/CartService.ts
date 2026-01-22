import { PedidoRepository } from "../../domain/repositories/pedidoRepository";
import { ProductoPedidoRepository } from "../../domain/repositories/productoPedidoRepository";
import { InventoryService } from "../apis/inventoryService";
import { Pedido } from "../../domain/models/pedido";
import { ProductoPedido } from "../../domain/models/productoPedido";
import { Pago } from "../../domain/models/pago";
import { ServiceResult } from "../../types/pedido.types";

/**
 * CartService - Handles shopping cart operations
 * Responsibility: Manage cart items (add, remove, clear)
 */
export class CartService {
  constructor(
    private pedidoRepository: PedidoRepository,
    private productoPedidoRepository: ProductoPedidoRepository,
    private inventoryService: InventoryService
  ) {}

  /**
   * Add product to cart (CU022)
   */
  async addProductToCart(
    idUsuario: number,
    idProducto: number,
    cantidad: number,
    accessToken?: string
  ): Promise<ServiceResult> {
    // Validate quantity
    if (cantidad <= 0) {
      return { 
        status: 400, 
        message: "La cantidad debe ser mayor a 0" 
      };
    }

    // Validate product exists and is active
    const producto = await this.inventoryService.getProductoById(idProducto, accessToken);
    
    if (!producto || !producto.activo) {
      return { 
        status: 404, 
        message: "Producto no disponible actualmente" 
      };
    }

    // Find or create unconfirmed cart
    let cart = await this.pedidoRepository.findOne({
      where: {
        idUsuario,
        estado: 'sin_confirmar'
      }
    });

    if (!cart) {
      cart = await this.pedidoRepository.create({
        idUsuario,
        total: 0,
        canalVenta: 'web',
        estado: 'sin_confirmar',
        fechaPedido: new Date()
      });
    }

    // Add or update product in cart
    const { productoPedido, pedidoActualizado } = await this.addOrUpdateProduct(
      cart.idPedido,
      idProducto,
      cantidad,
      producto.precio
    );

    const productos = await this.productoPedidoRepository.findByPedido(cart.idPedido);

    return {
      status: 200,
      data: {
        success: true,
        message: "Producto añadido al carrito",
        data: {
          pedido: {
            idPedido: pedidoActualizado.idPedido,
            idUsuario: pedidoActualizado.idUsuario,
            total: pedidoActualizado.total,
            estado: pedidoActualizado.estado,
            canalVenta: pedidoActualizado.canalVenta,
            fechaPedido: pedidoActualizado.fechaPedido,
            cantidadProductos: productos.length
          },
          productoPedido: {
            idProductoPedido: productoPedido.idProductoPedido,
            idPedido: productoPedido.idPedido,
            idProducto: productoPedido.idProducto,
            cantidad: productoPedido.cantidad,
            precioUnitario: productoPedido.precioUnitario,
            subtotal: productoPedido.subtotal
          }
        }
      }
    };
  }

  /**
   * Get current cart
   */
  async getCurrentCart(idUsuario: number): Promise<Pedido | null> {
    const cart = await this.pedidoRepository.findOne({
      where: {
        idUsuario,
        estado: 'sin_confirmar'
      },
      include: [ProductoPedido]
    });

    return cart;
  }

  /**
   * Get cart products
   */
  async getCartProducts(idUsuario: number): Promise<ProductoPedido[]> {
    const cart = await this.getCurrentCart(idUsuario);
    
    if (!cart) {
      return [];
    }

    return await this.productoPedidoRepository.findByPedido(cart.idPedido);
  }

  /**
   * Update product quantity in cart (increase or decrease)
   * If new quantity <= 0, removes the product
   */
  async updateProductQuantity(
    idProductoPedido: number,
    nuevaCantidad: number,
    idUsuario: number
  ): Promise<ServiceResult<{ mensaje: string; productoPedido?: ProductoPedido }>> {
    try {
      const productoPedido = await ProductoPedido.findByPk(idProductoPedido, {
        include: [{ model: Pedido }]
      });

      if (!productoPedido) {
        return { 
          status: 404, 
          message: 'Producto no encontrado en el pedido' 
        };
      }

      const pedido = productoPedido.pedido;

      if (pedido.idUsuario !== idUsuario) {
        return { 
          status: 403, 
          message: 'No tienes permiso para modificar este pedido' 
        };
      }

      if (pedido.estado !== 'sin_confirmar') {
        return { 
          status: 400, 
          message: 'Solo se pueden modificar pedidos en estado sin confirmar' 
        };
      }

      // Si la nueva cantidad es <= 0, eliminar el producto
      if (nuevaCantidad <= 0) {
        return await this.removeProductFromCart(idProductoPedido, idUsuario);
      }

      // Actualizar cantidad y subtotal
      const nuevoSubtotal = nuevaCantidad * productoPedido.precioUnitario;
      await this.productoPedidoRepository.update(idProductoPedido, {
        cantidad: nuevaCantidad,
        subtotal: nuevoSubtotal
      });

      // Recalcular total del pedido
      const productosDelPedido = await this.productoPedidoRepository.findByPedido(pedido.idPedido);
      const nuevoTotal = productosDelPedido.reduce(
        (sum, prod) => sum + Number(prod.subtotal),
        0
      );

      await this.pedidoRepository.update(pedido.idPedido, { total: nuevoTotal });

      const productoActualizado = await this.productoPedidoRepository.findById(idProductoPedido);

      return {
        status: 200,
        message: 'Cantidad actualizada exitosamente',
        data: { 
          mensaje: 'Cantidad modificada',
          productoPedido: productoActualizado as ProductoPedido
        }
      };
    } catch (error: any) {
      return { 
        status: 500, 
        message: `Error al actualizar cantidad: ${error.message}` 
      };
    }
  }

  /**
   * Remove product from cart completely (all quantities)
   * Uses idProductoPedido to identify the specific product-order relationship
   */
  async removeProductFromCart(
    idProductoPedido: number,
    idUsuario: number
  ): Promise<ServiceResult<{ mensaje: string }>> {
    try {
      const productoPedido = await ProductoPedido.findByPk(idProductoPedido, {
        include: [{ model: Pedido }]
      });

      if (!productoPedido) {
        return { 
          status: 404, 
          message: 'Producto no encontrado en el pedido' 
        };
      }

      const pedido = productoPedido.pedido;

      if (pedido.idUsuario !== idUsuario) {
        return { 
          status: 403, 
          message: 'No tienes permiso para modificar este pedido' 
        };
      }

      if (pedido.estado !== 'sin_confirmar') {
        return { 
          status: 400, 
          message: 'Solo se pueden modificar pedidos en estado sin confirmar' 
        };
      }

      const subtotalEliminado = productoPedido.subtotal;
      await productoPedido.destroy();

      const nuevoTotal = pedido.total - subtotalEliminado;
      await this.pedidoRepository.update(pedido.idPedido, {
        total: nuevoTotal
      });

      return {
        status: 200,
        message: 'Producto eliminado del carrito',
        data: { mensaje: 'Producto eliminado exitosamente' }
      };
    } catch (error: any) {
      return { 
        status: 500, 
        message: `Error al eliminar producto: ${error.message}` 
      };
    }
  }

  /**
   * Clear entire cart
   */
  async clearCart(idUsuario: number): Promise<ServiceResult<{ mensaje: string }>> {
    try {
      const pedido = await Pedido.findOne({
        where: {
          idUsuario: idUsuario,
          estado: 'sin_confirmar'
        },
        include: [{ model: Pago }]
      });

      if (!pedido) {
        return { 
          status: 404, 
          message: 'No tienes un carrito activo' 
        };
      }

      if (pedido.pagos && pedido.pagos.length > 0) {
        return {
          status: 400,
          message: 'No se puede vaciar un carrito que ya tiene pagos registrados'
        };
      }

      await pedido.destroy();

      return {
        status: 200,
        message: 'Carrito vaciado exitosamente',
        data: { mensaje: 'Carrito eliminado' }
      };
    } catch (error: any) {
      return { 
        status: 500, 
        message: `Error al vaciar carrito: ${error.message}` 
      };
    }
  }

  /**
   * Private: Add or update product in order
   */
  private async addOrUpdateProduct(
    idPedido: number,
    idProducto: number,
    cantidad: number,
    precioUnitario: number
  ): Promise<{ productoPedido: ProductoPedido; pedidoActualizado: Pedido }> {
    const productoExistente = await this.productoPedidoRepository.findOne({
      where: { idPedido, idProducto }
    });

    let productoPedido: ProductoPedido;

    if (productoExistente) {
      const nuevaCantidad = productoExistente.cantidad + cantidad;
      const nuevoSubtotal = nuevaCantidad * precioUnitario;
      
      await this.productoPedidoRepository.update(
        productoExistente.idProductoPedido,
        {
          cantidad: nuevaCantidad,
          subtotal: nuevoSubtotal,
          precioUnitario
        }
      );

      productoPedido = await this.productoPedidoRepository.findById(
        productoExistente.idProductoPedido
      ) as ProductoPedido;
    } else {
      const subtotal = cantidad * precioUnitario;
      
      productoPedido = await this.productoPedidoRepository.create({
        idPedido,
        idProducto,
        cantidad,
        precioUnitario,
        subtotal
      });
    }

    const productosDelPedido = await this.productoPedidoRepository.findByPedido(idPedido);
    const nuevoTotal = productosDelPedido.reduce(
      (sum, prod) => sum + Number(prod.subtotal),
      0
    );

    await this.pedidoRepository.update(idPedido, { total: nuevoTotal });
    const pedidoActualizado = await this.pedidoRepository.findById(idPedido) as Pedido;

    return { productoPedido, pedidoActualizado };
  }
}
