import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { RoomsApi } from '../api/rooms.api';
import { BookingsApi } from '../api/bookings.api';
import { AnalyticsApi } from '../api/analytics.api';
import { AnalyticsRow, Booking, Room } from '../api/types';
import { formatCurrency, formatTimeRange } from '../utils/format';
import { ApiError } from '../api/client';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface RoomFormState {
  name: string;
  baseHourlyRate: string;
  capacity: string;
}

const defaultForm: RoomFormState = {
  name: '',
  baseHourlyRate: '',
  capacity: '',
};

export const VendorPage = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [roomData, bookingData, analyticsData] = await Promise.all([
          RoomsApi.list(),
          BookingsApi.list({ pageSize: 50 }),
          AnalyticsApi.list(),
        ]);
        if (!mounted) return;
        setRooms(roomData);
        setBookings(bookingData.data);
        setAnalytics(analyticsData);
      } catch (err) {
        if (!mounted) return;
        setError('Unable to load vendor data.');
        console.error(err);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const roomBookingsMap = useMemo(() => {
    const grouped = bookings.reduce<Record<string, Booking[]>>((acc, booking) => {
      acc[booking.roomId] = acc[booking.roomId] ?? [];
      acc[booking.roomId].push(booking);
      return acc;
    }, {});

    Object.values(grouped).forEach((list) =>
      list.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
    );

    rooms.forEach((room) => {
      if (!grouped[room.id]) {
        grouped[room.id] = [];
      }
    });

    return grouped;
  }, [rooms, bookings]);

  const handleOpenDialog = () => {
    setForm(defaultForm);
    setError(null);
    setDialogOpen(true);
  };

  const handleCreateRoom = async () => {
    if (!form.name || !form.baseHourlyRate || !form.capacity) {
      setError('All fields are required.');
      return;
    }

    const payload = {
      name: form.name,
      baseHourlyRate: Number(form.baseHourlyRate),
      capacity: Number(form.capacity),
    };

    if (Number.isNaN(payload.baseHourlyRate) || Number.isNaN(payload.capacity)) {
      setError('Rate and capacity must be valid numbers.');
      return;
    }

    try {
      const room = await RoomsApi.create(payload);
      setRooms((prev) => [...prev, room]);
      setDialogOpen(false);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to create room.';
      setError(message);
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">Vendor Workspace</Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Create rooms, inspect booking timelines, and monitor revenue.
          </Typography>
        </Box>
        <Button variant="contained" onClick={handleOpenDialog}>
          New Room
        </Button>
      </Stack>
      {loading ? (
        <Typography>Loading vendor data…</Typography>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Rooms & Timelines
            </Typography>
            <Stack spacing={2}>
              {rooms.length === 0 && <Typography>No rooms yet.</Typography>}
              {rooms.map((room) => (
                <Card key={room.id} variant="outlined">
                  <CardContent>
                    <Typography variant="h6">{room.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rate {formatCurrency(room.baseHourlyRate)} · Capacity {room.capacity} people
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Upcoming & past bookings</Typography>
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        {roomBookingsMap[room.id].map((booking) => (
                          <Card key={booking.id} variant="outlined" sx={{ p: 1 }}>
                            <Typography variant="body2">
                              {formatTimeRange(booking.startTime, booking.endTime)} — {booking.userName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {booking.status}
                            </Typography>
                          </Card>
                        ))}
                        {roomBookingsMap[room.id].length === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            No bookings yet.
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Revenue Snapshot
            </Typography>
            {analytics.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No analytics yet.
              </Typography>
            ) : (
              <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="roomName" hide />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="totalRevenue" fill="#1976d2" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Grid>
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth>
        <DialogTitle>Create New Room</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Room Name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Base Hourly Rate"
              type="number"
              value={form.baseHourlyRate}
              onChange={(event) => setForm((prev) => ({ ...prev, baseHourlyRate: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Capacity"
              type="number"
              value={form.capacity}
              onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
              fullWidth
            />
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateRoom}>
            Save Room
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
