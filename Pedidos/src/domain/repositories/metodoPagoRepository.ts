import { BaseRepository } from "./baseRepository";
import { MetodoPago } from "../models";

export class MetodoPagoRepository extends BaseRepository<MetodoPago> {
    constructor() {
        super(MetodoPago);
    }

    async findByNombre(nombre: string): Promise<MetodoPago | null> {
        return this.model.findOne({ where: { nombre } });
    }
}
