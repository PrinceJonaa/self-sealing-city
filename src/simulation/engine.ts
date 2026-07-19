import type { AdvanceResult, CityMetrics, InterventionKind, WorldCommand, WorldEvent, WorldSnapshot } from './types';

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value * 100) / 100));

const interventionEffects: Record<InterventionKind, Partial<CityMetrics>> = {
  protect_engineer: { routeAccess: 10, legitimacy: 3, reviewCapacity: -5, correctionDebt: -4, performance: -3 },
  fund_investigation: { routeAccess: 8, reviewCapacity: -10, evidence: undefined } as Partial<CityMetrics>,
  contain_system: { stability: 9, performance: -8, correctionDebt: -6, publicTrust: 2 },
  raise_threshold: { performance: 7, routeAccess: -11, correctionDebt: 12, stability: -3 },
  publish_evidence: { publicTrust: 7, legitimacy: 5, stability: -4, routeAccess: 4 },
  centralize_authority: { performance: 6, stability: 5, legitimacy: -9, routeAccess: -8, correctionDebt: 7 },
  delegate_to_institution: { legitimacy: 5, routeAccess: 4, performance: -2, reviewCapacity: -3 },
  abstain: { performance: 1, correctionDebt: 5, publicTrust: -3 },
};

function applyMetrics(metrics: CityMetrics, effects: Partial<CityMetrics>): CityMetrics {
  return Object.fromEntries(Object.entries(metrics).map(([key, value]) => [key, clamp(value + (effects[key as keyof CityMetrics] || 0))])) as CityMetrics;
}

function makeEvent(snapshot: WorldSnapshot, command: WorldCommand, title: string, summary: string, effects: Partial<CityMetrics>): WorldEvent {
  return {
    id: `event-${snapshot.tick}-${snapshot.eventLog.length + 1}-${command.id}`,
    tick: snapshot.tick,
    type: command.type,
    title,
    factualSummary: summary,
    actorIds: command.type === 'intervene' ? ['player-steward'] : [],
    buildingIds: snapshot.crisis.implicatedBuildingIds,
    factIds: [],
    effects,
    provenance: command.type === 'intervene' ? 'player' : 'simulation',
  };
}

function applyIntervention(snapshot: WorldSnapshot, command: Extract<WorldCommand, { type: 'intervene' }>): AdvanceResult {
  const effects = interventionEffects[command.kind];
  const titles: Record<InterventionKind, [string, string]> = {
    protect_engineer: ['Dissent receives protection', 'The junior engineer retains access to an independent review channel.'],
    fund_investigation: ['Investigation funded', 'Review capacity is committed to discriminating tests across the pressure network.'],
    contain_system: ['Water network contained', 'The affected sector is isolated while the discrepancy remains preserved for review.'],
    raise_threshold: ['Alert threshold raised', 'The dashboard clears, but the recurring cause remains unresolved.'],
    publish_evidence: ['Evidence published', 'Verified anomaly records enter the public account and institutional debate.'],
    centralize_authority: ['Emergency authority centralized', 'The response accelerates while local correction routes lose governing force.'],
    delegate_to_institution: ['Authority delegated', 'The hospital and engineering review board receive bounded decision authority.'],
    abstain: ['Steward abstains', 'The city proceeds through its existing institutional balance without direct intervention.'],
  };
  const event = makeEvent(snapshot, command, titles[command.kind][0], titles[command.kind][1], effects);
  const routeNodes = snapshot.routeNodes.map((node) => {
    const delta = command.kind === 'protect_engineer' && node.function === 'validate' ? 14 : command.kind === 'raise_threshold' && node.function === 'detect' ? -30 : 0;
    return { ...node, access: clamp(node.access + delta), blocked: clamp(node.access + delta) < 20 };
  });
  const evidenceDelta = command.kind === 'fund_investigation' ? 24 : command.kind === 'publish_evidence' ? 8 : command.kind === 'raise_threshold' ? -5 : 0;
  const awarenessDelta = command.kind === 'publish_evidence' ? 35 : command.kind === 'contain_system' ? 9 : 3;
  const crisisStage = command.kind === 'contain_system' ? 'contained' : command.kind === 'raise_threshold' ? 'contested' : 'decision';
  const citizens = snapshot.citizens.map((citizen) => ({
    ...citizen,
    dissent: clamp(citizen.dissent + (command.kind === 'protect_engineer' && citizen.id === 'citizen-1' ? 16 : command.kind === 'centralize_authority' ? -4 : 0)),
    trust: clamp(citizen.trust + (command.kind === 'publish_evidence' ? 3 : command.kind === 'centralize_authority' ? -6 : 0)),
    stress: clamp(citizen.stress + (command.kind === 'contain_system' ? -4 : command.kind === 'raise_threshold' ? 4 : 0)),
  }));
  const memories = snapshot.citizens.filter((citizen) => citizen.named).map((citizen) => ({
    id: `memory-${event.id}-${citizen.id}`,
    citizenId: citizen.id,
    eventId: event.id,
    summary: `${citizen.name} remembers that the steward chose to ${command.kind.replaceAll('_', ' ')} during ${snapshot.crisis.title}.`,
    beliefChanges: { stewardLegitimacy: effects.legitimacy || 0, correctionAccess: effects.routeAccess || 0 },
    emotionalResidue: command.kind === 'centralize_authority' ? 'wariness' : command.kind === 'protect_engineer' ? 'guarded relief' : 'uncertainty',
    futureTrigger: `another ${snapshot.crisis.originBuildingId} discrepancy`,
  }));
  const facts = command.kind === 'publish_evidence' ? snapshot.facts.map((fact) => ({ ...fact, public: true })) : snapshot.facts;
  const buildings = snapshot.buildings.map((building) => command.kind === 'delegate_to_institution' && snapshot.crisis.implicatedBuildingIds.includes(building.id) ? { ...building, culture: 'open' as const } : building);
  const next = {
    ...snapshot,
    metrics: applyMetrics(snapshot.metrics, effects),
    buildings,
    citizens,
    facts,
    memories: [...snapshot.memories, ...memories],
    routeNodes,
    crisis: { ...snapshot.crisis, stage: crisisStage as WorldSnapshot['crisis']['stage'], evidence: clamp(snapshot.crisis.evidence + evidenceDelta), publicAwareness: clamp(snapshot.crisis.publicAwareness + awarenessDelta) },
    eventLog: [...snapshot.eventLog, event],
    commandLog: [...snapshot.commandLog, command],
  };
  next.crisisDeck = next.crisisDeck.map((crisis, index) => index === next.activeCrisisIndex ? next.crisis : crisis);
  return { snapshot: next, events: [event] };
}

