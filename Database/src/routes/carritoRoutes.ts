import { Router } from "express";
import { CarritoController } from "../controllers/carritoController";

const router = Router();
const carritoController = new CarritoController();

router.get('/', carritoController.getAll.bind(carritoController));
router.get('/:id', carritoController.getById.bind(carritoController));
router.post('/', carritoController.create.bind(carritoController));
router.put('/:id', carritoController.update.bind(carritoController));
router.delete('/:id', carritoController.delete.bind(carritoController));

export default router;
