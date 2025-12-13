import { useState, useEffect } from "react";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  getHours,
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
        console.log({ data });
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

    // Lunes (1): 14:00 - 19:00
    if (dayIndex === 1 && hour >= 14 && hour < 19) return true;

    // Martes (2): 19:00 - 23:00
    if (dayIndex === 2 && hour >= 19 && hour < 23) return true;

    // Sábado (6): 14:00 - 19:00
    if (dayIndex === 6 && hour >= 14 && hour < 19) return true;

    return false;
  };

  const getMergedDayAppointments = (day) => {
    // 1. Filtrar citas del día y ordenarlas estrictamente por hora de inicio
    const dayAppts = appointments
      .filter((appt) => isSameDay(appt.start, day))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    if (dayAppts.length === 0) return [];

    const merged = [];
    let currentBlock = null;

    dayAppts.forEach((appt) => {
      if (!currentBlock) {
        // Iniciamos el primer bloque asegurando objetos Date
        currentBlock = {
          ...appt,
          originalIds: [appt.id],
          start: new Date(appt.start),
          end: new Date(appt.end),
        };
      } else {
        // Calculamos la diferencia en minutos entre el inicio de la actual y el final del bloque
        const gap = differenceInMinutes(appt.start, currentBlock.end);

        // Si la diferencia es <= 1 minuto (contiguas) O se solapan (gap negativo)
        if (gap <= 1) {
          // Extendemos el final del bloque actual si la nueva cita termina después
          if (new Date(appt.end) > currentBlock.end) {
            currentBlock.end = new Date(appt.end);
          }
          currentBlock.originalIds.push(appt.id);
        } else {
          // No son contiguas, guardamos el bloque anterior y empezamos uno nuevo
          merged.push(currentBlock);
          currentBlock = {
            ...appt,
            originalIds: [appt.id],
            start: new Date(appt.start),
            end: new Date(appt.end),
          };
        }
      }
    });

    // Añadir el último bloque procesado
    if (currentBlock) {
      merged.push(currentBlock);
    }

    return merged;
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

      {/* VISTA DESKTOP */}
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

                    // Estilo de fondo condicional para la celda
                    const bgStyle = isHotel
                      ? { backgroundColor: "#daecfcff" }
                      : {};

                    // RETORNAMOS EL DIV DE LA COLUMNA (ESTO FALTABA)
                    return (
                      <div
                        key={colIndex}
                        className="day-column relative-container"
                        style={bgStyle}
                        title={isHotel ? "Horario Hotel" : ""}
                      >
                        {/* Renderizamos las tarjetas SOLO cuando hour es 8 (inicio del día visual)
                           para que se dibujen "flotando" sobre toda la columna del día
                           usando posición absoluta.
                        */}
                        {hour === 8 &&
                          getMergedDayAppointments(day).map((block) => {
                            const startHour = getHours(block.start);
                            const startMinutes = getMinutes(block.start);

                            // Calcular minutos totales desde las 8:00 AM
                            const minutesFromStart =
                              (startHour - 8) * 60 + startMinutes;

                            // Posición top (no permitir negativo si empieza antes de las 8am)
                            const effectiveTop = Math.max(0, minutesFromStart);

                            const durationMinutes = differenceInMinutes(
                              block.end,
                              block.start
                            );

                            // Cálculos de estilo
                            const height = durationMinutes * PIXELS_PER_MINUTE;
                            const top = effectiveTop * PIXELS_PER_MINUTE;

                            // Si termina antes de las 8:00 AM, no renderizar
                            if (minutesFromStart + durationMinutes < 0)
                              return null;

                            return (
                              <div
                                key={block.originalIds.join("-")}
                                className="appointment-block merged"
                                style={{
                                  height: `${height}px`,
                                  top: `${top}px`,
                                  zIndex: 10,
                                }}
                                title={`${format(
                                  block.start,
                                  "HH:mm"
                                )} - ${format(block.end, "HH:mm")} (${
                                  block.originalIds.length
                                } reservas)`}
                              >
                                <div className="appt-content-wrapper">
                                  <span className="appt-time-range">
                                    {format(block.start, "HH:mm")} -{" "}
                                    {format(block.end, "HH:mm")}
                                  </span>
                                  {durationMinutes >= 31 && (
                                    <span className="appt-label">
                                      {block.originalIds.length > 1
                                        ? "Reservado"
                                        : "Reservado"}
                                    </span>
                                  )}
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

      {/* VISTA MÓVIL */}
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
