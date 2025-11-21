export interface RoomEntity {
  id: string;
  name: string;
  baseHourlyRate: number;
  capacity: number;
}

export type RoomPayload = Omit<RoomEntity, 'id'>;

class RoomRepository {
  private rooms: RoomEntity[] = [];

  private generateId() {
    return `room_${Math.random().toString(36).slice(2, 10)}`;
  }

  findAll() {
    return Promise.resolve([...this.rooms]);
  }

  findById(id: string) {
    const room = this.rooms.find((entry) => entry.id === id) ?? null;
    return Promise.resolve(room);
  }

  create(payload: RoomPayload) {
    const entity: RoomEntity = { id: this.generateId(), ...payload };
    this.rooms.push(entity);
    return Promise.resolve(entity);
  }

  reset() {
    this.rooms = [];
    return Promise.resolve();
  }
}

export const RoomModel = new RoomRepository();
