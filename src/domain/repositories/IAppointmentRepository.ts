import type { Appointment } from "../models/Appointment";

// Principio de Inversión de Dependencias (D de SOLID):
// La UI dependerá de esta interfaz, no de Firebase directamente.
export interface IAppointmentRepository {
  /**
   * Obtiene las citas dentro de un rango de fechas.
   * @param startDate Fecha de inicio del rango (ej. inicio de la semana)
   * @param endDate Fecha de fin del rango (ej. fin de la semana)
   * @returns Promesa con la lista de citas encontradas
   */
  getAppointmentsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Appointment[]>;
}
