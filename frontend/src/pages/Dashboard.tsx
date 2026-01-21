import { useEffect, useState } from "react";
import { useAuth, formatRole, normalizeRoleId } from "../auth/AuthContext";
import PatientAppointmentBooking from "../components/appointments/PatientAppointmentBooking";
import Modal from "../components/ui/Modal";
import CaregiverAvailability from "../components/availability/CaregiverAvailability";
import {
  caregiverRescheduleAppointment,
  listMyCaregiverAppointments,
  type Appointment,
} from "../api/appointments";
import {
  CalendarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardIcon,
  ClockIcon,
  CogIcon,
  FileIcon,
  MailIcon,
  PillIcon,
  PlusIcon,
  UsersIcon,
} from "../components/ui/Icons";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const roleText = formatRole(user.role);
  const roleId = normalizeRoleId(user.role);
  const isPatient = roleId === 0 || roleText === "Patient";
  const isCaregiver = roleId === 1 || roleText === "Caregiver";
  const [bookingOpen, setBookingOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [dashboardToast, setDashboardToast] = useState<string>("");

  // Caregiver: real appointments list + reschedule state
  const [caregiverAppointments, setCaregiverAppointments] = useState<Appointment[]>([]);
  const [caregiverLoading, setCaregiverLoading] = useState(false);
  const [caregiverError, setCaregiverError] = useState("");
  const [rescheduleOpenFor, setRescheduleOpenFor] = useState<number | null>(null);
  const [rescheduleStart, setRescheduleStart] = useState("");
  const [rescheduleEnd, setRescheduleEnd] = useState("");
  const [rescheduleSaving, setRescheduleSaving] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");

  useEffect(() => {
    if (!dashboardToast) return;
    const t = window.setTimeout(() => setDashboardToast(""), 4000);
    return () => window.clearTimeout(t);
  }, [dashboardToast]);

  function extractErrorMessage(err: any, fallback: string) {
    const status = err?.response?.status;
    if (status === 401 || status === 403) return "You are not authorized. Please log in again.";
    const data = err?.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (data?.error && typeof data.error === "string") return data.error;
    if (err?.message && typeof err.message === "string") return err.message;
    return fallback;
  }

  function formatLocalTime(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  function formatDayMonth(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return { day: "?", month: "?" };
    const day = String(d.getDate());
    const month = d.toLocaleString(undefined, { month: "short" });
    return { day, month };
  }

  function isoToLocalDateTimeInput(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  function displayPatientLabel(a: Appointment) {
    const p: any = (a as any).patient;
    const id = p?.id ?? a.patientId;
    const full = `${(p?.firstName ?? "").trim()} ${(p?.lastName ?? "").trim()}`.trim();
    if (full) return full;
    if (p?.email) return p.email;
    return `Patient #${id}`;
  }

  async function loadCaregiverAppointments() {
    if (!isCaregiver) return;
    setCaregiverError("");
    setCaregiverLoading(true);
    try {
      const data = await listMyCaregiverAppointments();
      setCaregiverAppointments(data ?? []);
    } catch (err: any) {
      setCaregiverAppointments([]);
      setCaregiverError(extractErrorMessage(err, "Failed to load caregiver appointments."));
    } finally {
      setCaregiverLoading(false);
    }
  }

  useEffect(() => {
    if (!isCaregiver) return;
    loadCaregiverAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCaregiver]);

  const upcomingCaregiverAppointments = isCaregiver
    ? caregiverAppointments
        .filter(a => {
          const t = new Date(a.start).getTime();
          return !Number.isNaN(t) && t >= Date.now();
        })
        .sort((a, b) => a.start.localeCompare(b.start))
    : [];

  function openReschedule(a: Appointment) {
    setRescheduleError("");
    setRescheduleOpenFor(a.id);
    setRescheduleStart(isoToLocalDateTimeInput(a.start));
    setRescheduleEnd(isoToLocalDateTimeInput(a.end));
  }

  async function saveReschedule(appointmentId: number) {
    setRescheduleError("");

    if (!rescheduleStart || !rescheduleEnd) {
      setRescheduleError("Please select both start and end.");
      return;
    }

    const startLocal = new Date(rescheduleStart);
    const endLocal = new Date(rescheduleEnd);
    if (Number.isNaN(startLocal.getTime()) || Number.isNaN(endLocal.getTime())) {
      setRescheduleError("Invalid date/time.");
      return;
    }
    if (endLocal <= startLocal) {
      setRescheduleError("End must be after start.");
      return;
    }

    setRescheduleSaving(true);
    try {
      await caregiverRescheduleAppointment(appointmentId, {
        newStart: startLocal.toISOString(),
        newEnd: endLocal.toISOString(),
      });
      setDashboardToast("Appointment rescheduled successfully.");
      setRescheduleOpenFor(null);
      await loadCaregiverAppointments();
    } catch (err: any) {
      setRescheduleError(extractErrorMessage(err, "Failed to reschedule appointment."));
    } finally {
      setRescheduleSaving(false);
    }
  }

  const displayName =
    user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="welcome-text">Welcome back, {displayName}!</p>
      </div>

      <div className="dashboard-content">
        {dashboardToast && <div className="dashboard-alert">{dashboardToast}</div>}
        {/* Stats Overview */}
        <div className="stats-grid">
          {isPatient && (
            <>
              <div className="stat-card">
                <div className="stat-icon">
                  <CalendarIcon />
                </div>
                <div className="stat-content">
                  <div className="stat-value">3</div>
                  <div className="stat-label">Upcoming Appointments</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <CheckCircleIcon />
                </div>
                <div className="stat-content">
                  <div className="stat-value">12</div>
                  <div className="stat-label">Completed Visits</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <UsersIcon />
                </div>
                <div className="stat-content">
                  <div className="stat-value">2</div>
                  <div className="stat-label">Active Providers</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <ClipboardIcon />
                </div>
                <div className="stat-content">
                  <div className="stat-value">5</div>
                  <div className="stat-label">Pending Requests</div>
                </div>
              </div>
            </>
          )}

          {isCaregiver && (
            <>
              <div className="stat-card">
                <div className="stat-icon">
                  <CalendarIcon />
                </div>
                <div className="stat-content">
                  <div className="stat-value">8</div>
                  <div className="stat-label">Today's Appointments</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <ClockIcon />
                </div>
                <div className="stat-content">
                  <div className="stat-value">24</div>
                  <div className="stat-label">This Week</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <UsersIcon />
                </div>
                <div className="stat-content">
                  <div className="stat-value">45</div>
                  <div className="stat-label">Total Patients</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <ChartBarIcon />
                </div>
                <div className="stat-content">
                  <div className="stat-value">92%</div>
                  <div className="stat-label">Availability</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            {isPatient && (
              <>
                <button className="action-button" type="button" onClick={() => setBookingOpen(true)}>
                  <span className="action-icon">
                    <PlusIcon />
                  </span>
                  <span>Book New Appointment</span>
                </button>
                <button className="action-button" type="button">
                  <span className="action-icon">
                    <ClipboardIcon />
                  </span>
                  <span>View Appointments</span>
                </button>
                <button className="action-button" type="button">
                  <span className="action-icon">
                    <PillIcon />
                  </span>
                  <span>My Prescriptions</span>
                </button>
                <button className="action-button" type="button">
                  <span className="action-icon">
                    <FileIcon />
                  </span>
                  <span>Medical Records</span>
                </button>
              </>
            )}

            {isCaregiver && (
              <>
                <button className="action-button" type="button" onClick={() => setAvailabilityOpen(true)}>
                  <span className="action-icon">
                    <CalendarIcon />
                  </span>
                  <span>Set Availability</span>
                </button>
                <button className="action-button" type="button">
                  <span className="action-icon">
                    <UsersIcon />
                  </span>
                  <span>View Patients</span>
                </button>
                <button className="action-button" type="button">
                  <span className="action-icon">
                    <ChartBarIcon />
                  </span>
                  <span>View Schedule</span>
                </button>
                <button className="action-button" type="button">
                  <span className="action-icon">
                    <CogIcon />
                  </span>
                  <span>Manage Profile</span>
                </button>
              </>
            )}
          </div>
        </div>

        {isPatient && (
          <Modal open={bookingOpen} title="Book appointment" onClose={() => setBookingOpen(false)}>
            <PatientAppointmentBooking
              onBooked={() => setDashboardToast("Appointment booked successfully.")}
              onRequestClose={() => setBookingOpen(false)}
            />
          </Modal>
        )}

        {isCaregiver && (
          <Modal open={availabilityOpen} title="Set availability" onClose={() => setAvailabilityOpen(false)}>
            <CaregiverAvailability />
          </Modal>
        )}

        {/* Upcoming Appointments / Today's Schedule */}
        <div className="dashboard-section">
          <h2>{isPatient ? "Upcoming Appointments" : "Upcoming Appointments"}</h2>
          <div className="appointments-list">
            {isPatient ? (
              <>
                <div className="appointment-item">
                  <div className="appointment-date">
                    <div className="date-day">15</div>
                    <div className="date-month">Dec</div>
                  </div>
                  <div className="appointment-details">
                    <div className="appointment-title">General Checkup</div>
                    <div className="appointment-info">
                      <span>Dr. Sarah Johnson</span>
                      <span>•</span>
                      <span>10:00 AM</span>
                      <span>•</span>
                      <span>Room 204</span>
                    </div>
                  </div>
                  <div className="appointment-status status-confirmed">Confirmed</div>
                </div>
                <div className="appointment-item">
                  <div className="appointment-date">
                    <div className="date-day">18</div>
                    <div className="date-month">Dec</div>
                  </div>
                  <div className="appointment-details">
                    <div className="appointment-title">Follow-up Consultation</div>
                    <div className="appointment-info">
                      <span>Dr. Michael Chen</span>
                      <span>•</span>
                      <span>2:30 PM</span>
                      <span>•</span>
                      <span>Room 312</span>
                    </div>
                  </div>
                  <div className="appointment-status status-confirmed">Confirmed</div>
                </div>
                <div className="appointment-item">
                  <div className="appointment-date">
                    <div className="date-day">22</div>
                    <div className="date-month">Dec</div>
                  </div>
                  <div className="appointment-details">
                    <div className="appointment-title">Lab Results Review</div>
                    <div className="appointment-info">
                      <span>Dr. Sarah Johnson</span>
                      <span>•</span>
                      <span>11:15 AM</span>
                      <span>•</span>
                      <span>Room 204</span>
                    </div>
                  </div>
                  <div className="appointment-status status-pending">Pending</div>
                </div>
              </>
            ) : (
              <>
                <div className="dashboard-inline-actions">
                  <button
                    className="dashboard-mini-button secondary"
                    type="button"
                    onClick={loadCaregiverAppointments}
                    disabled={caregiverLoading || rescheduleSaving}
                  >
                    {caregiverLoading ? "Loading..." : "Refresh"}
                  </button>
                </div>

                {caregiverError && <div className="dashboard-inline-error">{caregiverError}</div>}

                {!caregiverLoading && !caregiverError && upcomingCaregiverAppointments.length === 0 && (
                  <div className="dashboard-empty">No upcoming appointments.</div>
                )}

                {upcomingCaregiverAppointments.slice(0, 20).map(a => {
                  const { day, month } = formatDayMonth(a.start);
                  const isOpen = rescheduleOpenFor === a.id;
                  return (
                    <div key={a.id} className="appointment-item">
                      <div className="appointment-date" aria-hidden="true">
                        <div className="date-day">{day}</div>
                        <div className="date-month">{month}</div>
                      </div>

                      <div className="appointment-details">
                        <div className="appointment-title">{displayPatientLabel(a)}</div>
                        <div className="appointment-info">
                          <span>
                            {formatLocalTime(a.start)} – {formatLocalTime(a.end)}
                          </span>
                          <span>•</span>
                          <span>Appointment #{a.id}</span>
                        </div>

                        <div className="dashboard-appointment-actions">
                          {!isOpen ? (
                            <button
                              className="dashboard-mini-button"
                              type="button"
                              onClick={() => openReschedule(a)}
                              disabled={rescheduleSaving}
                            >
                              Reschedule
                            </button>
                          ) : (
                            <div className="dashboard-reschedule">
                              <div className="dashboard-reschedule-inputs">
                                <label className="dashboard-reschedule-label">
                                  Start
                                  <input
                                    className="dashboard-reschedule-input"
                                    type="datetime-local"
                                    value={rescheduleStart}
                                    onChange={e => setRescheduleStart(e.target.value)}
                                    disabled={rescheduleSaving}
                                  />
                                </label>
                                <label className="dashboard-reschedule-label">
                                  End
                                  <input
                                    className="dashboard-reschedule-input"
                                    type="datetime-local"
                                    value={rescheduleEnd}
                                    onChange={e => setRescheduleEnd(e.target.value)}
                                    disabled={rescheduleSaving}
                                  />
                                </label>
                              </div>

                              {rescheduleError && <div className="dashboard-inline-error">{rescheduleError}</div>}

                              <div className="dashboard-reschedule-actions">
                                <button
                                  className="dashboard-mini-button secondary"
                                  type="button"
                                  onClick={() => setRescheduleOpenFor(null)}
                                  disabled={rescheduleSaving}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="dashboard-mini-button"
                                  type="button"
                                  onClick={() => saveReschedule(a.id)}
                                  disabled={rescheduleSaving}
                                >
                                  {rescheduleSaving ? "Saving..." : "Save"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="appointment-status status-confirmed">Upcoming</div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Recent Activity / Notifications */}
        <div className="dashboard-section">
          <h2>{isPatient ? "Recent Activity" : "Notifications"}</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">
                <MailIcon />
              </div>
              <div className="activity-content">
                <div className="activity-title">Appointment Reminder</div>
                <div className="activity-time">2 hours ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">
                <CheckCircleIcon />
              </div>
              <div className="activity-content">
                <div className="activity-title">Appointment Confirmed</div>
                <div className="activity-time">Yesterday</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">
                <FileIcon />
              </div>
              <div className="activity-content">
                <div className="activity-title">New Test Results Available</div>
                <div className="activity-time">2 days ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">
                <PillIcon />
              </div>
              <div className="activity-content">
                <div className="activity-title">Prescription Renewal</div>
                <div className="activity-time">3 days ago</div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="dashboard-section">
          <h2>Account Information</h2>
          <div className="info-card">
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Role:</span>
              <span className="info-value">{roleText}</span>
            </div>
            <div className="info-row">
              <span className="info-label">User ID:</span>
              <span className="info-value">#{user.id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Member Since:</span>
              <span className="info-value">December 2024</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}