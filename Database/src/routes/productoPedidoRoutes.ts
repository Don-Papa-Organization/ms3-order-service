import { Router } from "express";
import { ProductoPedidoController } from "../controllers/productoPedidoController";

const router = Router();
const productoPedidoController = new ProductoPedidoController();

router.get('/pedido/:idPedido', productoPedidoController.getByPedido.bind(productoPedidoController));
router.get('/', productoPedidoController.getAll.bind(productoPedidoController));
router.get('/:id', productoPedidoController.getById.bind(productoPedidoController));
router.post('/', productoPedidoController.create.bind(productoPedidoController));
router.put('/:id', productoPedidoController.update.bind(productoPedidoController));
router.delete('/:id', productoPedidoController.delete.bind(productoPedidoController));

export default router;
