// server/RoomManager.ts
// ROOM REGISTRY & MATCHMAKING MANAGER FOR ARENA X

import { ArenaFightRoom } from './rooms/ArenaFightRoom.js';
import { RoomMetadata, RoomVisibility } from './types.js';

export class RoomManager {
  private rooms = new Map<string, ArenaFightRoom>();
  private codeToRoomId = new Map<string, string>();

  constructor() {
    // Periodic sweep for abandoned/empty rooms every 60 seconds
    setInterval(() => this.cleanup(), 60000);
  }

  public createRoom(
    name: string,
    visibility: RoomVisibility = 'PUBLIC',
    password?: string
  ): ArenaFightRoom {
    const id = `room_${Math.random().toString(36).substring(2, 9)}`;
    const code = this.generateUniqueCode();

    const room = new ArenaFightRoom(id, code, name, visibility, password);
    this.rooms.set(id, room);
    this.codeToRoomId.set(code, id);

    return room;
  }

  public getRoomById(id: string): ArenaFightRoom | undefined {
    return this.rooms.get(id);
  }

  public getRoomByCode(code: string): ArenaFightRoom | undefined {
    const id = this.codeToRoomId.get(code.toUpperCase().trim());
    return id ? this.rooms.get(id) : undefined;
  }

  public getPublicRooms(): RoomMetadata[] {
    const list: RoomMetadata[] = [];
    for (const room of this.rooms.values()) {
      if (room.visibility === 'PUBLIC') {
        list.push(room.getMetadata());
      }
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Quick Matchmaking: Finds an existing public waiting room with 1 player.
   * If none exists, creates a fresh public matchmaking room.
   */
  public quickMatch(): ArenaFightRoom {
    // 1. Search for public room with exactly 1 player waiting
    for (const room of this.rooms.values()) {
      if (
        room.visibility === 'PUBLIC' &&
        !room.password &&
        room.status === 'WAITING' &&
        room.clientCount === 1 &&
        room.canJoin().allowed
      ) {
        return room;
      }
    }

    // 2. No room found: create a new matchmaking room
    const roomCount = this.rooms.size + 1;
    return this.createRoom(`Matchmaking Arena #${roomCount}`, 'PUBLIC');
  }

  public removeRoom(id: string): void {
    const room = this.rooms.get(id);
    if (room) {
      this.codeToRoomId.delete(room.code);
      room.dispose();
      this.rooms.delete(id);
    }
  }

  private generateUniqueCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code: string;
    let attempts = 0;
    do {
      let suffix = '';
      for (let i = 0; i < 4; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = `AX-${suffix}`;
      attempts++;
    } while (this.codeToRoomId.has(code) && attempts < 100);

    return code;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, room] of this.rooms.entries()) {
      const meta = room.getMetadata();
      // Remove empty rooms older than 3 minutes
      if (meta.playerCount === 0 && now - meta.createdAt > 180000) {
        this.removeRoom(id);
      }
    }
  }
}
