import axios, { AxiosInstance } from 'axios';

/**
 * Cliente HTTP para consultar el microservicio de usuarios y validar clientes.
 */
export class ClientService {
  private axiosInstance: AxiosInstance;

  constructor() {
    const baseURL = process.env.USER_SERVICE_URL || 'http://user-service-app:4002/api/clientes';

    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getClients(accessToken?: string): Promise<any[]> {
    const headers: any = { ...this.axiosInstance.defaults.headers.common };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    const response = await this.axiosInstance.get('', { headers });
    return response.data;
  }

  async getClientById(idCliente: number, accessToken?: string): Promise<any | null> {
    const headers: any = { ...this.axiosInstance.defaults.headers.common };
    if (accessToken) {
      console.log("Attaching access token to client service request");
      console.log(accessToken);
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    try {
      const response = await this.axiosInstance.get(`/${idCliente}`, { headers });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error(`Servicio de usuarios rechazó la autenticación para el cliente ${idCliente}`);
      }
      throw new Error(`No se pudo obtener el cliente ${idCliente}: ${error.message}`);
    }
  }
}
