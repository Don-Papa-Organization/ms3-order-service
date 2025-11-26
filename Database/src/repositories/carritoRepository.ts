import { BaseRepository } from "./baseRepository";
import { Carrito } from "../models";

export class CarritoRepository extends BaseRepository<Carrito>{
    constructor(){
        super(Carrito)
    }
}