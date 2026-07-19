export type EntityId = string;
export type Tick = number;

export type CityMetrics = {
  performance: number;
  routeAccess: number;
  stability: number;
  correctionDebt: number;
  legitimacy: number;
  publicTrust: number;
  reviewCapacity: number;
};

export type BuildingKind = 'utility' | 'hospital' | 'archive' | 'government' | 'press' | 'court' | 'school' | 'transit';

export type Building = {
  id: EntityId;
  name: string;
  kind: BuildingKind;
  position: [number, number];
  integrity: number;
  culture: 'open' | 'cautious' | 'efficient' | 'silent' | 'volatile';
  routeNodeIds: EntityId[];
  districtId: EntityId;
};

export type District = {
  id: EntityId;
  name: string;
  character: string;
  population: number;
  stress: number;
};

export type CitizenRole = 'engineer' | 'nurse' | 'archivist' | 'director' | 'journalist' | 'inspector' | 'resident' | 'mayor';

export type Citizen = {
  id: EntityId;
  name: string;
  role: CitizenRole;
  buildingId: EntityId;
  position: [number, number];
  trust: number;
  dissent: number;
  caution: number;
  loyalty: number;
  stress: number;
  goal: string;
  knownFactIds: EntityId[];
  relationshipIds: EntityId[];
  memoryIds: EntityId[];
  named: boolean;
};

export type Relationship = {
  id: EntityId;
  fromCitizenId: EntityId;
  toCitizenId: EntityId;
  kind: 'family' | 'supervisor' | 'colleague' | 'friend' | 'rival' | 'source';
  trust: number;
};

export type KnowledgeFact = {
  id: EntityId;
  tick: Tick;
  statement: string;
  sourceEventId: EntityId;
  reliability: number;
  visibleToCitizenIds: EntityId[];
  public: boolean;
};

export type CitizenMemory = {
  id: EntityId;
  citizenId: EntityId;
  eventId: EntityId;
  summary: string;
  beliefChanges: Record<string, number>;
  emotionalResidue: string;
  futureTrigger: string;
};

export type CorrectionRouteNode = {
  id: EntityId;
  buildingId: EntityId;
  label: string;
  function: 'detect' | 'validate' | 'attribute' | 'escalate' | 'respond' | 'audit';
  access: number;
  blocked: boolean;
};

export type CorrectionRouteEdge = {
  id: EntityId;
  from: EntityId;
  to: EntityId;
  kind: 'information' | 'authority' | 'trust' | 'resource' | 'dependency';
  strength: number;
  delay: number;
};

export type CrisisState = {
  id: EntityId;
  title: string;
  stage: 'latent' | 'detected' | 'contested' | 'decision' | 'contained' | 'resolved' | 'failed';
  severity: number;
  recurrence: number;
  originBuildingId: EntityId;
  implicatedBuildingIds: EntityId[];
  evidence: number;
  publicAwareness: number;
  pendingDecisionId: EntityId | null;
};

export type ViewpointMode = 'steward' | 'embodied' | 'institution';

export type ViewpointContext = {
  mode: ViewpointMode;
  controlledCitizenId: EntityId | null;
  institutionId: EntityId | null;
  cameraScale: 'city' | 'building' | 'person';
  knowledgeScope: 'public' | 'citizen' | 'institution';
};

export type AuthorityProfile = {
  canIssuePolicy: boolean;
  canProtectDissent: boolean;
  canFundInvestigation: boolean;
  canOverrideDecision: boolean;
  canPublishEvidence: boolean;
};

export type WorldEvent = {
  id: EntityId;
  tick: Tick;
  type: string;
  title: string;
  factualSummary: string;
  actorIds: EntityId[];
  buildingIds: EntityId[];
  factIds: EntityId[];
  effects: Partial<CityMetrics>;
  provenance: 'simulation' | 'player' | 'institution' | 'citizen';
};

export type InterventionKind =
  | 'protect_engineer'
  | 'fund_investigation'
  | 'contain_system'
  | 'raise_threshold'
  | 'publish_evidence'
  | 'centralize_authority'
  | 'delegate_to_institution'
  | 'abstain';

export type WorldCommand =
  | { id: EntityId; type: 'tick'; ticks: number }
  | { id: EntityId; type: 'intervene'; kind: InterventionKind; targetId?: EntityId }
  | { id: EntityId; type: 'advance_crisis' }
  | { id: EntityId; type: 'set_viewpoint'; viewpoint: ViewpointContext };

export type WorldSnapshot = {
  schemaVersion: 1;
  seed: number;
  tick: Tick;
  metrics: CityMetrics;
  buildings: Building[];
  districts: District[];
  citizens: Citizen[];
  relationships: Relationship[];
  facts: KnowledgeFact[];
  memories: CitizenMemory[];
  routeNodes: CorrectionRouteNode[];
  routeEdges: CorrectionRouteEdge[];
  crisis: CrisisState;
  crisisDeck: CrisisState[];
  activeCrisisIndex: number;
  viewpoint: ViewpointContext;
  authority: AuthorityProfile;
  eventLog: WorldEvent[];
  commandLog: WorldCommand[];
};

export type AdvanceResult = {
  snapshot: WorldSnapshot;
  events: WorldEvent[];
};
