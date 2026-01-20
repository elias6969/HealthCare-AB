import { useEffect, useMemo, useRef, useState } from "react";
import {
  bookAppointment,
  listAvailableAppointmentSlots,
  type AvailableAppointmentSlot,
} from "../../api/appointments";
import "./patientAppointmentBooking.css";

type Toast = { kind: "success" | "error"; message: string };

type SavedCaregiver = { id: number; label?: string };

const SAVED_CAREGIVERS_KEY = "savedCaregivers";

function loadSavedCaregivers(): SavedCaregiver[] {
  try {
    const raw = localStorage.getItem(SAVED_CAREGIVERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x: any) => ({
        id: Number(x?.id),
        label: typeof x?.label === "string" ? x.label : undefined,
      }))
      .filter(x => Number.isFinite(x.id) && x.id > 0);
  } catch {
    return [];
  }
}

function saveSavedCaregivers(list: SavedCaregiver[]) {
  localStorage.setItem(SAVED_CAREGIVERS_KEY, JSON.stringify(list));
}

function slotKey(s: AvailableAppointmentSlot) {
  return `${s.caregiverId}:${s.start}:${s.end}`;
}

function extractErrorMessage(err: any, fallback: string) {
  const status = err?.response?.status;
  if (status === 401 || status === 403) return "You are not authorized. Please log in again.";

  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data?.error && typeof data.error === "string") return data.error;
  if (err?.message && typeof err.message === "string") return err.message;

  return fallback;
}

function toLocalDateKey(isoUtc: string) {
  const d = new Date(isoUtc);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  // YYYY-MM-DD in local time
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatLocalDateHeading(dateKey: string) {
  const d = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "2-digit" });
}

function formatLocalTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function calcDurationMinutes(startIso: string, endIso: string) {
  const s = new Date(startIso).getTime();
  const e = new Date(endIso).getTime();
  if (Number.isNaN(s) || Number.isNaN(e)) return null;
  const mins = Math.round((e - s) / 60000);
  return mins > 0 ? mins : null;
}

