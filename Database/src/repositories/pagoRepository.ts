import { BaseRepository } from "./baseRepository";
import { Pago } from "../models";

export class PagoRepository extends BaseRepository<Pago> {
    constructor() {
        super(Pago);
    }

    async findByPedido(idPedido: number): Promise<Pago[]> {
        return this.model.findAll({ where: { idPedido } });
    }
}
