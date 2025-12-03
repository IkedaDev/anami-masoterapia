export interface Appointment {
  id: string;
  patientName: string;
  start: Date; // Usaremos objetos Date nativos para facilitar cálculos en UI
  end: Date;
  serviceName: string; // Ej: "Masaje Descontracturante"
  status: "confirmed" | "pending" | "cancelled";
}
