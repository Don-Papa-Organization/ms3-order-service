import { BaseRepository } from "./baseRepository";
import { ProductoPedido } from "../models";

export class ProductoPedidoRepository extends BaseRepository<ProductoPedido> {
    constructor() {
        super(ProductoPedido);
    }

    async findByPedido(idPedido: number): Promise<ProductoPedido[]> {
        return this.model.findAll({ where: { idPedido } });
    }
}