function tickWorld(snapshot: WorldSnapshot, command: Extract<WorldCommand, { type: 'tick' }>): AdvanceResult {
  let next = snapshot;
  const events: WorldEvent[] = [];
  for (let index = 0; index < command.ticks; index += 1) {
    const tick = next.tick + 1;
    const debtPressure = next.metrics.correctionDebt > 55 ? 1.2 : 0.25;
    const recurrence = tick % 6 === 0 && next.crisis.stage !== 'resolved';
    const metrics = applyMetrics(next.metrics, { correctionDebt: debtPressure, stability: recurrence ? -3 : 0, performance: recurrence ? -2 : 0 });
    next = { ...next, tick, metrics, citizens: next.citizens.map((citizen, citizenIndex) => ({ ...citizen, stress: clamp(citizen.stress + (recurrence && citizenIndex < 8 ? 4 : -0.2)) })) };
    if (recurrence) {
      const event = makeEvent(next, command, `${next.crisis.title} recurs`, `A matching discrepancy appears across ${next.crisis.implicatedBuildingIds.join(' and ')}.`, { stability: -3, performance: -2 });
      events.push(event);
      next = { ...next, crisis: { ...next.crisis, recurrence: next.crisis.recurrence + 1, severity: clamp(next.crisis.severity + 5), evidence: clamp(next.crisis.evidence + 8) }, eventLog: [...next.eventLog, event] };
    }
  }
  next = { ...next, commandLog: [...next.commandLog, command] };
  return { snapshot: next, events };
}

function advanceCrisis(snapshot: WorldSnapshot, command: Extract<WorldCommand, { type: 'advance_crisis' }>): AdvanceResult {
  const current = { ...snapshot.crisis, stage: snapshot.crisis.stage === 'contained' ? 'resolved' as const : snapshot.metrics.correctionDebt > 58 ? 'failed' as const : 'resolved' as const };
  const crisisDeck = snapshot.crisisDeck.map((crisis, index) => index === snapshot.activeCrisisIndex ? current : crisis);
  const campaignFinished = snapshot.activeCrisisIndex >= crisisDeck.length - 1;
  const nextIndex = campaignFinished ? snapshot.activeCrisisIndex : snapshot.activeCrisisIndex + 1;
  const nextCrisis = campaignFinished ? current : { ...crisisDeck[nextIndex]!, stage: 'detected' as const };
  crisisDeck[nextIndex] = nextCrisis;
  const event = makeEvent(snapshot, command, `Case closed: ${current.title}`, current.stage === 'failed' ? 'The unresolved dependency produced a system failure and entered the city archive.' : 'The city closes the active case and carries its structural consequences forward.', {});
  return { snapshot: { ...snapshot, crisisDeck, crisis: nextCrisis, activeCrisisIndex: nextIndex, eventLog: [...snapshot.eventLog, event], commandLog: [...snapshot.commandLog, command] }, events: [event] };
}

export function advanceWorld(snapshot: WorldSnapshot, commands: WorldCommand[]): AdvanceResult {
  let next = structuredClone(snapshot);
  const events: WorldEvent[] = [];
  for (const command of commands) {
    let result: AdvanceResult;
    if (command.type === 'tick') result = tickWorld(next, command);
    else if (command.type === 'intervene') result = applyIntervention(next, command);
    else if (command.type === 'advance_crisis') result = advanceCrisis(next, command);
    else {
      result = { snapshot: { ...next, viewpoint: command.viewpoint, commandLog: [...next.commandLog, command] }, events: [] };
    }
    next = result.snapshot;
    events.push(...result.events);
  }
  return { snapshot: next, events };
}

export function replayWorld(initial: WorldSnapshot, commands: WorldCommand[]): WorldSnapshot {
  return advanceWorld({ ...structuredClone(initial), eventLog: [], commandLog: [] }, commands).snapshot;
}

export function routeReachability(snapshot: WorldSnapshot): { reachable: boolean; score: number; path: string[] } {
  const nodes = new Map(snapshot.routeNodes.map((node) => [node.id, node]));
  const queue: Array<{ id: string; score: number; path: string[] }> = [{ id: 'sensor', score: nodes.get('sensor')?.access || 0, path: ['sensor'] }];
  const visited = new Set<string>();
  while (queue.length) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    if (current.id === 'audit-record') return { reachable: true, score: clamp(current.score), path: current.path };
    snapshot.routeEdges.filter((edge) => edge.from === current.id).forEach((edge) => {
      const target = nodes.get(edge.to);
      if (!target || target.blocked) return;
      queue.push({ id: target.id, score: Math.min(current.score, edge.strength, target.access), path: [...current.path, target.id] });
    });
  }
  return { reachable: false, score: 0, path: [] };
}
