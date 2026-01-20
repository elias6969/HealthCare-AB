import { useState } from "react";
import { registerPatient, registerCaregiver } from "../api/users";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";

export default function Register() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"patient" | "caregiver">("patient");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name");
      return;
    }

    setLoading(true);

    try {
      if (role === "patient") {
        await registerPatient({ email, password, firstName: firstName.trim(), lastName: lastName.trim() });
      } else {
        await registerCaregiver({ email, password, firstName: firstName.trim(), lastName: lastName.trim() });
      }
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      let message = "Registration failed";
      if (err?.response?.status === 409) {
        message = err?.response?.data || "Email is already registered";
      } else if (err?.response?.data) {
        message = typeof err.response.data === "string" 
          ? err.response.data 
          : "Registration failed. Please try again.";
      } else if (err?.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit}>
        <h2>Create Account</h2>
        <p className="subtitle">Sign up to get started with Healthcare AB</p>

        <div className="form-group">
          <label htmlFor="role">I am a</label>
          <select
            id="role"
            value={role}
            onChange={e => setRole(e.target.value as "patient" | "caregiver")}
            disabled={loading}
          >
            <option value="patient">Patient</option>
            <option value="caregiver">Caregiver</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="firstName">First name</label>
          <input
            id="firstName"
            type="text"
            placeholder="Enter your first name"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            required
            disabled={loading}
            autoComplete="given-name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last name</label>
          <input
            id="lastName"
            type="text"
            placeholder="Enter your last name"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            required
            disabled={loading}
            autoComplete="family-name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Create a password (min. 8 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Account created successfully! Redirecting to login...</div>}

        <button type="submit" disabled={loading || success} className="primary-button">
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
