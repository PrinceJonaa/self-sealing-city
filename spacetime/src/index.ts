import { ScheduleAt } from 'spacetimedb';
import { schema, table, t } from 'spacetimedb/server';

const city = table({ public: true }, {
  id: t.string().primaryKey(),
  name: t.string(),
  seed: t.u32(),
  tick: t.u64(),
  performance: t.f64(),
  routeAccess: t.f64(),
  stability: t.f64(),
  correctionDebt: t.f64(),
  legitimacy: t.f64(),
  publicTrust: t.f64(),
  reviewCapacity: t.f64(),
  activeCrisisId: t.string(),
});

const citizen = table({ public: true }, {
  id: t.string().primaryKey(),
  cityId: t.string().index('btree'),
  name: t.string(),
  role: t.string(),
  buildingId: t.string(),
  named: t.bool(),
  publicStateJson: t.string(),
});

const building = table({ public: true }, {
  id: t.string().primaryKey(),
  cityId: t.string().index('btree'),
  districtId: t.string(),
  name: t.string(),
  kind: t.string(),
  stateJson: t.string(),
});

const relationship = table({}, {
  id: t.string().primaryKey(),
  cityId: t.string().index('btree'),
  fromCitizenId: t.string().index('btree'),
  toCitizenId: t.string(),
  kind: t.string(),
  trust: t.f64(),
});

const knowledgeFact = table({}, {
  id: t.string().primaryKey(),
  cityId: t.string().index('btree'),
  statement: t.string(),
  reliability: t.f64(),
  public: t.bool(),
  visibilityJson: t.string(),
  sourceEventId: t.string(),
});

const citizenMemory = table({}, {
  id: t.string().primaryKey(),
  cityId: t.string().index('btree'),
  citizenId: t.string().index('btree'),
  eventId: t.string(),
  summary: t.string(),
  structuredEffectsJson: t.string(),
});

const correctionRoute = table({ public: true }, {
  id: t.string().primaryKey(),
  cityId: t.string().index('btree'),
  fromNodeId: t.string(),
  toNodeId: t.string(),
  kind: t.string(),
  strength: t.f64(),
  blocked: t.bool(),
});

const worldEvent = table({ public: true }, {
  id: t.string().primaryKey(),
  cityId: t.string().index('btree'),
  tick: t.u64(),
  eventType: t.string(),
  title: t.string(),
  factualSummary: t.string(),
  provenance: t.string(),
  effectsJson: t.string(),
});

const proposal = table({ public: true }, {
  id: t.string().primaryKey(),
  cityId: t.string().index('btree'),
  proposer: t.identity(),
  title: t.string(),
  commandJson: t.string(),
  status: t.string(),
  createdTick: t.u64(),
});

const vote = table({ public: true }, {
  id: t.string().primaryKey(),
  cityId: t.string().index('btree'),
  proposalId: t.string().index('btree'),
  voter: t.identity(),
  support: t.bool(),
  weight: t.f64(),
});

const playerRole = table({ public: true }, {
  identity: t.identity().primaryKey(),
  cityId: t.string().index('btree'),
  displayName: t.string(),
  role: t.string(),
  connected: t.bool(),
});

const playerIntervention = table({ public: true }, {
  id: t.string().primaryKey(),
  cityId: t.string().index('btree'),
  player: t.identity(),
  tick: t.u64(),
  kind: t.string(),
  targetId: t.string(),
  accepted: t.bool(),
});

const narrativeJob = table({}, {
  id: t.string().primaryKey(),
  cityId: t.string().index('btree'),
  citizenId: t.string(),
  requestedBy: t.identity(),
  requestJson: t.string(),
  status: t.string(),
});

const generatedNarrative = table({}, {
  id: t.string().primaryKey(),
  cityId: t.string().index('btree'),
  jobId: t.string().unique(),
  citizenId: t.string(),
  resultJson: t.string(),
  providerLabel: t.string(),
});

const scheduledSimulationTask = table(
  { scheduled: (): any => simulation_tick },
  {
    id: t.u64().primaryKey(),
    scheduledAt: t.scheduleAt(),
    cityId: t.string(),
  },
);

const spacetimedb = schema({ city, citizen, building, relationship, knowledgeFact, citizenMemory, correctionRoute, worldEvent, proposal, vote, playerRole, playerIntervention, narrativeJob, generatedNarrative, scheduledSimulationTask });
export default spacetimedb;

