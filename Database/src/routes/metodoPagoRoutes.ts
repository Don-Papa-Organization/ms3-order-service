import { Router } from "express";
import { MetodoPagoController } from "../controllers/metodoPagoController";

const router = Router();
const metodoPagoController = new MetodoPagoController();

router.get('/nombre/:nombre', metodoPagoController.getByNombre.bind(metodoPagoController));
router.get('/', metodoPagoController.getAll.bind(metodoPagoController));
router.get('/:id', metodoPagoController.getById.bind(metodoPagoController));
router.post('/', metodoPagoController.create.bind(metodoPagoController));
router.put('/:id', metodoPagoController.update.bind(metodoPagoController));
router.delete('/:id', metodoPagoController.delete.bind(metodoPagoController));

export default router;
