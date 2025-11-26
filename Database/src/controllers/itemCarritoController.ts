import { Request, Response } from 'express';
import { BaseController } from './baseController';
import { ItemCarrito } from '../models';
import { ItemCarritoRepository } from '../repositories/itemCarritoRepository';

export class ItemCarritoController extends BaseController<ItemCarrito> {
    private itemCarritoRepository: ItemCarritoRepository;

    constructor() {
        const itemCarritoRepo = new ItemCarritoRepository();
        super(itemCarritoRepo);
        this.itemCarritoRepository = itemCarritoRepo;
    }

    async getByCarrito(req: Request, res: Response): Promise<void> {
        try {
            const idCarrito = this.validateId(req.params.idCarrito);
            
            if (!idCarrito) {
                res.status(400).json({
                    success: false,
                    error: 'ID de carrito inválido'
                });
                return;
            }

            const items = await this.itemCarritoRepository.findByCarrito(idCarrito);
            
            items.length > 0
                ? res.json({ success: true, data: items })
                : res.status(404).json({
                    success: false,
                    error: 'No se encontraron items en este carrito'
                });
        } catch (error) {
            this.handleError(error, res, 'Error al buscar items del carrito');
        }
    }
}