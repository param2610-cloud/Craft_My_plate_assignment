import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
  Checkbox,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { RoomsApi } from '../api/rooms.api';
import { BookingsApi } from '../api/bookings.api';
import { Room, Booking } from '../api/types';
import { formatCurrency } from '../utils/format';
import { BookingForm } from '../components/BookingForm';
import { BookingList } from '../components/BookingList';
import { ApiError } from '../api/client';

export const CustomerPage = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    maxRate: '',
    minCapacity: '',
    search: '',
  });
  const [bookingFilter, setBookingFilter] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    acknowledged: false,
    booking: null as Booking | null,
  });
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<
    { severity: 'success' | 'error'; text: string } | null
  >(null);

  const loadRoomsAndBookings = useCallback(async () => {
    setLoading(true);
    try {
      const [roomData, bookingData] = await Promise.all([
        RoomsApi.list(),
        BookingsApi.list({ pageSize: 50 })
      ]);
      setRooms(roomData);
      setBookings(bookingData.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoomsAndBookings();
  }, [loadRoomsAndBookings]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const withinRate = filters.maxRate ? room.baseHourlyRate <= Number(filters.maxRate) : true;
      const withinCapacity = filters.minCapacity ? room.capacity >= Number(filters.minCapacity) : true;
      const matchesSearch = filters.search
        ? room.name.toLowerCase().includes(filters.search.toLowerCase())
        : true;
      return withinRate && withinCapacity && matchesSearch;
    });
  }, [rooms, filters]);

  const filteredBookings = useMemo(() => {
    if (!bookingFilter) {
      return bookings;
    }
    return bookings.filter((booking) =>
      booking.userName.toLowerCase().includes(bookingFilter.toLowerCase())
    );
  }, [bookings, bookingFilter]);

  const openCancelDialog = (bookingId: string) => {
    const booking = bookings.find((entry) => entry.id === bookingId);
    if (!booking) {
      return;
    }
    setConfirmDialog({ open: true, acknowledged: false, booking });
  };

  const closeCancelDialog = () => {
    setConfirmDialog({ open: false, acknowledged: false, booking: null });
  };

  const handleConfirmCancel = async () => {
    if (!confirmDialog.booking) {
      return;
    }
    setCancellingId(confirmDialog.booking.id);
    setActionMessage(null);
    try {
      await BookingsApi.cancel(confirmDialog.booking.id);
      setActionMessage({ severity: 'success', text: 'Booking cancelled.' });
      closeCancelDialog();
      await loadRoomsAndBookings();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to cancel booking.';
      setActionMessage({ severity: 'error', text: message });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Customer Workspace
      </Typography>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Filter rooms by rate or capacity, then request a booking. Recent bookings can be filtered by name.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Search"
                placeholder="Search rooms"
                value={filters.search}
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Max Rate"
                type="number"
                value={filters.maxRate}
                onChange={(event) => setFilters((prev) => ({ ...prev, maxRate: event.target.value }))}
              />
              <TextField
                label="Min Capacity"
                type="number"
                value={filters.minCapacity}
                onChange={(event) => setFilters((prev) => ({ ...prev, minCapacity: event.target.value }))}
              />
            </Stack>
          </Card>
          <Grid container spacing={2}>
            {loading && <Typography>Loading rooms…</Typography>}
            {!loading && filteredRooms.length === 0 && (
              <Grid item xs={12}>
                <Typography>No rooms matched these filters.</Typography>
              </Grid>
            )}
            {filteredRooms.map((room) => (
              <Grid item xs={12} md={6} key={room.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6">{room.name}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                      <Chip label={`Rate: ${formatCurrency(room.baseHourlyRate)}`} size="small" />
                      <Chip label={`Capacity: ${room.capacity}`} size="small" />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Grid item xs={12} md={4}>
          <BookingForm onBookingCreated={loadRoomsAndBookings} />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Recent Bookings
          </Typography>
          <TextField
            label="Filter by customer name"
            value={bookingFilter}
            onChange={(event) => setBookingFilter(event.target.value)}
            size="small"
          />
        </Stack>
        {actionMessage && (
          <Alert severity={actionMessage.severity} sx={{ mt: 2 }}>
            {actionMessage.text}
          </Alert>
        )}
        <Box sx={{ mt: 2 }}>
          <BookingList
            bookings={filteredBookings}
            showActions
            onCancel={openCancelDialog}
            cancellingId={cancellingId}
          />
        </Box>
      </Box>

      <Dialog open={confirmDialog.open} onClose={closeCancelDialog} fullWidth>
        <DialogTitle>Cancel booking?</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            You're about to cancel the booking for{' '}
            <strong>{confirmDialog.booking?.roomName ?? 'this room'}</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Once cancelled, another customer may grab the slot immediately.
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={confirmDialog.acknowledged}
                onChange={(event) =>
                  setConfirmDialog((prev) => ({
                    ...prev,
                    acknowledged: event.target.checked,
                  }))
                }
              />
            }
            label="I understand this action cannot be undone"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancelDialog}>Keep booking</Button>
          <Button
            color="error"
            variant="contained"
            disabled={!confirmDialog.acknowledged || !confirmDialog.booking || cancellingId === confirmDialog.booking?.id}
            onClick={() => {
              void handleConfirmCancel();
            }}
          >
            {cancellingId === confirmDialog.booking?.id ? 'Cancelling…' : 'Cancel booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
