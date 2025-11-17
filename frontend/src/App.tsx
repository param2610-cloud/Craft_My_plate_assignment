import { useState } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { RoomsPage } from './pages/RoomsPage';
import { BookingPage } from './pages/BookingPage';
import { AdminPage } from './pages/AdminPage';

export const App = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBookingCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <MainLayout>
      <RoomsPage />
      <BookingPage onBookingCreated={handleBookingCreated} />
      <AdminPage refreshKey={refreshKey} />
    </MainLayout>
  );
};
