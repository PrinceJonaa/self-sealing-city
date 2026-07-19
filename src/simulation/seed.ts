import type { Building, Citizen, CorrectionRouteEdge, CorrectionRouteNode, Relationship, WorldSnapshot } from './types';
import { SeededRandom } from './random';
import { crisisDeck } from '../content/crises';

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value * 100) / 100));

export function createInitialWorld(seed = 418): WorldSnapshot {
  const random = new SeededRandom(seed);
  const buildings: Building[] = [
    { id: 'waterworks', name: 'North Pressure Works', kind: 'utility', districtId: 'northworks', position: [-9, 3], integrity: 68, culture: 'efficient', routeNodeIds: ['sensor', 'engineering-review'] },
    { id: 'hospital', name: 'Mercy Public Hospital', kind: 'hospital', districtId: 'riverward', position: [8, 5], integrity: 74, culture: 'cautious', routeNodeIds: ['clinical-impact', 'hospital-escalation'] },
    { id: 'archive', name: 'Civic Memory Archive', kind: 'archive', districtId: 'old-center', position: [6, -8], integrity: 82, culture: 'open', routeNodeIds: ['audit-record'] },
    { id: 'tower', name: 'Central Civic Tower', kind: 'government', districtId: 'old-center', position: [0, 0], integrity: 76, culture: 'efficient', routeNodeIds: ['executive-decision'] },
    { id: 'press', name: 'The Signal Press', kind: 'press', districtId: 'old-center', position: [-6, -8], integrity: 64, culture: 'volatile', routeNodeIds: ['press-verification'] },
    { id: 'court', name: 'Public Review Court', kind: 'court', districtId: 'old-center', position: [11, -5], integrity: 77, culture: 'cautious', routeNodeIds: ['court-protection'] },
    { id: 'school', name: 'River Technical School', kind: 'school', districtId: 'riverward', position: [12, 11], integrity: 71, culture: 'open', routeNodeIds: ['expertise-pipeline'] },
    { id: 'transit', name: 'Crossline Transit Control', kind: 'transit', districtId: 'northworks', position: [-13, -7], integrity: 62, culture: 'silent', routeNodeIds: ['transit-access'] },
  ];

  const names = ['Mara Vale', 'Ilya Chen', 'Noor Reyes', 'Tomas Bell', 'Evelyn Hart'];
  const namedRoles: Citizen['role'][] = ['engineer', 'nurse', 'archivist', 'director', 'inspector'];
  const buildingIds = buildings.map((building) => building.id);
  const citizens: Citizen[] = Array.from({ length: 30 }, (_, index) => {
    const named = index < names.length;
    const role: Citizen['role'] = named ? namedRoles[index]! : random.pick(['resident', 'engineer', 'nurse', 'resident', 'resident']);
    const buildingId = named ? ['waterworks', 'hospital', 'archive', 'tower', 'waterworks'][index]! : random.pick(buildingIds);
    const building = buildings.find((candidate) => candidate.id === buildingId)!;
    return {
      id: `citizen-${index + 1}`,
      name: named ? names[index]! : `Citizen ${String(index + 1).padStart(2, '0')}`,
      role,
      buildingId,
      position: [building.position[0] + random.between(-2.4, 2.4), building.position[1] + random.between(-2.4, 2.4)],
      trust: clamp(random.between(38, 82)),
      dissent: clamp(random.between(25, 88)),
      caution: clamp(random.between(30, 90)),
      loyalty: clamp(random.between(28, 86)),
      stress: clamp(random.between(8, 38)),
      goal: named && index === 0 ? 'Prevent another pressure rupture' : named && index === 1 ? 'Keep vulnerable patients safe' : 'Keep daily life stable',
      knownFactIds: index === 0 ? ['fact-pressure-repeat'] : [],
      relationshipIds: [],
      memoryIds: [],
      named,
    };
  });

  const relationships: Relationship[] = [
    { id: 'rel-mara-tomas', fromCitizenId: 'citizen-1', toCitizenId: 'citizen-4', kind: 'supervisor', trust: 34 },
    { id: 'rel-mara-noor', fromCitizenId: 'citizen-1', toCitizenId: 'citizen-3', kind: 'friend', trust: 78 },
    { id: 'rel-noor-evelyn', fromCitizenId: 'citizen-3', toCitizenId: 'citizen-5', kind: 'source', trust: 61 },
  ];
  relationships.forEach((relationship) => {
    citizens.find((citizen) => citizen.id === relationship.fromCitizenId)?.relationshipIds.push(relationship.id);
  });

  const routeNodes: CorrectionRouteNode[] = [
    { id: 'sensor', buildingId: 'waterworks', label: 'Pressure anomaly sensor', function: 'detect', access: 74, blocked: false },
    { id: 'engineering-review', buildingId: 'waterworks', label: 'Independent engineering review', function: 'validate', access: 58, blocked: false },
    { id: 'clinical-impact', buildingId: 'hospital', label: 'Patient-risk attribution', function: 'attribute', access: 64, blocked: false },
    { id: 'hospital-escalation', buildingId: 'hospital', label: 'Clinical escalation channel', function: 'escalate', access: 61, blocked: false },
    { id: 'executive-decision', buildingId: 'tower', label: 'Civic response authority', function: 'respond', access: 55, blocked: false },
    { id: 'audit-record', buildingId: 'archive', label: 'Protected audit record', function: 'audit', access: 70, blocked: false },
  ];

  const routeEdges: CorrectionRouteEdge[] = [
    { id: 'edge-1', from: 'sensor', to: 'engineering-review', kind: 'information', strength: 62, delay: 1 },
    { id: 'edge-2', from: 'engineering-review', to: 'clinical-impact', kind: 'dependency', strength: 54, delay: 2 },
    { id: 'edge-3', from: 'clinical-impact', to: 'hospital-escalation', kind: 'authority', strength: 66, delay: 1 },
    { id: 'edge-4', from: 'hospital-escalation', to: 'executive-decision', kind: 'authority', strength: 52, delay: 2 },
    { id: 'edge-5', from: 'executive-decision', to: 'audit-record', kind: 'information', strength: 72, delay: 1 },
    { id: 'edge-6', from: 'audit-record', to: 'engineering-review', kind: 'trust', strength: 58, delay: 2 },
    { id: 'edge-7', from: 'press-verification', to: 'executive-decision', kind: 'information', strength: 48, delay: 1 },
    { id: 'edge-8', from: 'court-protection', to: 'engineering-review', kind: 'authority', strength: 64, delay: 2 },
    { id: 'edge-9', from: 'expertise-pipeline', to: 'clinical-impact', kind: 'resource', strength: 57, delay: 4 },
    { id: 'edge-10', from: 'transit-access', to: 'hospital-escalation', kind: 'dependency', strength: 51, delay: 2 },
  ];

  return {
    schemaVersion: 1,
    seed,
    tick: 0,
    metrics: { performance: 72, routeAccess: 63, stability: 74, correctionDebt: 18, legitimacy: 65, publicTrust: 62, reviewCapacity: 68 },
    buildings,
    districts: [
      { id: 'northworks', name: 'Northworks', character: 'Industrial, efficient, and increasingly silent', population: 18200, stress: 41 },
      { id: 'riverward', name: 'River Ward', character: 'Hospital, school, and dense residential life', population: 26400, stress: 35 },
      { id: 'old-center', name: 'Old Center', character: 'Government, archive, press, and public review', population: 12100, stress: 29 },
    ],
    citizens,
    relationships,
    facts: [{ id: 'fact-pressure-repeat', tick: 0, statement: 'The pressure anomaly has appeared three times in separated locations.', sourceEventId: 'seed-event', reliability: 78, visibleToCitizenIds: ['citizen-1'], public: false }],
    memories: [],
    routeNodes: [
      ...routeNodes,
      { id: 'press-verification', buildingId: 'press', label: 'Independent public verification', function: 'validate', access: 48, blocked: false },
      { id: 'court-protection', buildingId: 'court', label: 'Whistleblower protection', function: 'escalate', access: 64, blocked: false },
      { id: 'expertise-pipeline', buildingId: 'school', label: 'Independent expertise pipeline', function: 'attribute', access: 57, blocked: false },
      { id: 'transit-access', buildingId: 'transit', label: 'Inspector physical access', function: 'detect', access: 51, blocked: false },
    ],
    routeEdges,
    crisis: structuredClone(crisisDeck[0]!),
    crisisDeck: structuredClone(crisisDeck),
    activeCrisisIndex: 0,
    viewpoint: { mode: 'steward', controlledCitizenId: null, institutionId: null, cameraScale: 'city', knowledgeScope: 'public' },
    authority: { canIssuePolicy: true, canProtectDissent: true, canFundInvestigation: true, canOverrideDecision: true, canPublishEvidence: true },
    eventLog: [],
    commandLog: [],
  };
}
