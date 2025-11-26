import { Request, Response } from 'express';
import { BaseController } from './baseController';
import { Carrito } from '../models';
import { CarritoRepository } from '../repositories/carritoRepository';

export class CarritoController extends BaseController<Carrito> {
    private carritoRepository: CarritoRepository;

    constructor() {
        const carritoRepo = new CarritoRepository();
        super(carritoRepo);
        this.carritoRepository = carritoRepo;
    }

    // Aquí podríamos agregar métodos específicos si se necesitan
    // Por ejemplo, si se agregara un método findByUsuario en el repository
    // podríamos agregar un método getByUsuario aquí
}