import axios, { AxiosInstance } from 'axios';
import { Request, Response } from 'express';
/**
 * Servicio para consumir la API de Inventario
 * Realiza llamadas HTTP al microservicio de inventario para obtener y gestionar productos
 */




export class InventoryService {
  private axiosInstance: AxiosInstance;
  private inventoryBaseUrl: string;
  private internalToken?: string;

  constructor() {
    this.inventoryBaseUrl = process.env.INVENTORY_SERVICE_URL || 'http://inventory-service-app:4001/api';
    //this.internalToken = process.env.INTERNAL_SERVICE_TOKEN;

    const headers: any = {
      'Content-Type': 'application/json',
    };

    // Solo agregar x-internal-token si está configurado
    // if (this.internalToken) {
    //   headers['x-internal-token'] = this.internalToken;
    // }

    this.axiosInstance = axios.create({
      baseURL: this.inventoryBaseUrl,
      timeout: 10000, // 10 segundos
      headers,
    });
  }

  /**
   * Obtener todos los productos desde el catálogo público
   */
  async getAllProductos(accessToken?: string): Promise<any[]> {
    try {
      // Usa ruta pública del catálogo (no requiere autenticación)
      const response = await this.axiosInstance.get('/catalogo');
      const payload = response.data?.data ?? response.data;
      return payload?.productos ?? payload ?? [];
    } catch (error: any) {
      console.error('Error al obtener productos:', error.message);
      throw new Error(`No se pudo conectar con el servicio de inventario: ${error.message}`);
    }
  }

  /**
   * Obtener producto por ID desde el catálogo público
   */
  async getProductoById(idProducto: number, accessToken?: string): Promise<any> {
    try {
      // Usa ruta pública del catálogo (no requiere autenticación)
      const response = await this.axiosInstance.get(`/catalogo/${idProducto}`);
      return response.data?.data ?? response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error(`Error al obtener producto ${idProducto}:`, error.message);
      throw new Error(`No se pudo obtener el producto: ${error.message}`);
    }
  }

  /**
   * Obtener múltiples productos por IDs
   */
  async getProductosByIds(ids: number[], accessToken?: string): Promise<any[]> {
    try {
      const requests = ids.map(id => this.getProductoById(id, accessToken));
      const resultados = await Promise.all(requests);
      return resultados.filter(p => p !== null);
    } catch (error: any) {
      console.error('Error al obtener múltiples productos:', error.message);
      throw new Error(`No se pudo obtener los productos: ${error.message}`);
    }
  }

  /**
   * Validar si un producto existe
   */
  async productoExists(idProducto: number, accessToken?: string): Promise<boolean> {
    try {
      const producto = await this.getProductoById(idProducto, accessToken);
      return producto !== null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener detalles de productos para una promoción
   */
  async getProductosForPromocion(productosIds: number[], accessToken?: string): Promise<any[]> {
    try {
      return await this.getProductosByIds(productosIds, accessToken);
    } catch (error: any) {
      console.error('Error al obtener productos para promoción:', error.message);
      throw error;
    }
  }

  /**
   * Reducir stock de un producto (reservar inventario)
   * TODO: Este método debe ser implementado en MS1 Inventory Service
   * 
   * @param idProducto - ID del producto
   * @param cantidad - Cantidad a reducir del stock
   * @param accessToken - Token de acceso para autenticación
   * @throws Error si no hay suficiente stock o el servicio no está disponible
   */
  async reducirStock(idProducto: number, cantidad: number, accessToken?: string): Promise<void> {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // TODO: Implementar endpoint en MS1 Inventory Service
      // POST /api/products/:idProducto/reduce-stock
      // Body: { cantidad: number }
      
      // Por ahora, lanzar error indicando que debe implementarse
      console.warn(`TODO: Llamar a MS1 para reducir stock del producto ${idProducto} en ${cantidad} unidades`);
      
      // Descomentar cuando MS1 implemente el endpoint:
      // const response = await this.axiosInstance.post(
      //   `/products/${idProducto}/reduce-stock`,
      //   { cantidad },
      //   { headers }
      // );
      // return response.data;
      
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(`Stock insuficiente para el producto ${idProducto}`);
      }
      console.error(`Error al reducir stock del producto ${idProducto}:`, error.message);
      throw new Error(`No se pudo reducir el stock: ${error.message}`);
    }
  }
}
