import { useState } from "react";
import { deleteAccount } from "../api/users";
import { useAuth, formatRole } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import "./DeleteAccount.css";

export default function DeleteAccount() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const confirmTextRequired = "DELETE";
  const isConfirmed = confirmText === confirmTextRequired;

  async function handleDelete() {
    if (!user) return;
    if (!isConfirmed) {
      setError(`Please type "${confirmTextRequired}" to confirm`);
      return;
    }

    setError("");
    setLoading(true);

    try {
      await deleteAccount(user.id);
      logout();
      navigate("/login");
    } catch (err: any) {
      let message = "Failed to delete account";
      if (err?.response?.data) {
        message = typeof err.response.data === "string" 
          ? err.response.data 
          : "Failed to delete account. Please try again.";
      } else if (err?.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="account-settings">
      <div className="account-settings-header">
        <h1>Account Settings</h1>
        <p className="subtitle">Manage your account information and preferences</p>
      </div>

      <div className="account-settings-content">
        {/* Account Information Section */}
        <div className="settings-section">
          <h2>Account Information</h2>
          <div className="settings-card">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Email Address</span>
                <span className="info-value">{user.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Account Role</span>
                <span className="info-value">{formatRole(user.role)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">User ID</span>
                <span className="info-value">#{user.id}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Member Since</span>
                <span className="info-value">December 2024</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="settings-section">
          <h2>Security</h2>
          <div className="settings-card">
            <div className="security-item">
              <div className="security-info">
                <h3>Password</h3>
                <p>Last changed: 2 weeks ago</p>
              </div>
              <button className="secondary-button">Change Password</button>
            </div>
            <div className="security-item">
              <div className="security-info">
                <h3>Two-Factor Authentication</h3>
                <p>Add an extra layer of security to your account</p>
              </div>
              <button className="secondary-button">Enable 2FA</button>
            </div>
            <div className="security-item">
              <div className="security-info">
                <h3>Active Sessions</h3>
                <p>Manage devices where you're currently signed in</p>
              </div>
              <button className="secondary-button">View Sessions</button>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="settings-section">
          <h2>Preferences</h2>
          <div className="settings-card">
            <div className="preference-item">
              <div className="preference-info">
                <h3>Email Notifications</h3>
                <p>Receive email updates about appointments and account activity</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="preference-item">
              <div className="preference-info">
                <h3>SMS Notifications</h3>
                <p>Receive text message reminders for appointments</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="preference-item">
              <div className="preference-info">
                <h3>Appointment Reminders</h3>
                <p>Get notified 24 hours before your appointments</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="settings-section danger-zone">
          <h2>Danger Zone</h2>
          <div className="settings-card danger-card">
            <div className="warning-card">
              <h3>⚠️ Delete Account</h3>
              <p>Once you delete your account, there is no going back. Please be certain.</p>
            </div>

            <div className="confirmation-section">
              <label htmlFor="confirm-delete">
                To confirm, please type <strong>{confirmTextRequired}</strong> in the box below:
              </label>
              <input
                id="confirm-delete"
                type="text"
                value={confirmText}
                onChange={e => {
                  setConfirmText(e.target.value);
                  setError("");
                }}
                placeholder={confirmTextRequired}
                disabled={loading}
                className="confirm-input"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              onClick={handleDelete}
              disabled={!isConfirmed || loading}
              className="delete-button"
            >
              {loading ? "Deleting account..." : "Permanently Delete My Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
