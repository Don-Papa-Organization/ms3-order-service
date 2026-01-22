import axios, { AxiosInstance } from "axios";
import { Mesa, UpdateEstadoMesaDto } from "../../types/table.types";

/**
 * Cliente HTTP para consultar el microservicio de reservas.
 * Solo maneja llamadas HTTP, NO contiene lógica de negocio.
 */
export class TableService {
  private axiosInstance: AxiosInstance;

  constructor() {
    const baseURL = process.env.RESERVATION_SERVICE_URL || "http://reservation-service-app:4004/api";

    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Obtiene todas las mesas del servicio de reservas
   * @param accessToken Token de autenticación del usuario
   * @returns Promise con el array de mesas
   */
  async getAllMesas(accessToken?: string): Promise<Mesa[]> {
    const headers: any = { ...this.axiosInstance.defaults.headers.common };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    try {
      const response = await this.axiosInstance.get<{ mesas: Mesa[]; total: number }>(
        "/table", 
        { headers }
      );
      return response.data.mesas || [];
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Servicio de reservas rechazó la autenticación");
      }
      console.error("Error al obtener mesas:", error.message);
      throw new Error(
        `Error al obtener mesas: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Actualiza el estado de una mesa específica
   * @param idMesa - ID de la mesa a actualizar
   * @param estado - Nuevo estado de la mesa
   * @param accessToken Token de autenticación del usuario
   * @returns Promise con la mesa actualizada
   */
  async updateMesaEstado(
    idMesa: number,
    estado: UpdateEstadoMesaDto,
    accessToken?: string
  ): Promise<Mesa> {
    const headers: any = { ...this.axiosInstance.defaults.headers.common };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    try {
      const response = await this.axiosInstance.patch<Mesa>(
        `/table/${idMesa}/estado`,
        estado,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error(`Servicio de reservas rechazó la autenticación para la mesa ${idMesa}`);
      }
      console.error(`Error al actualizar estado de mesa ${idMesa}:`, error.message);
      throw new Error(
        `Error al actualizar estado de mesa ${idMesa}: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }
}
