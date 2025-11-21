import { Box, Button, Card, CardActions, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { Link as RouterLink } from 'react-router-dom';

const cards = [
  {
    title: 'Vendor Perspective',
    description: 'Manage rooms, inspect booking timelines, and track room-level revenue.',
    action: { label: 'Open Vendor View', to: '/vendor' }
  },
  {
    title: 'Customer Perspective',
    description: 'Browse rooms by capacity or rate and request bookings instantly.',
    action: { label: 'Explore as Customer', to: '/customer' }
  },
  {
    title: 'Admin Perspective',
    description: 'Monitor the entire platform with consolidated bookings and analytics.',
    action: { label: 'Open Admin Console', to: '/admin' }
  }
];

export const LandingPage = () => {
  return (
    <Box sx={{ py: 6 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Workspace Booking Platform
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4, maxWidth: 720 }}>
        This sandbox demonstrates the marketplace from three perspectives without authentication. Switch
        between vendor, customer, and platform views to inspect the same data through different workflows.
      </Typography>
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item key={card.title} xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button component={RouterLink} to={card.action.to} variant="contained" size="small">
                  {card.action.label}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
