export interface ListAllOrdersRequestDto {
  page?: number;
  limit?: number;
  busqueda?: string;
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
}
