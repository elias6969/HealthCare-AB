import { useEffect, useMemo, useState } from "react";
import { createAvailability, listMyAvailability, type Availability } from "../../api/availability";

export default function CaregiverAvailability() {
  // Caregiver picks a day + start/end locally.
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const sortedAvailability = useMemo(() => {
    return [...availability].sort((a, b) => a.start.localeCompare(b.start));
  }, [availability]);

  function formatLocalDateTime(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function extractErrorMessage(err: any, fallback: string) {
    const status = err?.response?.status;
    if (status === 401 || status === 403) return "You are not authorized to do this.";
    const data = err?.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (data?.error && typeof data.error === "string") return data.error;
    if (err?.message && typeof err.message === "string") return err.message;
    return fallback;
  }

  async function load() {
    setError("");
    setLoading(true);
    try {
      const data = await listMyAvailability();
      setAvailability(data);
    } catch (err: any) {
      setAvailability([]);
      setError(extractErrorMessage(err, "Failed to load your availability."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(""), 3500);
    return () => window.clearTimeout(t);
  }, [success]);

  async function submit() {
    setSuccess("");
    setError("");

    if (!date || !start || !end) {
      setError("Please fill in date, start time, and end time.");
      return;
    }

    const startLocal = new Date(`${date}T${start}:00`);
    const endLocal = new Date(`${date}T${end}:00`);

    if (Number.isNaN(startLocal.getTime()) || Number.isNaN(endLocal.getTime())) {
      setError("Invalid date/time.");
      return;
    }

    if (endLocal <= startLocal) {
      setError("End time must be after start time.");
      return;
    }

    setSubmitting(true);
    try {
      await createAvailability({ start: startLocal.toISOString(), end: endLocal.toISOString() });
      setSuccess("Availability added.");
      setStart("");
      setEnd("");
      await load();
    } catch (err: any) {
      setError(extractErrorMessage(err, "Could not create availability."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="availability-grid">
      <div className="availability-form">
        <h3 className="availability-subtitle">Add availability</h3>

        <div className="availability-fields">
          <div className="availability-field">
            <label htmlFor="avail-date">Date</label>
            <input id="avail-date" type="date" value={date} onChange={e => setDate(e.target.value)} disabled={submitting} />
          </div>

          <div className="availability-field">
            <label htmlFor="avail-start">Start</label>
            <input id="avail-start" type="time" value={start} onChange={e => setStart(e.target.value)} disabled={submitting} />
          </div>

          <div className="availability-field">
            <label htmlFor="avail-end">End</label>
            <input id="avail-end" type="time" value={end} onChange={e => setEnd(e.target.value)} disabled={submitting} />
          </div>
        </div>

        {success && <div className="availability-alert success">{success}</div>}
        {error && <div className="availability-alert error">{error}</div>}

        <div className="availability-actions">
          <button type="button" className="availability-button" onClick={submit} disabled={submitting || loading}>
            {submitting ? "Saving..." : "Submit availability"}
          </button>
          <button type="button" className="availability-button secondary" onClick={load} disabled={loading || submitting}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="availability-list">
        <h3 className="availability-subtitle">My availability</h3>
        {loading && <div className="availability-empty">Loading availability…</div>}
        {!loading && sortedAvailability.length === 0 && <div className="availability-empty">No availability added yet.</div>}
        {!loading &&
          sortedAvailability.map(a => (
            <div key={a.id} className="availability-item">
              <div className="availability-item-main">
                <div className="availability-item-time">
                  {formatLocalDateTime(a.start)} – {formatLocalDateTime(a.end)}
                </div>
                <div className="availability-item-meta">Availability #{a.id}</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}


