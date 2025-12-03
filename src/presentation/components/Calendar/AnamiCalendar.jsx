import React, { useState, useEffect } from "react";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  addWeeks,
  subWeeks,
} from "date-fns";
import { es } from "date-fns/locale";

// Importamos los estilos CSS normales
import "./AnamiCalendar.css";

import { FirebaseAppointmentRepository } from "../../../infrastructure/repositories/FirebaseAppointmentRepository";
const repository = new FirebaseAppointmentRepository();

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

  return (
    <div className="anami-calendar">
      {/* Header */}
      <div className="calendar-header">
        <h2 className="calendar-title">
          <span>Agenda</span> {format(startDate, "MMMM yyyy", { locale: es })}
        </h2>
        <div className="nav-group">
          <button onClick={prevWeek} className="nav-btn">
            ←
          </button>
          <button onClick={nextWeek} className="nav-btn">
            →
          </button>
        </div>
      </div>

      {/* VISTA DESKTOP (Tabla Scrollable) */}
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
                    const dayAppointments = appointments.filter(
                      (appt) =>
                        isSameDay(appt.start, day) &&
                        appt.start.getHours() === hour
                    );

                    return (
                      <div key={colIndex} className="day-column">
                        {dayAppointments.map((appt) => (
                          <div
                            key={appt.id}
                            className="appointment-chip"
                            title={`${format(appt.start, "HH:mm")} - Reservado`}
                          >
                            <span className="appt-time">
                              {format(appt.start, "HH:mm")}
                            </span>
                            <div className="appt-patient">Reservado</div>
                          </div>
                        ))}
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
              {/* Filtrar citas para este día */}
              {appointments.filter((appt) => isSameDay(appt.start, day))
                .length > 0 ? (
                appointments
                  .filter((appt) => isSameDay(appt.start, day))
                  .sort((a, b) => a.start - b.start)
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
