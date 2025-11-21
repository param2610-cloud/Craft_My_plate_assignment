import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { BookingList } from '../components/BookingList';
import { AnalyticsTable } from '../components/AnalyticsTable';
import { BookingsApi } from '../api/bookings.api';
import { AnalyticsApi } from '../api/analytics.api';
import { RoomsApi } from '../api/rooms.api';
import { Booking, AnalyticsRow, Room } from '../api/types';
import { ApiError } from '../api/client';

const BOOKINGS_PAGE_SIZE = 20;

export const AdminPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsMeta, setBookingsMeta] = useState({ page: 0, hasMore: true });
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [initialBookingsLoaded, setInitialBookingsLoaded] = useState(false);
  const bookingsLoadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    severity: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, roomsData] = await Promise.all([
        AnalyticsApi.list(),
        RoomsApi.list(),
      ]);
      setAnalytics(analyticsData);
      setRooms(roomsData);
    } catch (err) {
      setError('Unable to load admin data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const loadBookingsPage = useCallback(
    async (pageToLoad: number, reset = false) => {
      if (bookingsLoadingRef.current) {
        return;
      }
      bookingsLoadingRef.current = true;
      setBookingsLoading(true);
      try {
        const response = await BookingsApi.list({
          page: pageToLoad,
          pageSize: BOOKINGS_PAGE_SIZE,
        });
        setBookings((prev) => (reset ? response.data : [...prev, ...response.data]));
        setBookingsMeta({
          page: response.page,
          hasMore: response.hasMore,
        });
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Unable to load bookings.';
        setActionMessage({ severity: 'error', text: message });
      } finally {
        bookingsLoadingRef.current = false;
        setBookingsLoading(false);
        setInitialBookingsLoaded(true);
      }
    },
    []
  );

  useEffect(() => {
    void loadBookingsPage(1, true);
  }, [loadBookingsPage]);

  useEffect(() => {
    if (!initialBookingsLoaded || !bookingsMeta.hasMore) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        void loadBookingsPage(bookingsMeta.page + 1);
      }
    },
    { threshold: 0.5 });

    const node = sentinelRef.current;
    if (node) {
      observer.observe(node);
    }

    return () => {
      if (node) {
        observer.unobserve(node);
      }
      observer.disconnect();
    };
  }, [initialBookingsLoaded, bookingsMeta.hasMore, bookingsMeta.page, loadBookingsPage]);

  const handleRefresh = () => {
    setBookings([]);
    setBookingsMeta({ page: 0, hasMore: true });
    setInitialBookingsLoaded(false);
    void loadData();
    void loadBookingsPage(1, true);
  };

  const handleCancelRequest = (bookingId: string) => {
    void handleCancel(bookingId);
  };

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    setActionMessage(null);
    try {
      await BookingsApi.cancel(bookingId);
      setActionMessage({ severity: 'success', text: 'Booking cancelled.' });
      setBookings([]);
      setBookingsMeta({ page: 0, hasMore: true });
      setInitialBookingsLoaded(false);
      await loadData();
      await loadBookingsPage(1, true);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to cancel booking.';
      setActionMessage({ severity: 'error', text: message });
    } finally {
      setCancellingId(null);
    }
  };

  const metrics = useMemo(() => {
    const totalRooms = rooms.length;
    const confirmedBookings = bookings.filter((booking) => booking.status === 'CONFIRMED');
    const totalRevenue = analytics.reduce((sum, row) => sum + row.totalRevenue, 0);
    return {
      totalRooms,
      confirmedCount: confirmedBookings.length,
      revenue: totalRevenue,
    };
  }, [rooms, bookings, analytics]);

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Platform Overview
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Monitor the entire marketplace and manage bookings.
      </Typography>
      <Box sx={{ my: 2 }}>
        <Button variant="contained" onClick={handleRefresh} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Refresh'}
        </Button>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      {actionMessage && !error && (
        <Alert severity={actionMessage.severity}>{actionMessage.text}</Alert>
      )}
      <Grid container spacing={3} sx={{ mt: 1, mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Active Rooms
              </Typography>
              <Typography variant="h4">{metrics.totalRooms}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Confirmed Bookings
              </Typography>
              <Typography variant="h4">{metrics.confirmedCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Lifetime Revenue
              </Typography>
              <Typography variant="h4">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(metrics.revenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" component="h2" gutterBottom>
            Bookings
          </Typography>
          {!initialBookingsLoaded ? (
            <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <BookingList
                bookings={bookings}
                onCancel={handleCancelRequest}
                cancellingId={cancellingId}
              />
              {bookingsMeta.hasMore && (
                <Box ref={sentinelRef} sx={{ height: 32 }} />
              )}
              {bookingsLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              {!bookingsMeta.hasMore && bookings.length > 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: 'center', mt: 1 }}
                >
                  End of list
                </Typography>
              )}
            </>
          )}
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" component="h2" gutterBottom>
            Analytics
          </Typography>
          {loading ? <CircularProgress /> : <AnalyticsTable rows={analytics} />}
        </Grid>
      </Grid>
    </Box>
  );
};
