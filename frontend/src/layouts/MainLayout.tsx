import { PropsWithChildren } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Overview', path: '/' },
  { label: 'Vendor', path: '/vendor' },
  { label: 'Customer', path: '/customer' },
  { label: 'Admin', path: '/admin' },
];

export const MainLayout = ({ children }: PropsWithChildren) => {
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar component="nav">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Workspace Booking Platform
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                color="inherit"
                variant={location.pathname === item.path ? 'contained' : 'text'}
                size="small"
              >
                {item.label}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ mt: 10, flexGrow: 1 }}>
        {children}
      </Container>
      <Box component="footer" sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
        <Typography variant="body2" color="text.secondary" align="center">
          © {new Date().getFullYear()} Workspace Booking System
        </Typography>
      </Box>
    </Box>
  );
};
