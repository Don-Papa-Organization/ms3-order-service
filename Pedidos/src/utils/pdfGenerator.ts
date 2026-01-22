import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Pedido } from '../domain/models/pedido';
import { ProductoPedido } from '../domain/models/productoPedido';

export interface ReciboPedidoData {
  pedido: Pedido;
  productos: ProductoPedido[];
  nombreMesa?: string;
}

/**
 * Genera un recibo en PDF para un pedido
 * @param data - Datos del pedido y productos
 * @returns Ruta del archivo PDF generado
 */
export const generarReciboPDF = async (data: ReciboPedidoData): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Crear directorio de recibos si no existe
      const recibosDir = path.join(process.cwd(), process.env.RECEIPTS_DIR || 'recibos');
      if (!fs.existsSync(recibosDir)) {
        fs.mkdirSync(recibosDir, { recursive: true });
      }

      // Generar nombre de archivo único
      const fileName = `recibo_pedido_${data.pedido.idPedido}_${Date.now()}.pdf`;
      const filePath = path.join(recibosDir, fileName);

      // Crear documento PDF
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      // Pipe a archivo
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Encabezado
      doc
        .fontSize(20)
        .text('RECIBO DE PEDIDO', { align: 'center' })
        .moveDown();

      // Información del pedido
      doc
        .fontSize(12)
        .text(`Pedido #${data.pedido.idPedido}`, { align: 'left' })
        .text(`Fecha: ${new Date(data.pedido.fechaPedido).toLocaleString('es-ES')}`)
        .text(`Estado: ${data.pedido.estado.toUpperCase()}`)
        .text(`Canal: ${data.pedido.canalVenta}`)
        .moveDown();

      // Información de mesa si aplica
      if (data.pedido.idMesa) {
        doc
          .text(`Mesa: ${data.nombreMesa || `#${data.pedido.idMesa}`}`)
          .moveDown();
      } else {
        doc
          .text('Tipo: PARA LLEVAR')
          .moveDown();
      }

      // Dirección de entrega si aplica
      if (data.pedido.direccionEntrega) {
        doc
          .text(`Dirección de entrega: ${data.pedido.direccionEntrega}`)
          .moveDown();
      }

      // Línea separadora
      doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown();

      // Encabezado de tabla de productos
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Producto', 50, doc.y, { width: 200, continued: true })
        .text('Cant.', { width: 60, continued: true })
        .text('P. Unit.', { width: 80, continued: true })
        .text('Subtotal', { width: 80, align: 'right' })
        .font('Helvetica')
        .moveDown(0.5);

      // Productos
      data.productos.forEach((producto) => {
        const yPos = doc.y;
        
        doc
          .fontSize(10)
          .text(`ID: ${producto.idProducto}`, 50, yPos, { width: 200 })
          .text(`${producto.cantidad}`, 250, yPos, { width: 60 })
          .text(`$${Number(producto.precioUnitario).toFixed(2)}`, 310, yPos, { width: 80 })
          .text(`$${Number(producto.subtotal).toFixed(2)}`, 390, yPos, { width: 80, align: 'right' });

        doc.moveDown(0.5);
      });

      // Línea separadora
      doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown();

      // Total
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`TOTAL: $${Number(data.pedido.total).toFixed(2)}`, { align: 'right' })
        .font('Helvetica')
        .moveDown(2);

      // Pie de página
      doc
        .fontSize(10)
        .text('¡Gracias por su preferencia!', { align: 'center' })
        .moveDown(0.5)
        .fontSize(8)
        .fillColor('#666666')
        .text('Este documento es un comprobante de pedido', { align: 'center' });

      // Finalizar PDF
      doc.end();

      // Esperar a que se termine de escribir
      writeStream.on('finish', () => {
        resolve(filePath);
      });

      writeStream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};
