import type { WorldSnapshot } from '../simulation/types';
import { routeReachability } from '../simulation/engine';

export type CityArchive = {
  generatedAtTick: number;
  officialHistory: string[];
  dissidentRecord: string[];
  causalRecord: string[];
  routeMap: { reachable: boolean; score: number; path: string[]; blocked: string[] };
  biographies: Array<{ name: string; role: string; account: string }>;
  unresolvedQuestions: string[];
};

export function buildCityArchive(world: WorldSnapshot): CityArchive {
  const route = routeReachability(world);
  const named = world.citizens.filter((citizen) => citizen.named);
  const officialHistory = world.eventLog.map((event) => `T${event.tick}: ${event.title}. ${event.factualSummary}`);
  const dissentEvents = world.eventLog.filter((event) => event.title.toLowerCase().includes('dissent') || event.title.toLowerCase().includes('evidence'));
  const dissidentRecord = named.map((citizen) => {
    const privateFacts = world.facts.filter((fact) => fact.visibleToCitizenIds.includes(citizen.id) && !fact.public);
    return `${citizen.name} (${citizen.role}) retained ${privateFacts.length} non-public fact${privateFacts.length === 1 ? '' : 's'} and dissent access ${Math.round(citizen.dissent)}.`;
  }).concat(dissentEvents.map((event) => `${event.title}: ${event.factualSummary}`));
  const causalRecord = world.crisisDeck.map((crisis, index) => {
    const active = index === world.activeCrisisIndex ? 'active' : crisis.stage;
    return `${crisis.title}: origin ${crisis.originBuildingId}; implicated ${crisis.implicatedBuildingIds.join(', ')}; evidence ${Math.round(crisis.evidence)}; status ${active}.`;
  });
  const biographies = named.map((citizen) => ({
    name: citizen.name,
    role: citizen.role,
    account: `${citizen.goal}. Trust ${Math.round(citizen.trust)}, dissent ${Math.round(citizen.dissent)}, stress ${Math.round(citizen.stress)}. The archive records ${world.memories.filter((memory) => memory.citizenId === citizen.id).length} durable memories.`,
  }));
  const unresolvedQuestions = [
    ...(world.crisis.stage === 'resolved' ? [] : [`Who remains accountable for “${world.crisis.title}”?`]),
    ...(world.metrics.correctionDebt > 45 ? ['Which local repairs concealed structural correction debt?'] : []),
    ...(route.reachable ? [] : ['Which blocked dependency severed the route to audit?']),
    ...(world.facts.some((fact) => !fact.public) ? ['Which reliable facts never entered the public record?'] : []),
  ];
  return {
    generatedAtTick: world.tick,
    officialHistory: officialHistory.length ? officialHistory : ['No governing decision has entered the official history.'],
    dissidentRecord,
    causalRecord,
    routeMap: { reachable: route.reachable, score: route.score, path: route.path, blocked: world.routeNodes.filter((node) => node.blocked).map((node) => node.label) },
    biographies,
    unresolvedQuestions: unresolvedQuestions.length ? unresolvedQuestions : ['No unresolved contradiction is currently visible from the authoritative state.'],
  };
}

export function researchCsv(world: WorldSnapshot): string {
  const quote = (value: unknown) => `"${String(value).replaceAll('"', '""')}"`;
  const header = ['tick', 'event_id', 'type', 'title', 'provenance', 'summary', 'effects_json'];
  const rows = world.eventLog.map((event) => [event.tick, event.id, event.type, event.title, event.provenance, event.factualSummary, JSON.stringify(event.effects)].map(quote).join(','));
  return [header.join(','), ...rows].join('\n');
}

export function downloadText(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
