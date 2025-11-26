import { Router } from "express";
import { PedidoController } from "../controllers/pedidoController";

const router = Router();
const pedidoController = new PedidoController();

router.get('/usuario/:idUsuario', pedidoController.getByUsuario.bind(pedidoController));
router.get('/estado/:estado', pedidoController.getByEstado.bind(pedidoController));
router.get('/', pedidoController.getAll.bind(pedidoController));
router.get('/:id', pedidoController.getById.bind(pedidoController));
router.post('/', pedidoController.create.bind(pedidoController));
router.put('/:id', pedidoController.update.bind(pedidoController));
router.delete('/:id', pedidoController.delete.bind(pedidoController));

export default router;
