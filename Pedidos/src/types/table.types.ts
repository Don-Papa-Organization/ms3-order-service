export const EstadosMesa = ["Disponible", "Reservada", "Ocupada", "Fuera de servicio"] as const;

export type EstadoMesa = typeof EstadosMesa[number];

export interface Mesa {
	idMesa: number;
	numeroMesa: number;
	capacidad: number;
	estado: EstadoMesa;
	ubicacion?: string;
}

export interface UpdateEstadoMesaDto {
	estado: EstadoMesa;
}
