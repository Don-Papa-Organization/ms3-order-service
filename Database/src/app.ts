import express, { Express } from "express";
import {
	metodoPagoRoutes,
	pagoRoutes,
	pedidoRoutes,
	itemCarritoRoutes,
	productoPedidoRoutes,
	carritoRoutes,
} from './routes';

const app: Express = express();

app.use(express.json());

app.use('/db/metodos-pago', metodoPagoRoutes);
app.use('/db/pagos', pagoRoutes);
app.use('/db/pedidos', pedidoRoutes);
app.use('/db/items-carrito', itemCarritoRoutes);
app.use('/db/productos-pedido', productoPedidoRoutes);
app.use('/db/carritos', carritoRoutes);


export default app;