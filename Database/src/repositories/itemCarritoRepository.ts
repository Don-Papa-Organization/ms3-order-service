import { BaseRepository } from "./baseRepository";
import { ItemCarrito } from "../models";

export class ItemCarritoRepository extends BaseRepository<ItemCarrito> {
    constructor() {
        super(ItemCarrito);
    }

    async findByCarrito(idCarrito: number): Promise<ItemCarrito[]> {
        return this.model.findAll({ where: { idCarrito } });
    }
}