const bounded = (value: number) => Math.max(0, Math.min(100, value));
const allowedInterventions = ['protect_engineer', 'fund_investigation', 'contain_system', 'raise_threshold', 'publish_evidence', 'centralize_authority', 'delegate_to_institution', 'abstain'];

export const init = spacetimedb.init((ctx) => {
  ctx.db.city.insert({ id: 'open-city', name: 'The Self-Sealing City', seed: 418, tick: 0n, performance: 72, routeAccess: 63, stability: 74, correctionDebt: 18, legitimacy: 65, publicTrust: 62, reviewCapacity: 68, activeCrisisId: 'pressure-crisis' });
  [
    ['waterworks', 'northworks', 'North Pressure Works', 'utility'], ['hospital', 'riverward', 'Mercy Public Hospital', 'hospital'],
    ['archive', 'old-center', 'Civic Memory Archive', 'archive'], ['tower', 'old-center', 'Central Civic Tower', 'government'],
    ['press', 'old-center', 'The Signal Press', 'press'], ['court', 'old-center', 'Public Review Court', 'court'],
    ['school', 'riverward', 'River Technical School', 'school'], ['transit', 'northworks', 'Crossline Transit Control', 'transit'],
  ].forEach(([id, districtId, name, kind]) => ctx.db.building.insert({ id: id!, cityId: 'open-city', districtId: districtId!, name: name!, kind: kind!, stateJson: '{"integrity":70}' }));
  [
    ['mara', 'Mara Vale', 'engineer', 'waterworks'], ['ilya', 'Ilya Chen', 'nurse', 'hospital'], ['noor', 'Noor Reyes', 'archivist', 'archive'],
    ['tomas', 'Tomas Bell', 'director', 'tower'], ['evelyn', 'Evelyn Hart', 'inspector', 'waterworks'],
  ].forEach(([id, name, role, buildingId]) => ctx.db.citizen.insert({ id: id!, cityId: 'open-city', name: name!, role: role!, buildingId: buildingId!, named: true, publicStateJson: '{"stress":20,"trust":60}' }));
  [
    ['route-1', 'sensor', 'engineering-review', 'information', 62], ['route-2', 'engineering-review', 'clinical-impact', 'dependency', 54],
    ['route-3', 'clinical-impact', 'hospital-escalation', 'authority', 66], ['route-4', 'hospital-escalation', 'executive-decision', 'authority', 52],
    ['route-5', 'executive-decision', 'audit-record', 'information', 72],
  ].forEach(([id, fromNodeId, toNodeId, kind, strength]) => ctx.db.correctionRoute.insert({ id: id as string, cityId: 'open-city', fromNodeId: fromNodeId as string, toNodeId: toNodeId as string, kind: kind as string, strength: strength as number, blocked: false }));
  ctx.db.scheduledSimulationTask.insert({ id: 1n, scheduledAt: ScheduleAt.interval(5_000_000n), cityId: 'open-city' });
});

export const on_disconnect = spacetimedb.clientDisconnected((ctx) => {
  const role = ctx.db.playerRole.identity.find(ctx.sender);
  if (role) ctx.db.playerRole.identity.update({ ...role, connected: false });
});

export const join_city = spacetimedb.reducer({ displayName: t.string(), requestedRole: t.string() }, (ctx, { displayName, requestedRole }) => {
  const safeRole = ['steward', 'embodied', 'institution'].includes(requestedRole) ? requestedRole : 'steward';
  const existing = ctx.db.playerRole.identity.find(ctx.sender);
  if (existing) ctx.db.playerRole.identity.update({ ...existing, displayName: displayName.slice(0, 48), role: safeRole, connected: true });
  else ctx.db.playerRole.insert({ identity: ctx.sender, cityId: 'open-city', displayName: displayName.slice(0, 48), role: safeRole, connected: true });
});

