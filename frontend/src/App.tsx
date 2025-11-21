import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { MainLayout } from './layouts/MainLayout';
import { LandingPage } from './pages/LandingPage';
import { VendorPage } from './pages/VendorPage';
import { CustomerPage } from './pages/CustomerPage';
import { AdminPage } from './pages/AdminPage';

export const App = () => {
  return (
    <Router>
      <CssBaseline />
      <MainLayout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/vendor" element={<VendorPage />} />
          <Route path="/customer" element={<CustomerPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </MainLayout>
    </Router>
  );
};
