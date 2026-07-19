import type { InterventionKind, WorldSnapshot } from '../simulation/types';

export type SharedCityRole = 'steward' | 'embodied' | 'institution';
export type SharedCityStatus = 'offline' | 'connecting' | 'connected' | 'error';

export type SharedCityState = {
  status: SharedCityStatus;
  detail: string;
  onlinePlayers: number;
  tick: number;
};

export interface SpacetimeBindingsAdapter {
  connect(options: { uri: string; database: string; token?: string }): Promise<void>;
  disconnect(): void;
  joinCity(displayName: string, role: SharedCityRole): Promise<void>;
  submitIntervention(kind: InterventionKind, targetId: string): Promise<void>;
  subscribe(listener: (state: SharedCityState) => void): () => void;
}

export class SharedCityAuthority {
  constructor(private readonly adapter: SpacetimeBindingsAdapter) {}

  async connect(options: { uri: string; database: string; displayName: string; role: SharedCityRole; token?: string }) {
    await this.adapter.connect(options);
    await this.adapter.joinCity(options.displayName, options.role);
  }

  disconnect() { this.adapter.disconnect(); }
  intervene(kind: InterventionKind, targetId = '') { return this.adapter.submitIntervention(kind, targetId); }
  subscribe(listener: (state: SharedCityState) => void) { return this.adapter.subscribe(listener); }
}

/**
 * Development authority with the same interface as generated SpacetimeDB bindings.
 * It proves UI/reducer boundaries without pretending to provide persistence.
 */
export class LocalSharedCityAdapter implements SpacetimeBindingsAdapter {
  private listeners = new Set<(state: SharedCityState) => void>();
  private state: SharedCityState = { status: 'offline', detail: 'Solo authority', onlinePlayers: 1, tick: 0 };
  constructor(private readonly getWorld: () => WorldSnapshot) {}
  private emit() { this.listeners.forEach((listener) => listener(this.state)); }
  async connect() { this.state = { status: 'connected', detail: 'Local shared-session preview', onlinePlayers: 1, tick: this.getWorld().tick }; this.emit(); }
  disconnect() { this.state = { ...this.state, status: 'offline', detail: 'Solo authority' }; this.emit(); }
  async joinCity() { this.state = { ...this.state, tick: this.getWorld().tick }; this.emit(); }
  async submitIntervention() { this.state = { ...this.state, tick: this.getWorld().tick }; this.emit(); }
  subscribe(listener: (state: SharedCityState) => void) { this.listeners.add(listener); listener(this.state); return () => this.listeners.delete(listener); }
}
