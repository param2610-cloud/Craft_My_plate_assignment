import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { InputField } from './InputField';
import { TimeField } from './TimeField';
import { RoomsApi } from '../api/rooms.api';
import { BookingsApi } from '../api/bookings.api';
import { Room } from '../api/types';
import { Message } from './Message';
import { ApiError } from '../api/client';

interface BookingFormProps {
  onBookingCreated?: () => void;
}

const toIsoString = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};

export const BookingForm = ({ onBookingCreated }: BookingFormProps) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [form, setForm] = useState({
    roomId: '',
    userName: '',
    startTime: '',
    endTime: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [traceId, setTraceId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadRooms = async () => {
      setLoadingRooms(true);
      try {
        const data = await RoomsApi.list();
        if (!mounted) {
          return;
        }
        setRooms(data);
        if (data.length > 0) {
          setForm((prev) => (prev.roomId ? prev : { ...prev, roomId: data[0].id }));
        }
      } catch {
        if (mounted) {
          setError('Unable to load rooms.');
        }
      } finally {
        if (mounted) {
          setLoadingRooms(false);
        }
      }
    };

    void loadRooms();

    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (field: 'roomId' | 'userName' | 'startTime' | 'endTime') =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setDetails(null);
    setTraceId(null);
    setSuccess(null);

    if (!form.roomId || !form.userName || !form.startTime || !form.endTime) {
      setError('All fields are required.');
      return;
    }

    const payload = {
      roomId: form.roomId,
      userName: form.userName,
      startTime: toIsoString(form.startTime),
      endTime: toIsoString(form.endTime)
    };

    if (!payload.startTime || !payload.endTime) {
      setError('Please provide valid start and end times.');
      return;
    }

    setSubmitting(true);
    try {
      const booking = await BookingsApi.create(payload);
      setSuccess(`Booking confirmed. Reference: ${booking.id}`);
      onBookingCreated?.();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.details) {
          setDetails(JSON.stringify(err.details));
        }
        if (err.traceId) {
          setTraceId(err.traceId);
        }
      } else {
        setError('Unexpected error. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="form-grid"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <label className="input-field">
        <span className="input-field__label">Room</span>
        <select value={form.roomId} onChange={handleChange('roomId')} disabled={loadingRooms}>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
      </label>
      <InputField
        label="Your Name"
        type="text"
        placeholder="Enter name"
        value={form.userName}
        onChange={handleChange('userName')}
      />
      <TimeField
        label="Start Time"
        value={form.startTime}
        onChange={handleChange('startTime')}
      />
      <TimeField label="End Time" value={form.endTime} onChange={handleChange('endTime')} />
      <div className="form-grid__actions">
        <button type="submit" disabled={submitting || loadingRooms}>
          {submitting ? 'Submitting…' : 'Request Booking'}
        </button>
      </div>
      {error && (
        <Message variant="error" title="Error">
          {error}
          {details && <span> Details: {details}</span>}
          {traceId && <span> Trace ID: {traceId}</span>}
        </Message>
      )}
      {success && (
        <Message variant="success" title="Success">
          {success}
        </Message>
      )}
    </form>
  );
};
