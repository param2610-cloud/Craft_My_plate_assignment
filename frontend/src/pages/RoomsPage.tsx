import { useEffect, useState } from 'react';
import { RoomCard } from '../components/RoomCard';
import { Section } from '../components/Section';
import { RoomsApi } from '../api/rooms.api';
import { Room } from '../api/types';
import { Message } from '../components/Message';

export const RoomsPage = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    RoomsApi.list()
      .then((data) => {
        if (mounted) {
          setRooms(data);
        }
      })
      .catch(() => {
        if (mounted) {
          setError('Unable to load rooms.');
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Section title="Rooms" description="Browse available spaces and base rates.">
      {loading && <p>Loading rooms…</p>}
      {error && (
        <Message variant="error" title="Error">
          {error}
        </Message>
      )}
      {!loading && !error && (
        <div className="room-list">
          {rooms.length === 0 ? (
            <p>No rooms available yet.</p>
          ) : (
            rooms.map((room) => <RoomCard key={room.id} {...room} />)
          )}
        </div>
      )}
    </Section>
  );
};