export const submit_intervention = spacetimedb.reducer({ kind: t.string(), targetId: t.string() }, (ctx, { kind, targetId }) => {
  const role = ctx.db.playerRole.identity.find(ctx.sender);
  if (!role || role.cityId !== 'open-city') throw new Error('Join the city before intervening.');
  if (!allowedInterventions.includes(kind)) throw new Error('Unknown intervention.');
  const current = ctx.db.city.id.find('open-city');
  if (!current) throw new Error('City state is unavailable.');
  const effects: Record<string, [number, number, number, number, number, number, number]> = {
    protect_engineer: [-3, 10, 0, -4, 3, 0, -5],
    fund_investigation: [-2, 8, 1, -3, 2, 0, -10],
    contain_system: [-8, 2, 9, -6, 1, 2, -6],
    raise_threshold: [7, -11, -3, 12, -2, -2, 2],
    publish_evidence: [-1, 4, -4, -1, 5, 7, -3],
    centralize_authority: [6, -8, 5, 7, -9, -5, 2],
    delegate_to_institution: [-2, 4, 1, -2, 5, 1, -3],
    abstain: [1, 0, 0, 5, -1, -3, 0],
  };
  const effect = effects[kind]!;
  ctx.db.city.id.update({ ...current, performance: bounded(current.performance + effect[0]), routeAccess: bounded(current.routeAccess + effect[1]), stability: bounded(current.stability + effect[2]), correctionDebt: bounded(current.correctionDebt + effect[3]), legitimacy: bounded(current.legitimacy + effect[4]), publicTrust: bounded(current.publicTrust + effect[5]), reviewCapacity: bounded(current.reviewCapacity + effect[6]) });
  const id = ctx.newUuidV7().toString();
  ctx.db.playerIntervention.insert({ id, cityId: current.id, player: ctx.sender, tick: current.tick, kind, targetId, accepted: true });
  ctx.db.worldEvent.insert({ id: ctx.newUuidV7().toString(), cityId: current.id, tick: current.tick, eventType: 'intervention', title: kind.replaceAll('_', ' '), factualSummary: `A player intervention of type ${kind} was accepted by the authoritative city reducer.`, provenance: 'player', effectsJson: JSON.stringify(effect) });
});

export const create_proposal = spacetimedb.reducer({ title: t.string(), commandJson: t.string() }, (ctx, { title, commandJson }) => {
  const role = ctx.db.playerRole.identity.find(ctx.sender);
  if (!role) throw new Error('Join the city before proposing action.');
  const current = ctx.db.city.id.find(role.cityId);
  if (!current) throw new Error('City state is unavailable.');
  ctx.db.proposal.insert({ id: ctx.newUuidV7().toString(), cityId: role.cityId, proposer: ctx.sender, title: title.slice(0, 120), commandJson, status: 'open', createdTick: current.tick });
});

export const cast_vote = spacetimedb.reducer({ proposalId: t.string(), support: t.bool() }, (ctx, { proposalId, support }) => {
  const role = ctx.db.playerRole.identity.find(ctx.sender);
  const target = ctx.db.proposal.id.find(proposalId);
  if (!role || !target || target.cityId !== role.cityId || target.status !== 'open') throw new Error('This proposal is unavailable.');
  const weight = role.role === 'steward' ? 1.25 : role.role === 'institution' ? 1.1 : 1;
  ctx.db.vote.insert({ id: ctx.newUuidV7().toString(), cityId: role.cityId, proposalId, voter: ctx.sender, support, weight });
});

export const queue_narrative_job = spacetimedb.reducer({ citizenId: t.string(), requestJson: t.string() }, (ctx, { citizenId, requestJson }) => {
  const role = ctx.db.playerRole.identity.find(ctx.sender);
  if (!role) throw new Error('Join the city before requesting narration.');
  if (requestJson.length > 16_000) throw new Error('Narrative request is too large.');
  ctx.db.narrativeJob.insert({ id: ctx.newUuidV7().toString(), cityId: role.cityId, citizenId, requestedBy: ctx.sender, requestJson, status: 'queued' });
});

export const simulation_tick = spacetimedb.reducer({ task: scheduledSimulationTask.rowType }, (ctx, { task }) => {
  const current = ctx.db.city.id.find(task.cityId);
  if (!current) return;
  const recurrence = current.tick > 0n && current.tick % 12n === 0n;
  ctx.db.city.id.update({ ...current, tick: current.tick + 1n, correctionDebt: bounded(current.correctionDebt + 0.18), stability: bounded(current.stability + (recurrence ? -1.5 : 0)), performance: bounded(current.performance + (recurrence ? -1 : 0)) });
});
