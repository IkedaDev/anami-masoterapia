import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { Appointment } from "../../domain/models/Appointment";
import type { IAppointmentRepository } from "../../domain/repositories/IAppointmentRepository";

export class FirebaseAppointmentRepository implements IAppointmentRepository {
  private collectionName = "appointments";

  async getAppointmentsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Appointment[]> {
    try {
      // Convertimos Date a Timestamp de Firestore
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);

      // Consulta optimizada
      const q = query(
        collection(db, this.collectionName),
        where("scheduledStart", ">=", startTimestamp.toMillis()),
        where("scheduledStart", "<=", endTimestamp.toMillis())
      );

      const querySnapshot = await getDocs(q);

      // Mapeo de datos (Adapter Pattern implícito)
      // Transformamos el formato crudo de Firebase a nuestro modelo de Dominio
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          patientName: data.patientName || "Paciente",
          // Asumiendo que guardaste 'scheduledStart' y 'scheduledEnd' como números (timestamps) en la app móvil
          start: new Date(data.scheduledStart),
          end: new Date(data.scheduledEnd),
          serviceName:
            data.serviceMode === "hotel" ? "Masaje Hotel" : "Particular",
          status: "confirmed", // O mapear según tu lógica
        };
      });
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }
  }
}
