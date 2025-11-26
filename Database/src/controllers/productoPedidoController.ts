import { Request, Response } from 'express';
import { BaseController } from './baseController';
import { ProductoPedido } from '../models';
import { ProductoPedidoRepository } from '../repositories/productoPedidoRepository';

export class ProductoPedidoController extends BaseController<ProductoPedido> {
    private productoPedidoRepository: ProductoPedidoRepository;

    constructor() {
        const productoPedidoRepo = new ProductoPedidoRepository();
        super(productoPedidoRepo);
        this.productoPedidoRepository = productoPedidoRepo;
    }

    async getByPedido(req: Request, res: Response): Promise<void> {
        try {
            const idPedido = this.validateId(req.params.idPedido);
            
            if (!idPedido) {
                res.status(400).json({
                    success: false,
                    error: 'ID de pedido inválido'
                });
                return;
            }

            const productos = await this.productoPedidoRepository.findByPedido(idPedido);
            
            productos.length > 0
                ? res.json({ success: true, data: productos })
                : res.status(404).json({
                    success: false,
                    error: 'No se encontraron productos en este pedido'
                });
        } catch (error) {
            this.handleError(error, res, 'Error al buscar productos del pedido');
        }
    }
}