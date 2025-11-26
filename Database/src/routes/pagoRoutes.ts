import { Router } from "express";
import { PagoController } from "../controllers/pagoController";

const router = Router();
const pagoController = new PagoController();

router.get('/pedido/:idPedido', pagoController.getByPedido.bind(pagoController));
router.get('/', pagoController.getAll.bind(pagoController));
router.get('/:id', pagoController.getById.bind(pagoController));
router.post('/', pagoController.create.bind(pagoController));
router.put('/:id', pagoController.update.bind(pagoController));
router.delete('/:id', pagoController.delete.bind(pagoController));

export default router;
