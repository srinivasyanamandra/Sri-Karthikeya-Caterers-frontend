import React, { useMemo } from 'react';
import {
  browserTimezone,
  formatScheduleForDisplay,
  isFutureLocalDateTime,
  localDateTimeToUtcIso,
  todayLocalDateInputValue,
} from '../../../utils/datetime';

/**
 * AdminScheduleField — controlled date+time picker that always emits a
 * UTC ISO 8601 string via `onChange`.
 *
 * The single most important guarantee: callers never touch the raw
 * `<input>` strings. They receive `{ iso, local: { date, time }, valid }`
 * — the ISO is what gets sent on the wire, the local parts are for
 * round-tripping the inputs, and `valid` is true iff both parts are set
 * and the resulting instant is in the future (with a small slack to
 * tolerate slow clicks).
 *
 * Replaces the buggy `${sendDate}T${sendTime}:00` concatenation that
 * caused the production scheduler to silently coerce IST values to UTC
 * and dispatch ~5.5 hours late.
 */
const AdminScheduleField = ({
  value, // { date, time } in browser-local time
  onChange, // ({ date, time, iso, valid }) => void
  minLeadMinutes = 1,
  disabled = false,
  idPrefix = 'admin-schedule',
}) => {
  const date = value?.date || '';
  const time = value?.time || '';
  const tz = browserTimezone();

  const iso = useMemo(() => localDateTimeToUtcIso(date, time), [date, time]);
  const valid = useMemo(
    () => isFutureLocalDateTime(date, time, minLeadMinutes),
    [date, time, minLeadMinutes]
  );

  const emit = (nextDate, nextTime) => {
    const nextIso = localDateTimeToUtcIso(nextDate, nextTime);
    onChange?.({
      date: nextDate,
      time: nextTime,
      iso: nextIso,
      valid: isFutureLocalDateTime(nextDate, nextTime, minLeadMinutes),
    });
  };

  return (
    <div className="admin-schedule-field">
      <div className="admin-schedule-field-row">
        <div className="admin-schedule-field-group">
          <label htmlFor={`${idPrefix}-date`}>Date</label>
          <input
            id={`${idPrefix}-date`}
            type="date"
            value={date}
            min={todayLocalDateInputValue()}
            disabled={disabled}
            onChange={(e) => emit(e.target.value, time)}
          />
        </div>
        <div className="admin-schedule-field-group">
          <label htmlFor={`${idPrefix}-time`}>Time</label>
          <input
            id={`${idPrefix}-time`}
            type="time"
            value={time}
            disabled={disabled}
            onChange={(e) => emit(date, e.target.value)}
          />
        </div>
      </div>

      <div className="admin-schedule-field-meta">
        <span className="admin-schedule-field-tz" title={tz}>
          <i className="fas fa-globe" aria-hidden="true" /> Times shown in{' '}
          <strong>{tz}</strong>
        </span>
        {iso && valid && (
          <span className="admin-schedule-field-preview">
            <i className="fas fa-paper-plane" aria-hidden="true" /> Will send{' '}
            <strong>{formatScheduleForDisplay(iso)}</strong>
          </span>
        )}
        {iso && !valid && (
          <span className="admin-schedule-field-error" role="alert">
            <i className="fas fa-triangle-exclamation" aria-hidden="true" /> Pick a
            time at least {minLeadMinutes} minute
            {minLeadMinutes === 1 ? '' : 's'} in the future.
          </span>
        )}
      </div>
    </div>
  );
};

export default AdminScheduleField;
