import React, { useState, useEffect } from "react";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  getMinutes,
  getHours,
  differenceInMinutes,
  addWeeks,
  subWeeks,
  areIntervalsOverlapping,
  compareAsc,
} from "date-fns";
import { es } from "date-fns/locale";
import { FirebaseAppointmentRepository } from "../../../infrastructure/repositories/FirebaseAppointmentRepository";

import "./AnamiCalendar.css";

const repository = new FirebaseAppointmentRepository();

// Altura de 1 minuto en píxeles
const PIXELS_PER_MINUTE = 80 / 60;

const AnamiCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });

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

  // --- LÓGICA DE FUSIÓN DE CITAS ---
  const getMergedDayAppointments = (day) => {
    // 1. Filtrar citas del día y ordenarlas por hora de inicio
    const dayAppts = appointments
      .filter((appt) => isSameDay(appt.start, day))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    if (dayAppts.length === 0) return [];

    const merged = [];
    let currentBlock = null;

    dayAppts.forEach((appt) => {
      if (!currentBlock) {
        currentBlock = { ...appt, originalIds: [appt.id] };
      } else {
        // Si la cita actual empieza donde termina la anterior (o se solapan), las unimos
        // Usamos un margen de tolerancia de 1 minuto por si acaso
        const gap = differenceInMinutes(appt.start, currentBlock.end);

        if (gap <= 1) {
          // Son contiguas o se solapan
          // Extendemos el final del bloque actual
          // Tomamos el final que sea mayor (por si hay solapamiento total)
          if (appt.end > currentBlock.end) {
            currentBlock.end = appt.end;
          }
          currentBlock.originalIds.push(appt.id);
          // Podríamos concatenar nombres si quisiéramos, pero aquí es "Reservado"
        } else {
          // Hay un hueco, cerramos el bloque anterior y empezamos uno nuevo
          merged.push(currentBlock);
          currentBlock = { ...appt, originalIds: [appt.id] };
        }
      }
    });

    if (currentBlock) {
      merged.push(currentBlock);
    }

    return merged;
  };

  return (
    <div className="anami-calendar">
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

      <div className="calendar-view-desktop">
        <div className="calendar-scroll">
          <div className="calendar-table-container">
            {/* Encabezados */}
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

            {/* Cuerpo */}
            <div className="calendar-body">
              {loading && (
                <div className="loading-overlay">
                  <span>Cargando citas...</span>
                </div>
              )}

              {timeSlots.map((hour) => (
                <div key={hour} className="calendar-grid-row time-row">
                  <div className="time-label">{hour}:00</div>

                  {weekDays.map((day, colIndex) => (
                    <div
                      key={colIndex}
                      className="day-column relative-container"
                    >
                      {/* Renderizamos SOLAMENTE en la primera iteración de la hora para evitar duplicados
                                                En realidad, como usamos posición absoluta basada en minutos desde el inicio del día,
                                                podríamos renderizar todo en un contenedor aparte, pero aquí lo hacemos por columna
                                                y filtramos para renderizar solo una vez por día.
                                            */}

                      {/* Renderizamos los bloques fusionados SOLO en el slot de las 8:00 AM (o el primero)
                                                para que se dibujen sobre toda la columna del día.
                                                Esto evita problemas de z-index entre filas de horas.
                                            */}
                      {hour === 8 &&
                        getMergedDayAppointments(day).map((block) => {
                          // Calcular posición y altura
                          // OJO: getMinutes solo da 0-59. Necesitamos minutos totales desde las 8:00 AM

                          const startHour = getHours(block.start);
                          const startMinutes = getMinutes(block.start);

                          // Minutos desde las 8:00 AM (nuestro inicio de calendario)
                          const minutesFromStart =
                            (startHour - 8) * 60 + startMinutes;

                          // Si la cita empieza antes de las 8, la cortamos visualmente (o ajustamos top negativo si quisiéramos verla)
                          const effectiveTop = Math.max(0, minutesFromStart);

                          const durationMinutes = differenceInMinutes(
                            block.end,
                            block.start
                          );

                          // Altura en px
                          const height = durationMinutes * PIXELS_PER_MINUTE;
                          const top = effectiveTop * PIXELS_PER_MINUTE;

                          // Si termina antes de las 8:00 AM, no se muestra
                          if (minutesFromStart + durationMinutes < 0)
                            return null;

                          return (
                            <div
                              key={block.id || block.originalIds[0]}
                              className="appointment-block merged"
                              style={{
                                height: `${height}px`,
                                top: `${top}px`,
                                zIndex: 10,
                              }}
                              title={`${format(
                                block.start,
                                "HH:mm"
                              )} - ${format(block.end, "HH:mm")} | Reservado`}
                            >
                              <div className="appt-content-wrapper">
                                <span className="appt-time-range">
                                  {format(block.start, "HH:mm")} -{" "}
                                  {format(block.end, "HH:mm")}
                                </span>
                                <span className="appt-label">Reservado</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* VISTA MÓVIL (Sin cambios, lista vertical ya funciona bien) */}
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
