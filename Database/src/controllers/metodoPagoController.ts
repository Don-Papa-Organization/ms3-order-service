import { Request, Response } from 'express';
import { BaseController } from './baseController';
import { MetodoPago } from '../models';
import { MetodoPagoRepository } from '../repositories/metodoPagoRepository';

export class MetodoPagoController extends BaseController<MetodoPago> {
    private metodoPagoRepository: MetodoPagoRepository;

    constructor() {
        const metodoPagoRepo = new MetodoPagoRepository();
        super(metodoPagoRepo);
        this.metodoPagoRepository = metodoPagoRepo;
    }

    async getByNombre(req: Request, res: Response): Promise<void> {
        try {
            const { nombre } = req.params;
            
            if (!nombre || typeof nombre !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'Nombre es requerido y debe ser texto'
                });
                return;
            }

            const metodoPago = await this.metodoPagoRepository.findByNombre(nombre);
            
            metodoPago
                ? res.json({ success: true, data: metodoPago })
                : res.status(404).json({
                    success: false,
                    error: 'Método de pago no encontrado'
                });
        } catch (error) {
            this.handleError(error, res, 'Error al buscar método de pago por nombre');
        }
    }
}