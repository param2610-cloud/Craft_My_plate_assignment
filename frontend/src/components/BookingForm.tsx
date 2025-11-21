import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Box,
  Backdrop,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import type { SelectChangeEvent } from '@mui/material/Select';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Zoom from '@mui/material/Zoom';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import { RoomsApi } from '../api/rooms.api';
import { BookingsApi } from '../api/bookings.api';
import { Room } from '../api/types';
import { ApiError } from '../api/client';

interface BookingFormProps {
  onBookingCreated?: () => void;
}

export const BookingForm = ({ onBookingCreated }: BookingFormProps) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [form, setForm] = useState({
    roomId: '',
    userName: '',
  });
  const [bookingDate, setBookingDate] = useState<Dayjs | null>(() =>
    dayjs().add(1, 'day').startOf('day')
  );
  const [startTimeValue, setStartTimeValue] = useState<Dayjs | null>(() =>
    dayjs().hour(9).minute(0).second(0).millisecond(0)
  );
  const [endTimeValue, setEndTimeValue] = useState<Dayjs | null>(() =>
    dayjs().hour(10).minute(0).second(0).millisecond(0)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [traceId, setTraceId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

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
          setForm((prev) =>
            prev.roomId ? prev : { ...prev, roomId: data[0].id }
          );
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

  useEffect(() => {
    if (!success) {
      setShowCelebration(false);
      return;
    }
    setShowCelebration(true);
    const timeout = setTimeout(() => {
      setShowCelebration(false);
    }, 2800);
    return () => {
      clearTimeout(timeout);
    };
  }, [success]);

  const handleChange =
    (field: 'roomId' | 'userName') =>
    (
      event:
        | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | SelectChangeEvent<string>
    ) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const combineDateTime = (date: Dayjs | null, time: Dayjs | null) => {
    if (!date || !time) {
      return null;
    }
    return date
      .hour(time.hour())
      .minute(time.minute())
      .second(0)
      .millisecond(0);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setDetails(null);
    setTraceId(null);
    setSuccess(null);

    const startDateTime = combineDateTime(bookingDate, startTimeValue);
    const endDateTime = combineDateTime(bookingDate, endTimeValue);

    if (!form.roomId || !form.userName || !startDateTime || !endDateTime) {
      setError('Room, name, date, and time are required.');
      return;
    }

    if (!endDateTime.isAfter(startDateTime)) {
      setError('End time must be after start time.');
      return;
    }

    if (startDateTime.isBefore(dayjs())) {
      setError('Bookings must be scheduled in the future.');
      return;
    }

    const payload = {
      roomId: form.roomId,
      userName: form.userName,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
    };

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
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        component="form"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        sx={{ mt: 2 }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth disabled={loadingRooms}>
              <InputLabel id="room-select-label">Room</InputLabel>
              <Select
                labelId="room-select-label"
                value={form.roomId}
                label="Room"
                onChange={handleChange('roomId')}
              >
                {rooms.map((room) => (
                  <MenuItem key={room.id} value={room.id}>
                    {room.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Your Name"
              placeholder="Enter name"
              value={form.userName}
              onChange={handleChange('userName')}
            />
          </Grid>
          <Grid item xs={12}>
            <DatePicker
              label="Booking Date"
              value={bookingDate}
              disablePast
              onChange={(value) => setBookingDate(value)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TimePicker
              label="Start Time"
              value={startTimeValue}
              minutesStep={15}
              onChange={(value) => setStartTimeValue(value)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TimePicker
              label="End Time"
              value={endTimeValue}
              minutesStep={15}
              minTime={startTimeValue ?? undefined}
              onChange={(value) => setEndTimeValue(value)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, position: 'relative' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || loadingRooms}
            fullWidth
          >
            {submitting ? 'Submitting…' : 'Request Booking'}
          </Button>
          {submitting && (
            <CircularProgress
              size={24}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-12px',
                marginLeft: '-12px',
              }}
            />
          )}
        </Box>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
            {details && <span> Details: {details}</span>}
            {traceId && <span> Trace ID: {traceId}</span>}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </Box>
      <Backdrop
        open={showCelebration}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.modal + 1,
          backdropFilter: 'blur(3px)',
          backgroundColor: 'rgba(0,0,0,0.35)'
        }}
        onClick={() => setShowCelebration(false)}
      >
        <Zoom in={showCelebration} timeout={400}>
          <Box
            sx={{
              textAlign: 'center',
              color: '#fff',
              px: 3,
              py: 2
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00c853, #00bfa5)',
                mx: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 15px 35px rgba(0, 200, 83, 0.45)',
                overflow: 'hidden',
                animation: 'pulseRing 1.8s ease-out infinite',
                '@keyframes pulseRing': {
                  '0%': { boxShadow: '0 0 0 0 rgba(0, 200, 83, 0.65)' },
                  '70%': { boxShadow: '0 0 0 25px rgba(0, 200, 83, 0)' },
                  '100%': { boxShadow: '0 0 0 0 rgba(0, 200, 83, 0)' }
                }
              }}
            >
              <CheckCircleOutlineRoundedIcon sx={{ fontSize: 96, color: '#fff' }} />
            </Box>
            <Typography variant="h5" sx={{ mt: 3, fontWeight: 600 }}>
              Booking confirmed
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              We’ve saved your slot and emailed the details.
            </Typography>
          </Box>
        </Zoom>
      </Backdrop>
    </LocalizationProvider>
  );
};
