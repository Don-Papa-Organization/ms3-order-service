import { Router } from "express";
import { ItemCarritoController } from "../controllers/itemCarritoController";

const router = Router();
const itemCarritoController = new ItemCarritoController();

router.get('/carrito/:idCarrito', itemCarritoController.getByCarrito.bind(itemCarritoController));
router.get('/', itemCarritoController.getAll.bind(itemCarritoController));
router.get('/:id', itemCarritoController.getById.bind(itemCarritoController));
router.post('/', itemCarritoController.create.bind(itemCarritoController));
router.put('/:id', itemCarritoController.update.bind(itemCarritoController));
router.delete('/:id', itemCarritoController.delete.bind(itemCarritoController));

export default router;
