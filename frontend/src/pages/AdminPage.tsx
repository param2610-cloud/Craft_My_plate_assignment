import { useCallback, useEffect, useState } from 'react';
import { BookingList } from '../components/BookingList';
import { AnalyticsTable } from '../components/AnalyticsTable';
import { Section } from '../components/Section';
import { BookingsApi } from '../api/bookings.api';
import { AnalyticsApi } from '../api/analytics.api';
import { Booking, AnalyticsRow } from '../api/types';
import { Message } from '../components/Message';
import { ApiError } from '../api/client';

interface AdminPageProps {
  refreshKey: number;
}

export const AdminPage = ({ refreshKey }: AdminPageProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ variant: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingsData, analyticsData] = await Promise.all([
        BookingsApi.list(),
        AnalyticsApi.list()
      ]);
      setBookings(bookingsData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError('Unable to load admin data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData, refreshKey]);

  const handleRefresh = () => {
    void loadData();
  };

  const handleCancelRequest = (bookingId: string) => {
    void handleCancel(bookingId);
  };

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    setActionMessage(null);
    try {
      await BookingsApi.cancel(bookingId);
      setActionMessage({ variant: 'success', text: 'Booking cancelled.' });
      await loadData();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to cancel booking.';
      setActionMessage({ variant: 'error', text: message });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <Section
      title="Admin"
      description="Monitor current bookings and analytics."
    >
      <div className="form-grid__actions">
        <button type="button" onClick={handleRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {error && (
        <Message variant="error" title="Error">
          {error}
        </Message>
      )}
      {actionMessage && !error && (
        <Message variant={actionMessage.variant} title="Update">
          {actionMessage.text}
        </Message>
      )}
      <div className="grid two-columns">
        <div>
          <h3>Bookings</h3>
          {loading && <p>Loading bookings…</p>}
          {!loading && (
            <BookingList
              bookings={bookings}
              onCancel={handleCancelRequest}
              cancellingId={cancellingId}
            />
          )}
        </div>
        <div>
          <h3>Analytics</h3>
          {loading && <p>Loading analytics…</p>}
          {!loading && <AnalyticsTable rows={analytics} />}
        </div>
      </div>
    </Section>
  );
};
