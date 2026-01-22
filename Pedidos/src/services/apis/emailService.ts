import axios from "axios"

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://email-service:3001';

export const sendVerificationEmail = async (email: string, token: string) => {
  try {
    const response = await axios.post(`${EMAIL_SERVICE_URL}/sendMail/verification`, {
      email,
      token 
    })
    return response.data;
  } catch (error: any) {
    console.error('Error al enviar email de verificación:', error.message);
  }
}

export const sendOrderConfirmationEmail = async (emailData: {
  email: string;
  nombreCliente: string;
  numeroPedido: number;
  productos: Array<{
    idProducto: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
  total: number;
  estado: string;
  direccionEntrega?: string;
  metodoPago: string;
}) => {
  try {
    const response = await axios.post(`${EMAIL_SERVICE_URL}/sendMail/confirmacion-pedido`, emailData);
    return response.data;
  } catch (error: any) {
    console.error('Error al enviar email de confirmación:', error.message);
    throw error;
  }
}