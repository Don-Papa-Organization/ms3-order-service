import axios, { AxiosInstance } from 'axios';
import { PromocionDto, PromocionesProductoResponse } from '../../types/promotion.types';

/**
 * Cliente HTTP para consultar el microservicio de eventos y promociones.
 * Solo maneja llamadas HTTP, NO contiene lógica de negocio.
 */
export class PromotionService {
  private axiosInstance: AxiosInstance;

  constructor() {
    const baseURL = process.env.EVENT_SERVICE_URL || 'http://event-service-app:4005/api';

    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Obtener todas las promociones activas
   * @param accessToken Token de autenticación del usuario
   * @returns Lista de promociones activas
   */
  async getPromocionesActivas(accessToken?: string): Promise<PromocionDto[]> {
    const headers: any = { ...this.axiosInstance.defaults.headers.common };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    try {
      const response = await this.axiosInstance.get('/promotions/activas/true', { headers });
      return response.data?.data ?? response.data ?? [];
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Servicio de eventos rechazó la autenticación');
      }
      console.error('Error al obtener promociones activas:', error.message);
      return [];
    }
  }

  /**
   * Obtener todas las promociones de un producto específico
   * @param idProducto ID del producto
   * @param accessToken Token de autenticación del usuario
   * @returns Lista de promociones aplicables al producto
   */
  async getPromocionesDeProducto(idProducto: number, accessToken?: string): Promise<PromocionesProductoResponse | null> {
    const headers: any = { ...this.axiosInstance.defaults.headers.common };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    try {
      const response = await this.axiosInstance.get(
        `/productos-promocion/producto/${idProducto}/promociones`, 
        { headers }
      );
      return response.data?.data ?? response.data ?? null;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error(`Servicio de eventos rechazó la autenticación para el producto ${idProducto}`);
      }
      console.error(`Error al obtener promociones del producto ${idProducto}:`, error.message);
      return null;
    }
  }

}
