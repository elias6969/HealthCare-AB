import { useEffect, useMemo, useRef, useState } from "react";
import {
  bookAppointment,
  listAvailableAppointmentSlots,
  type AvailableAppointmentSlot,
} from "../../api/appointments";
import ConfirmDialog from "../ui/ConfirmDialog";
import "./patientAppointmentBooking.css";

type Toast = { kind: "success" | "error"; message: string };

function slotKey(s: AvailableAppointmentSlot) {
  // Unique key for a slot. Backend basically treats (caregiver + start + end) as the identity here.
  return `${s.caregiver.id}:${s.start}:${s.end}`;
}

function displayCaregiverName(caregiver: AvailableAppointmentSlot["caregiver"]) {
  // Backend might return empty first/last name sometimes. If that happens, we still show something sane.
  const first = (caregiver.firstName ?? "").trim();
  const last = (caregiver.lastName ?? "").trim();
  const full = `${first} ${last}`.trim();
  return full || `Caregiver #${caregiver.id}`;
}

function extractErrorMessage(err: any, fallback: string) {
  // We always want a user-visible error. No "silent fail" / console-only errors.
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
  // YYYY-MM-DD in local time. We use this for grouping and filtering by day.
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

type CaregiverOption = { id: number; firstName: string; lastName: string };

function caregiverLabel(c: CaregiverOption) {
  const full = `${(c.firstName ?? "").trim()} ${(c.lastName ?? "").trim()}`.trim();
  return full || `Caregiver #${c.id}`;
}

export default function PatientAppointmentBooking({
  onBooked,
  onRequestClose,
}: {
  onBooked?: () => void;
  onRequestClose?: () => void;
}) {
  // null => All caregivers (we show everything by default)
  const [selectedCaregiverId, setSelectedCaregiverId] = useState<number | null>(null);

  // dateFilter === "all" means "show all days"
  const [dateFilter, setDateFilter] = useState<"all" | string>("all"); // local YYYY-MM-DD
  const [allSlots, setAllSlots] = useState<AvailableAppointmentSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string>("");

  // bookingKey is our "lock" so we don't spam the API / double-book.
  const [bookingKey, setBookingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const [pageSize, setPageSize] = useState<10 | 20 | 50>(20);
  const [page, setPage] = useState(1);
  // When you click "Book", we store the slot here and show the real confirm dialog.
  const [confirmSlot, setConfirmSlot] = useState<AvailableAppointmentSlot | null>(null);

  const toastTimer = useRef<number | null>(null);
  function showToast(next: Toast) {
    // Quick feedback for success/errors. Auto-hides after a few seconds.
    setToast(next);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4500);
  }

  const visibleSlots = useMemo(() => {
    // Filter by caregiver. If "All caregivers" then don't filter.
    return selectedCaregiverId
      ? allSlots.filter(s => s.caregiver.id === selectedCaregiverId)
      : allSlots;
  }, [allSlots, selectedCaregiverId]);

  const filteredSortedSlots = useMemo(() => {
    // Filter by date, then sort by start time so it reads like a real schedule.
    const base =
      dateFilter === "all"
        ? visibleSlots
        : visibleSlots.filter(s => toLocalDateKey(s.start) === dateFilter);
    return [...base].sort((a, b) => a.start.localeCompare(b.start));
  }, [visibleSlots, dateFilter]);

  const totalSlots = filteredSortedSlots.length;
  const totalPages = Math.max(1, Math.ceil(totalSlots / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageSlots = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredSortedSlots.slice(start, start + pageSize);
  }, [filteredSortedSlots, pageSize, safePage]);

  const grouped = useMemo(() => {
    // Group the current page by local day so the list is easy to scan.
    const map = new Map<string, AvailableAppointmentSlot[]>();
    for (const s of pageSlots) {
      const key = toLocalDateKey(s.start);
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
  }, [pageSlots]);

  const availableDateKeys = useMemo(() => {
    // This powers the "Date" dropdown. It should reflect current caregiver filter.
    const set = new Set<string>();
    for (const s of visibleSlots) set.add(toLocalDateKey(s.start));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [visibleSlots]);

  const loadAbortRef = useRef<AbortController | null>(null);

  const [caregiverOptions, setCaregiverOptions] = useState<CaregiverOption[]>([]);
  const [caregiverOptionsLoading, setCaregiverOptionsLoading] = useState(false);
  const [caregiverOptionsError, setCaregiverOptionsError] = useState("");

  async function loadAvailability() {
    // One call to load "truth from backend":
    // - all caregivers + all slots
    // - then we derive caregiver dropdown from that list
    setCaregiverOptionsError("");
    setCaregiverOptionsLoading(true);
    setSlotsError("");
    setSlotsLoading(true);
    try {
      // Backend supports listing slots across caregivers; we derive caregiver list from that response.
      const all = await listAvailableAppointmentSlots();
      setAllSlots(all);
      setPage(1);
      const unique = new Map<number, CaregiverOption>();
      for (const s of all) {
        unique.set(s.caregiver.id, {
          id: s.caregiver.id,
          firstName: s.caregiver.firstName,
          lastName: s.caregiver.lastName,
        });
      }
      const list = Array.from(unique.values()).sort((a, b) =>
        caregiverLabel(a).localeCompare(caregiverLabel(b))
      );
      setCaregiverOptions(list);

      // Keep date filter only if it still exists
      setDateFilter(prev => {
        if (prev === "all") return prev;
        const exists = all.some(s => toLocalDateKey(s.start) === prev);
        return exists ? prev : "all";
      });
    } catch (err: any) {
      setAllSlots([]);
      setCaregiverOptions([]);
      const msg = extractErrorMessage(err, "Failed to load availability.");
      setCaregiverOptionsError(msg);
      setSlotsError(msg);
    } finally {
      setCaregiverOptionsLoading(false);
      setSlotsLoading(false);
    }
  }

  // initial load (caregivers list)
  useEffect(() => {
    loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      loadAbortRef.current?.abort();
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    // Reset pagination when filters change, otherwise you can land on a page that doesn't exist anymore.
    setPage(1);
  }, [selectedCaregiverId, dateFilter]);

  async function performBooking(slot: AvailableAppointmentSlot) {
    // Actual booking call (triggered ONLY after user confirms in the real dialog)
    const key = slotKey(slot);
    if (bookingKey) return;

    setBookingKey(key);
    try {
      await bookAppointment({ caregiverId: slot.caregiver.id, start: slot.start, end: slot.end });
      showToast({ kind: "success", message: "Appointment booked successfully." });

      // Remove immediately so the UI feels responsive, then re-sync from backend for correctness.
      setAllSlots(prev => prev.filter(s => slotKey(s) !== key));
      await loadAvailability();

      return true;
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = extractErrorMessage(err, "Booking failed. Please try again.");
      showToast({ kind: "error", message: msg });

      // Conflicts: re-sync to reflect latest availability (someone else booked it first).
      if (status === 409) {
        await loadAvailability();
      }
      return false;
    } finally {
      setBookingKey(null);
    }
  }

  async function confirmBooking() {
    // User pressed "Confirm booking" in the dialog.
    if (!confirmSlot) return;
    const ok = await performBooking(confirmSlot);
    if (ok) {
      setConfirmSlot(null);
      onBooked?.();
      onRequestClose?.();
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

      <ConfirmDialog
        open={!!confirmSlot}
        title="Confirm booking"
        description="Please review the appointment details before confirming."
        confirmText="Confirm booking"
        cancelText="Cancel"
        loading={bookingKey !== null}
        onCancel={() => (bookingKey ? null : setConfirmSlot(null))}
        onConfirm={confirmBooking}
      >
        {confirmSlot ? (
          <div className="booking-confirm-details">
            <div className="booking-confirm-row">
              <div className="booking-confirm-label">Caregiver</div>
              <div className="booking-confirm-value">{displayCaregiverName(confirmSlot.caregiver)}</div>
            </div>
            <div className="booking-confirm-row">
              <div className="booking-confirm-label">Date</div>
              <div className="booking-confirm-value">{formatLocalDateHeading(toLocalDateKey(confirmSlot.start))}</div>
            </div>
            <div className="booking-confirm-row">
              <div className="booking-confirm-label">Time</div>
              <div className="booking-confirm-value">
                {formatLocalTime(confirmSlot.start)} – {formatLocalTime(confirmSlot.end)}
              </div>
            </div>
            <div className="booking-confirm-row">
              <div className="booking-confirm-label">Duration</div>
              <div className="booking-confirm-value">
                {calcDurationMinutes(confirmSlot.start, confirmSlot.end) ?? "—"} min
              </div>
            </div>
          </div>
        ) : null}
      </ConfirmDialog>

      <div className="booking-panel">
        <div className="booking-row">
          <div className="booking-field">
            <label className="booking-label" htmlFor="caregiverSelect">
              Caregiver
            </label>
            <select
              id="caregiverSelect"
              className="booking-select"
              value={selectedCaregiverId ?? "all"}
              onChange={e => {
                const v = e.target.value;
                setSelectedCaregiverId(v === "all" ? null : Number(v) || null);
                setDateFilter("all");
              }}
              disabled={caregiverOptionsLoading || slotsLoading || bookingKey !== null}
            >
              <option value="all">All caregivers</option>
              {!caregiverOptionsLoading && caregiverOptions.length === 0 && (
                <option value="">No caregivers available</option>
              )}
              {caregiverOptions.map(c => (
                <option key={c.id} value={c.id}>
                  {caregiverLabel(c)}
                </option>
              ))}
            </select>
          </div>

          <div className="booking-inline-actions booking-inline-actions-right">
            <button
              className="booking-button secondary"
              type="button"
              onClick={loadAvailability}
              disabled={caregiverOptionsLoading || slotsLoading || bookingKey !== null}
            >
              {caregiverOptionsLoading ? "Loading..." : "Refresh availability"}
            </button>
          </div>
        </div>

        {caregiverOptionsError && <div className="booking-alert error">{caregiverOptionsError}</div>}

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
              disabled={slotsLoading || bookingKey !== null || visibleSlots.length === 0}
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
              onClick={loadAvailability}
              disabled={slotsLoading || bookingKey !== null}
            >
              {slotsLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {slotsError && <div className="booking-alert error">{slotsError}</div>}

      <div className="booking-results">
        {!slotsLoading && !slotsError && allSlots.length > 0 && (
          <div className="booking-pagination" role="navigation" aria-label="Appointment slots pagination">
            <div className="booking-pagination-left">
              <div className="booking-pagination-count">
                Showing <strong>{totalSlots === 0 ? 0 : (safePage - 1) * pageSize + 1}</strong>–
                <strong>{Math.min(safePage * pageSize, totalSlots)}</strong> of <strong>{totalSlots}</strong>
              </div>
            </div>

            <div className="booking-pagination-right">
              <label className="booking-pagination-label" htmlFor="pageSize">
                Per page
              </label>
              <select
                id="pageSize"
                className="booking-select booking-pagination-select"
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value) as 10 | 20 | 50)}
                disabled={slotsLoading || bookingKey !== null}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>

              <button
                className="booking-button secondary booking-pagination-button"
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={slotsLoading || bookingKey !== null || safePage <= 1}
              >
                Previous
              </button>
              <div className="booking-pagination-page">
                Page <strong>{safePage}</strong> / <strong>{totalPages}</strong>
              </div>
              <button
                className="booking-button secondary booking-pagination-button"
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={slotsLoading || bookingKey !== null || safePage >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}

        <div className="booking-results-scroll">
          {!slotsLoading && !slotsError && allSlots.length === 0 && (
            <div className="booking-empty">No available slots found.</div>
          )}

          {!slotsLoading && !slotsError && allSlots.length > 0 && totalSlots === 0 && (
            <div className="booking-empty">No available slots match your filters.</div>
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
                  const busy = slotsLoading || bookingKey !== null || confirmSlot !== null;
                  return (
                    <div key={key} className="booking-slot">
                      <div className="booking-slot-time">
                        <div className="booking-slot-time-main">
                          {formatLocalTime(s.start)} – {formatLocalTime(s.end)}
                        </div>
                        <div className="booking-slot-time-sub">
                          {displayCaregiverName(s.caregiver)}
                          {dur ? ` • ${dur} min` : ""}
                        </div>
                      </div>
                      <div className="booking-slot-actions">
                        <button
                          className="slot-book-button"
                          type="button"
                          onClick={() => setConfirmSlot(s)}
                          disabled={busy}
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
      </div>
    </section>
  );
}


