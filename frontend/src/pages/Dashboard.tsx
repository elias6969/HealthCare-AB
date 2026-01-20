import { useAuth, formatRole, normalizeRoleId } from "../auth/AuthContext";
import PatientAppointmentBooking from "../components/appointments/PatientAppointmentBooking";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const roleText = formatRole(user.role);
  const roleId = normalizeRoleId(user.role);
  const isPatient = roleId === 0 || roleText === "Patient";
  const isCaregiver = roleId === 1 || roleText === "Caregiver";

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="welcome-text">Welcome back, {user.email}!</p>
      </div>

      <div className="dashboard-content">
        {/* Stats Overview */}
        <div className="stats-grid">
          {isPatient && (
            <>
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <div className="stat-value">3</div>
                  <div className="stat-label">Upcoming Appointments</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-value">12</div>
                  <div className="stat-label">Completed Visits</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👨‍⚕️</div>
                <div className="stat-content">
                  <div className="stat-value">2</div>
                  <div className="stat-label">Active Providers</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📋</div>
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
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <div className="stat-value">8</div>
                  <div className="stat-label">Today's Appointments</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏰</div>
                <div className="stat-content">
                  <div className="stat-value">24</div>
                  <div className="stat-label">This Week</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-value">45</div>
                  <div className="stat-label">Total Patients</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
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
                <button className="action-button" type="button">
                  <span className="action-icon">➕</span>
                  <span>Book New Appointment</span>
                </button>
                <button className="action-button" type="button">
                  <span className="action-icon">📋</span>
                  <span>View Appointments</span>
                </button>
                <button className="action-button" type="button">
                  <span className="action-icon">💊</span>
                  <span>My Prescriptions</span>
                </button>
                <button className="action-button" type="button">
                  <span className="action-icon">📄</span>
                  <span>Medical Records</span>
                </button>
              </>
            )}

            {isCaregiver && (
              <>
                <button className="action-button" type="button">
                  <span className="action-icon">📅</span>
                  <span>Set Availability</span>
                </button>
                <button className="action-button" type="button">
                  <span className="action-icon">👥</span>
                  <span>View Patients</span>
                </button>
                <button className="action-button" type="button">
                  <span className="action-icon">📊</span>
                  <span>View Schedule</span>
                </button>
                <button className="action-button" type="button">
                  <span className="action-icon">⚙️</span>
                  <span>Manage Profile</span>
                </button>
              </>
            )}
          </div>
        </div>

        {isPatient && (
          <div className="dashboard-section">
            <PatientAppointmentBooking />
          </div>
        )}

        {/* Upcoming Appointments / Today's Schedule */}
        <div className="dashboard-section">
          <h2>{isPatient ? "Upcoming Appointments" : "Today's Schedule"}</h2>
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
                <div className="appointment-item">
                  <div className="appointment-time">09:00</div>
                  <div className="appointment-details">
                    <div className="appointment-title">Patient: John Smith</div>
                    <div className="appointment-info">
                      <span>General Checkup</span>
                      <span>•</span>
                      <span>Room 204</span>
                    </div>
                  </div>
                  <div className="appointment-status status-confirmed">Confirmed</div>
                </div>
                <div className="appointment-item">
                  <div className="appointment-time">10:30</div>
                  <div className="appointment-details">
                    <div className="appointment-title">Patient: Emma Wilson</div>
                    <div className="appointment-info">
                      <span>Follow-up Consultation</span>
                      <span>•</span>
                      <span>Room 204</span>
                    </div>
                  </div>
                  <div className="appointment-status status-confirmed">Confirmed</div>
                </div>
                <div className="appointment-item">
                  <div className="appointment-time">14:00</div>
                  <div className="appointment-details">
                    <div className="appointment-title">Patient: Robert Brown</div>
                    <div className="appointment-info">
                      <span>Lab Results Review</span>
                      <span>•</span>
                      <span>Room 204</span>
                    </div>
                  </div>
                  <div className="appointment-status status-confirmed">Confirmed</div>
                </div>
                <div className="appointment-item">
                  <div className="appointment-time">15:30</div>
                  <div className="appointment-details">
                    <div className="appointment-title">Patient: Lisa Anderson</div>
                    <div className="appointment-info">
                      <span>Initial Consultation</span>
                      <span>•</span>
                      <span>Room 204</span>
                    </div>
                  </div>
                  <div className="appointment-status status-pending">Pending</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity / Notifications */}
        <div className="dashboard-section">
          <h2>{isPatient ? "Recent Activity" : "Notifications"}</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">📧</div>
              <div className="activity-content">
                <div className="activity-title">Appointment Reminder</div>
                <div className="activity-time">2 hours ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">✅</div>
              <div className="activity-content">
                <div className="activity-title">Appointment Confirmed</div>
                <div className="activity-time">Yesterday</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📄</div>
              <div className="activity-content">
                <div className="activity-title">New Test Results Available</div>
                <div className="activity-time">2 days ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">💊</div>
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