export default function PatientAppointmentBooking() {
  const [savedCaregivers, setSavedCaregivers] = useState<SavedCaregiver[]>(() => loadSavedCaregivers());
  const [selectedCaregiverId, setSelectedCaregiverId] = useState<number | null>(
    savedCaregivers.length ? savedCaregivers[0]!.id : null
  );
  const [caregiverIdInput, setCaregiverIdInput] = useState("");
  const [caregiverLabelInput, setCaregiverLabelInput] = useState("");

  const caregiverId = useMemo(() => {
    if (selectedCaregiverId) return selectedCaregiverId;
    const n = Number(caregiverIdInput);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [selectedCaregiverId, caregiverIdInput]);

  const [dateFilter, setDateFilter] = useState<"all" | string>("all"); // local YYYY-MM-DD
  const [slots, setSlots] = useState<AvailableAppointmentSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string>("");

  const [bookingKey, setBookingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const toastTimer = useRef<number | null>(null);
  function showToast(next: Toast) {
    setToast(next);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4500);
  }

  const grouped = useMemo(() => {
    const map = new Map<string, AvailableAppointmentSlot[]>();
    for (const s of slots) {
      const key = toLocalDateKey(s.start);
      if (dateFilter !== "all" && key !== dateFilter) continue;
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    // sort days asc, slots asc
    const days = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    for (const [, arr] of days) {
      arr.sort((x, y) => x.start.localeCompare(y.start));
    }
    return days;
  }, [slots, dateFilter]);

  const availableDateKeys = useMemo(() => {
    const set = new Set<string>();
    for (const s of slots) set.add(toLocalDateKey(s.start));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [slots]);

  const loadAbortRef = useRef<AbortController | null>(null);

  async function loadSlots(nextCaregiverId: number) {
    setSlotsError("");
    setSlotsLoading(true);
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    try {
      const data = await listAvailableAppointmentSlots(nextCaregiverId);
      if (controller.signal.aborted) return;
      setSlots(data);
      // If a date is selected, keep it only if it's still present.
      setDateFilter(prev => {
        if (prev === "all") return prev;
        const exists = data.some(s => toLocalDateKey(s.start) === prev);
        return exists ? prev : "all";
      });
    } catch (err: any) {
      if (controller.signal.aborted) return;
      setSlots([]);
      setSlotsError(extractErrorMessage(err, "Failed to load available slots."));
    } finally {
      if (!controller.signal.aborted) setSlotsLoading(false);
    }
  }

  // Auto-load when caregiver changes (debounced lightly)
  useEffect(() => {
    if (!caregiverId) {
      setSlots([]);
      setSlotsError("");
      return;
    }
    const t = window.setTimeout(() => loadSlots(caregiverId), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caregiverId]);

  useEffect(() => {
    return () => {
      loadAbortRef.current?.abort();
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  function onSelectSaved(value: string) {
    if (value === "custom") {
      setSelectedCaregiverId(null);
      return;
    }
    const id = Number(value);
    if (Number.isFinite(id) && id > 0) {
      setSelectedCaregiverId(id);
      setCaregiverIdInput("");
    }
  }

  function addSavedCaregiver() {
    const id = caregiverId ?? Number(caregiverIdInput);
    if (!Number.isFinite(id) || id <= 0) {
      showToast({ kind: "error", message: "Enter a valid caregiver ID to save." });
      return;
    }
    const next: SavedCaregiver = { id, label: caregiverLabelInput.trim() || undefined };
    const merged = [next, ...savedCaregivers.filter(c => c.id !== id)].slice(0, 10);
    setSavedCaregivers(merged);
    saveSavedCaregivers(merged);
    setSelectedCaregiverId(id);
    setCaregiverIdInput("");
    setCaregiverLabelInput("");
    showToast({ kind: "success", message: "Saved caregiver." });
  }

  function removeSavedCaregiver(id: number) {
    const merged = savedCaregivers.filter(c => c.id !== id);
    setSavedCaregivers(merged);
    saveSavedCaregivers(merged);
    if (selectedCaregiverId === id) setSelectedCaregiverId(merged.length ? merged[0]!.id : null);
    showToast({ kind: "success", message: "Removed saved caregiver." });
  }

  async function handleBook(slot: AvailableAppointmentSlot) {
    const key = slotKey(slot);
    if (bookingKey) return;

    const ok = window.confirm(
      `Book appointment with caregiver #${slot.caregiverId} on ${formatLocalDateHeading(
        toLocalDateKey(slot.start)
      )} from ${formatLocalTime(slot.start)} to ${formatLocalTime(slot.end)}?`
    );
    if (!ok) return;

    setBookingKey(key);
    try {
      await bookAppointment({ caregiverId: slot.caregiverId, start: slot.start, end: slot.end });
      showToast({ kind: "success", message: "Appointment booked successfully." });

      // Remove immediately, then re-sync.
      setSlots(prev => prev.filter(s => slotKey(s) !== key));
      if (caregiverId) await loadSlots(caregiverId);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = extractErrorMessage(err, "Booking failed. Please try again.");
      showToast({ kind: "error", message: msg });

      // Conflicts: re-sync to reflect latest availability.
      if (status === 409 && caregiverId) {
        await loadSlots(caregiverId);
      }
    } finally {
      setBookingKey(null);
    }
  }

  return (
    <section className="booking">
      <div className="booking-header">
        <h2>Book an Appointment</h2>
        <div className="booking-subtitle">Times are shown in your local timezone.</div>
      </div>

      {toast && (
        <div className={`booking-toast ${toast.kind}`} role="status" aria-live="polite">
          <div className="booking-toast-message">{toast.message}</div>
          <button className="booking-toast-close" type="button" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}

      <div className="booking-panel">
        <div className="booking-row">
          <div className="booking-field">
            <label className="booking-label" htmlFor="savedCaregiver">
              Caregiver
            </label>
            <select
              id="savedCaregiver"
              className="booking-select"
              value={selectedCaregiverId ?? "custom"}
              onChange={e => onSelectSaved(e.target.value)}
              disabled={slotsLoading || bookingKey !== null}
            >
              {savedCaregivers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.label ? `${c.label} (#${c.id})` : `Caregiver #${c.id}`}
                </option>
              ))}
              <option value="custom">Enter a caregiver ID…</option>
            </select>
          </div>

          {selectedCaregiverId !== null && (
            <div className="booking-inline-actions">
              <button
                className="booking-link-button"
                type="button"
                onClick={() => removeSavedCaregiver(selectedCaregiverId)}
                disabled={slotsLoading || bookingKey !== null}
              >
                Remove saved
              </button>
            </div>
          )}
        </div>

        {selectedCaregiverId === null && (
          <div className="booking-row">
            <div className="booking-field">
              <label className="booking-label" htmlFor="caregiverId">
                Caregiver ID
              </label>
              <input
                id="caregiverId"
                className="booking-input"
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="e.g. 7"
                value={caregiverIdInput}
                onChange={e => setCaregiverIdInput(e.target.value)}
                disabled={slotsLoading || bookingKey !== null}
              />
            </div>

            <div className="booking-field">
              <label className="booking-label" htmlFor="caregiverLabel">
                Label (optional)
              </label>
              <input
                id="caregiverLabel"
                className="booking-input"
                type="text"
                placeholder="e.g. Dr. Chen"
                value={caregiverLabelInput}
                onChange={e => setCaregiverLabelInput(e.target.value)}
                disabled={slotsLoading || bookingKey !== null}
              />
            </div>

            <div className="booking-inline-actions">
              <button
                className="booking-button"
                type="button"
                onClick={addSavedCaregiver}
                disabled={!caregiverId || slotsLoading || bookingKey !== null}
              >
                Save caregiver
              </button>
            </div>
          </div>
        )}

        <div className="booking-row booking-row-tight">
          <div className="booking-field">
            <label className="booking-label" htmlFor="dateFilter">
              Date
            </label>
            <select
              id="dateFilter"
              className="booking-select"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              disabled={slotsLoading || bookingKey !== null || slots.length === 0}
            >
              <option value="all">All available days</option>
              {availableDateKeys.map(k => (
                <option key={k} value={k}>
                  {formatLocalDateHeading(k)}
                </option>
              ))}
            </select>
          </div>

          <div className="booking-inline-actions booking-inline-actions-right">
            <button
              className="booking-button secondary"
              type="button"
              onClick={() => caregiverId && loadSlots(caregiverId)}
              disabled={!caregiverId || slotsLoading || bookingKey !== null}
            >
              {slotsLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {slotsError && <div className="booking-alert error">{slotsError}</div>}

      <div className="booking-results">
        {!caregiverId && <div className="booking-empty">Choose a caregiver to see available slots.</div>}
        {caregiverId && !slotsLoading && !slotsError && slots.length === 0 && (
          <div className="booking-empty">No available slots found for this caregiver.</div>
        )}

        {grouped.map(([dayKey, daySlots]) => (
          <div key={dayKey} className="booking-day">
            <div className="booking-day-header">
              <div className="booking-day-title">{formatLocalDateHeading(dayKey)}</div>
              <div className="booking-day-count">{daySlots.length} slot(s)</div>
            </div>

            <div className="booking-slots">
              {daySlots.map(s => {
                const key = slotKey(s);
                const dur = calcDurationMinutes(s.start, s.end);
                const isBookingThis = bookingKey === key;
                return (
                  <div key={key} className="booking-slot">
                    <div className="booking-slot-time">
                      <div className="booking-slot-time-main">
                        {formatLocalTime(s.start)} – {formatLocalTime(s.end)}
                      </div>
                      <div className="booking-slot-time-sub">
                        Caregiver #{s.caregiverId}
                        {dur ? ` • ${dur} min` : ""}
                      </div>
                    </div>
                    <div className="booking-slot-actions">
                      <button
                        className="slot-book-button"
                        type="button"
                        onClick={() => handleBook(s)}
                        disabled={slotsLoading || bookingKey !== null}
                      >
                        {isBookingThis ? "Booking..." : "Book"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


