import { Request, Response } from 'express';
import { BaseController } from './baseController';
import { Pago } from '../models';
import { PagoRepository } from '../repositories/pagoRepository';

export class PagoController extends BaseController<Pago> {
    private pagoRepository: PagoRepository;

    constructor() {
        const pagoRepo = new PagoRepository();
        super(pagoRepo);
        this.pagoRepository = pagoRepo;
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

            const pagos = await this.pagoRepository.findByPedido(idPedido);
            
            pagos.length > 0
                ? res.json({ success: true, data: pagos })
                : res.status(404).json({
                    success: false,
                    error: 'No se encontraron pagos para este pedido'
                });
        } catch (error) {
            this.handleError(error, res, 'Error al buscar pagos del pedido');
        }
    }
}