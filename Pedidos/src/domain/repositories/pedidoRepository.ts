import { BaseRepository } from "./baseRepository";
import { Pedido } from "../models";

export class PedidoRepository extends BaseRepository<Pedido> {
    constructor() {
        super(Pedido);
    }

    async findByUsuario(idUsuario: number): Promise<Pedido[]> {
        return this.model.findAll({ where: { idUsuario } });
    }

    async findByEstado(estado: string): Promise<Pedido[]> {
        return this.model.findAll({ where: { estado } });
    }
}
