import { apiClient } from "../../core/api/client";
import type { IAppointmentRepository } from "../../domain/repositories/IAppointmentRepository";
import type { Appointment } from "../../domain/models/Appointment";

// Tipado de la respuesta cruda que viene de TU Backend (Hono/Prisma)
interface BackendAppointmentDTO {
  id: string;
  startsAt: string; // ISO String
  endsAt: string; // ISO String
  durationMinutes: number;
  status: string;
  totalPrice: number;
  client: {
    fullName: string;
  };
  locationType: "HOTEL" | "PARTICULAR";
}

interface BackendResponse {
  success: boolean;
  data: BackendAppointmentDTO[];
  meta: any;
}

export class ApiAppointmentRepository implements IAppointmentRepository {
  async getAppointmentsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Appointment[]> {
    try {
      // 1. Llamar a tu API usando el endpoint de lista con filtros de fecha
      const response = await apiClient.get<BackendResponse>("/appointments", {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
        limit: "100", // Traemos suficientes para la semana
      });

      if (!response.success) return [];

      // 2. Mapear (Adaptar) los datos del Backend al Modelo del Frontend
      return response.data.map((dto) => ({
        id: dto.id,
        // El backend manda 'client.fullName', el frontend usa 'patientName'
        patientName: dto.client.fullName,
        // El backend manda 'startsAt', el frontend usa 'start' (Date object)
        start: new Date(dto.startsAt),
        end: new Date(dto.endsAt),
        // Lógica de presentación
        serviceName:
          dto.locationType === "HOTEL" ? "Masaje Hotel" : "Particular",
        status: dto.status === "CANCELLED" ? "cancelled" : "confirmed",
      }));
    } catch (error) {
      console.error("❌ Error fetching appointments from API:", error);
      // En caso de error, retornamos array vacío para no romper la UI
      return [];
    }
  }
}
