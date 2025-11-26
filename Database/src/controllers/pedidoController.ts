import { Request, Response } from 'express';
import { BaseController } from './baseController';
import { Pedido } from '../models';
import { PedidoRepository } from '../repositories/pedidoRepository';

export class PedidoController extends BaseController<Pedido> {
    private pedidoRepository: PedidoRepository;

    constructor() {
        const pedidoRepo = new PedidoRepository();
        super(pedidoRepo);
        this.pedidoRepository = pedidoRepo;
    }

    async getByUsuario(req: Request, res: Response): Promise<void> {
        try {
            const idUsuario = this.validateId(req.params.idUsuario);
            
            if (!idUsuario) {
                res.status(400).json({
                    success: false,
                    error: 'ID de usuario inválido'
                });
                return;
            }

            const pedidos = await this.pedidoRepository.findByUsuario(idUsuario);
            
            pedidos.length > 0
                ? res.json({ success: true, data: pedidos })
                : res.status(404).json({
                    success: false,
                    error: 'No se encontraron pedidos para este usuario'
                });
        } catch (error) {
            this.handleError(error, res, 'Error al buscar pedidos del usuario');
        }
    }

    async getByEstado(req: Request, res: Response): Promise<void> {
        try {
            const { estado } = req.params;
            const estadosValidos = ['pendiente', 'pagado', 'cancelado'];
            
            if (!estado || !estadosValidos.includes(estado)) {
                res.status(400).json({
                    success: false,
                    error: `Estado debe ser uno de: ${estadosValidos.join(', ')}`
                });
                return;
            }

            const pedidos = await this.pedidoRepository.findByEstado(estado);
            
            pedidos.length > 0
                ? res.json({ success: true, data: pedidos })
                : res.status(404).json({
                    success: false,
                    error: `No se encontraron pedidos en estado: ${estado}`
                });
        } catch (error) {
            this.handleError(error, res, 'Error al buscar pedidos por estado');
        }
    }
}