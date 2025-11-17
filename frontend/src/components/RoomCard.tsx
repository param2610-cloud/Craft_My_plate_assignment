import { formatCurrency } from '../utils/format';

interface RoomCardProps {
  name: string;
  baseHourlyRate: number;
  capacity: number;
}

export const RoomCard = ({ name, baseHourlyRate, capacity }: RoomCardProps) => {
  return (
    <article className="card">
      <h3 className="card__title">{name}</h3>
      <dl className="card__list">
        <dt>Rate</dt>
        <dd>{formatCurrency(baseHourlyRate)} / hour</dd>
        <dt>Capacity</dt>
        <dd>{capacity} people</dd>
      </dl>
    </article>
  );
};
