import { useState, useEffect } from "react";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  getMinutes,
  differenceInMinutes,
  addWeeks,
  subWeeks,
  getDay,
} from "date-fns";
import { es } from "date-fns/locale";

import "./AnamiCalendar.css";
import { ApiAppointmentRepository } from "../../../infrastructure/repositories/ApiAppointmentRepository";

// 2. INSTANCIA DEL REPOSITORIO REAL
const repository = new ApiAppointmentRepository();

// CONSTANTE CLAVE: Altura de 1 minuto en el calendario (80px / 60min ≈ 1.3333px/min)
const PIXELS_PER_MINUTE = 80 / 60;

const AnamiCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Lunes

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      const endOfWeekDate = addDays(startDate, 7);

      try {
        const data = await repository.getAppointmentsByDateRange(
          startDate,
          endOfWeekDate
        );
        setAppointments(data);
      } catch (error) {
        console.error("Error cargando citas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [currentDate]);

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));

  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    addDays(startDate, i)
  );

  const timeSlots = [];
  for (let i = 8; i <= 23; i++) {
    timeSlots.push(i);
  }

  // --- LÓGICA DE HORARIOS DE HOTEL ---
  const isHotelHour = (day, hour) => {
    const dayIndex = getDay(day); // 0=Domingo, 1=Lunes, ..., 6=Sábado

    // Lunes (1): 14:00 - 19:00 (Fin no inclusivo para el bloque de hora)
    if (dayIndex === 1 && hour >= 14 && hour < 19) return true;

    // Martes (2): 19:00 - 23:00
    if (dayIndex === 2 && hour >= 19 && hour < 23) return true;

    // Sábado (6): 14:00 - 19:00
    if (dayIndex === 6 && hour >= 14 && hour < 19) return true;

    // Futuro Viernes (5): Descomentar cuando sea necesario
    // if (dayIndex === 5 && hour >= 14 && hour < 19) return true;

    return false;
  };

  return (
    <div className="anami-calendar">
      {/* Header */}
      <div className="calendar-header">
        <h2 className="calendar-title">
          <span>Agenda</span> {format(startDate, "MMMM yyyy", { locale: es })}
        </h2>
        <div className="nav-group">
          <button onClick={prevWeek} className="nav-btn">
            ← Anterior
          </button>
          <button onClick={nextWeek} className="nav-btn">
            Siguiente →
          </button>
        </div>
      </div>

      {/* VISTA DESKTOP (Tabla Scrollable con Posicionamiento Absoluto) */}
      <div className="calendar-view-desktop">
        <div className="calendar-scroll">
          <div className="calendar-table-container">
            {/* Encabezados (Días) */}
            <div className="calendar-grid-row header-row">
              <div className="header-time-label">Hora</div>
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className={`day-header ${
                    isSameDay(day, new Date()) ? "today" : ""
                  }`}
                >
                  <span className="day-name">
                    {format(day, "EEE", { locale: es })}
                  </span>
                  <span className="day-number">{format(day, "d")}</span>
                </div>
              ))}
            </div>

            {/* Cuerpo (Horas) */}
            <div className="calendar-body">
              {loading && (
                <div className="loading-overlay">
                  <span>Cargando citas...</span>
                </div>
              )}

              {timeSlots.map((hour) => (
                <div key={hour} className="calendar-grid-row time-row">
                  <div className="time-label">{hour}:00</div>

                  {weekDays.map((day, colIndex) => {
                    // Verificar si es hora de Hotel
                    const isHotel = isHotelHour(day, hour);

                    // Estilo de fondo condicional
                    const bgStyle = isHotel
                      ? { backgroundColor: "#cae5fcff" }
                      : {}; // Azul muy suave

                    return (
                      <div
                        key={colIndex}
                        className="day-column relative-container"
                        style={bgStyle}
                        title={isHotel ? "Horario Hotel" : ""}
                      >
                        {/* Renderizamos las citas que COMIENZAN en esta hora */}
                        {appointments
                          .filter(
                            (appt) =>
                              isSameDay(appt.start, day) &&
                              appt.start.getHours() === hour
                          )
                          .map((appt) => {
                            // Calcular altura y posición
                            const durationMinutes = differenceInMinutes(
                              appt.end,
                              appt.start
                            );
                            const startMinutes = getMinutes(appt.start);

                            // Si la duración es muy corta (< 30 min), forzamos una altura mínima visual
                            const minHeight = 45;
                            const calculatedHeight =
                              durationMinutes * PIXELS_PER_MINUTE;
                            const finalHeight = Math.max(
                              calculatedHeight,
                              minHeight
                            );

                            return (
                              <div
                                key={appt.id}
                                className="appointment-block"
                                style={{
                                  height: `${finalHeight}px`,
                                  top: `${startMinutes * PIXELS_PER_MINUTE}px`,
                                  zIndex: 10,
                                }}
                                title={`${format(
                                  appt.start,
                                  "HH:mm"
                                )} - ${format(appt.end, "HH:mm")} | Reservado`}
                              >
                                <div className="appt-content-wrapper">
                                  <span className="appt-time-range">
                                    {format(appt.start, "HH:mm")} -{" "}
                                    {format(appt.end, "HH:mm")}
                                  </span>
                                  <span className="appt-label">Reservado</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* VISTA MÓVIL (Lista Vertical por Día) */}
      <div className="calendar-view-mobile">
        {weekDays.map((day, i) => (
          <div
            key={i}
            className={`mobile-day-card ${
              isSameDay(day, new Date()) ? "today" : ""
            }`}
          >
            <div className="mobile-day-header">
              <span className="mobile-day-name">
                {format(day, "EEEE d", { locale: es })}
              </span>
            </div>
            <div className="mobile-day-body">
              {appointments.filter((appt) => isSameDay(appt.start, day))
                .length > 0 ? (
                appointments
                  .filter((appt) => isSameDay(appt.start, day))
                  .sort((a, b) => a.start.getTime() - b.start.getTime())
                  .map((appt) => (
                    <div key={appt.id} className="mobile-appointment-item">
                      <div className="mobile-appt-time">
                        {format(appt.start, "HH:mm")} -{" "}
                        {format(appt.end, "HH:mm")}
                      </div>
                      <div className="mobile-appt-status">Reservado</div>
                    </div>
                  ))
              ) : (
                <div className="mobile-empty-state">Sin citas agendadas</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnamiCalendar;
