import { useEffect, useMemo, useRef, useState } from 'react';
import { buildCityArchive, downloadText, researchCsv } from '../archive/cityArchive';
import { scenarioFromWorld, worldFromScenario } from '../content/scenarioPack';
import { AuthoredNarrativeProvider } from '../narrative/authored';
import { OpenAICompatibleNarrativeProvider, OPENAI_COMPATIBLE_PRESETS, type OpenAICompatibleConfig } from '../narrative/openai-compatible';
import type { NarrativeProvider, NarrativeResult } from '../narrative/types';
import { LocalSharedCityAdapter, SharedCityAuthority, type SharedCityRole, type SharedCityState, type SpacetimeBindingsAdapter } from '../multiplayer/authority';
import { advanceWorld, routeReachability } from '../simulation/engine';
import { parseCitySave, serializeCitySave } from '../simulation/persistence';
import { createInitialWorld } from '../simulation/seed';
import type { InterventionKind, ViewpointContext, WorldCommand, WorldSnapshot } from '../simulation/types';
import { CityScene } from './CityScene';
import { crisisDescriptions } from '../content/crises';

const SAVE_KEY = 'self-sealing-city:save:v1';
const AI_CONFIG_KEY = 'self-sealing-city:ai-config:v1';

const interventions: Array<{ kind: InterventionKind; label: string; note: string }> = [
  { kind: 'protect_engineer', label: 'Protect the engineer', note: 'Preserve dissent and independent review.' },
  { kind: 'fund_investigation', label: 'Fund investigation', note: 'Trade capacity for discriminating evidence.' },
  { kind: 'contain_system', label: 'Contain the water network', note: 'Control harm while keeping the anomaly alive.' },
  { kind: 'raise_threshold', label: 'Raise the alert threshold', note: 'Recover output while accepting correction debt.' },
  { kind: 'publish_evidence', label: 'Publish verified evidence', note: 'Increase awareness and public accountability.' },
  { kind: 'delegate_to_institution', label: 'Delegate bounded authority', note: 'Let the implicated institutions govern the response.' },
  { kind: 'centralize_authority', label: 'Centralize emergency control', note: 'Act faster at a legitimacy and route-access cost.' },
  { kind: 'abstain', label: 'Abstain', note: 'Let the existing institutional balance decide.' },
];

function loadWorld(): WorldSnapshot {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const loaded = raw ? parseCitySave(raw).snapshot : createInitialWorld();
    const fresh = createInitialWorld(loaded.seed);
    return { ...fresh, ...loaded, districts: loaded.districts || fresh.districts, crisisDeck: loaded.crisisDeck || fresh.crisisDeck, activeCrisisIndex: loaded.activeCrisisIndex || 0, buildings: loaded.buildings.length < fresh.buildings.length ? fresh.buildings : loaded.buildings, routeNodes: loaded.routeNodes.length < fresh.routeNodes.length ? fresh.routeNodes : loaded.routeNodes, routeEdges: loaded.routeEdges.length < fresh.routeEdges.length ? fresh.routeEdges : loaded.routeEdges };
  } catch {
    return createInitialWorld();
  }
}

function commandId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function metricClass(value: number, inverse = false) {
  const normalized = inverse ? 100 - value : value;
  return normalized >= 68 ? 'good' : normalized >= 42 ? 'warn' : 'bad';
}

function viewpointFor(mode: ViewpointContext['mode']): ViewpointContext {
  if (mode === 'embodied') return { mode, controlledCitizenId: 'citizen-1', institutionId: null, cameraScale: 'person', knowledgeScope: 'citizen' };
  if (mode === 'institution') return { mode, controlledCitizenId: null, institutionId: 'hospital', cameraScale: 'building', knowledgeScope: 'institution' };
  return { mode, controlledCitizenId: null, institutionId: null, cameraScale: 'city', knowledgeScope: 'public' };
}

export function CityApp() {
  const [world, setWorld] = useState<WorldSnapshot>(loadWorld);
  const [selectedCitizenId, setSelectedCitizenId] = useState<string | null>('citizen-1');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>('waterworks');
  const [tab, setTab] = useState<'crisis' | 'people' | 'routes' | 'archive'>('crisis');
  const [running, setRunning] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [providerStatus, setProviderStatus] = useState('Offline authored narration');
  const [narrative, setNarrative] = useState<NarrativeResult | null>(null);
  const [narrativeBusy, setNarrativeBusy] = useState(false);
  const [aiConfig, setAiConfig] = useState<OpenAICompatibleConfig>(() => {
    try {
      return { ...OPENAI_COMPATIBLE_PRESETS.ollama, ...JSON.parse(localStorage.getItem(AI_CONFIG_KEY) || '{}'), apiKey: sessionStorage.getItem(`${AI_CONFIG_KEY}:key`) || undefined };
    } catch {
      return OPENAI_COMPATIBLE_PRESETS.ollama;
    }
  });
  const [useExternalAI, setUseExternalAI] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [sharedOpen, setSharedOpen] = useState(false);
  const [scenarioError, setScenarioError] = useState('');
  const [sharedConfig, setSharedConfig] = useState({ uri: 'http://localhost:3000', database: 'self-sealing-city', displayName: 'City steward', role: 'steward' as SharedCityRole });
  const [sharedState, setSharedState] = useState<SharedCityState>({ status: 'offline', detail: 'Solo authority', onlinePlayers: 1, tick: world.tick });
  const sharedAuthorityRef = useRef<SharedCityAuthority | null>(null);
  const scenarioFileRef = useRef<HTMLInputElement>(null);

  const route = useMemo(() => routeReachability(world), [world]);
  const selectedCitizen = world.citizens.find((citizen) => citizen.id === selectedCitizenId) || null;
  const selectedBuilding = world.buildings.find((building) => building.id === selectedBuildingId) || null;
  const archive = useMemo(() => buildCityArchive(world), [world]);
  const campaignComplete = world.crisisDeck.every((crisis) => crisis.stage === 'resolved' || crisis.stage === 'failed');

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, serializeCitySave(world));
  }, [world]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setWorld((current) => advanceWorld(current, [{ id: commandId('tick'), type: 'tick', ticks: 1 }]).snapshot), 1100);
    return () => window.clearInterval(timer);
  }, [running]);

  const applyCommands = (commands: WorldCommand[]) => setWorld((current) => advanceWorld(current, commands).snapshot);

  const intervene = (kind: InterventionKind) => {
    applyCommands([{ id: commandId('intervention'), type: 'intervene', kind, targetId: selectedBuildingId || undefined }]);
    void sharedAuthorityRef.current?.intervene(kind, selectedBuildingId || '').catch((error) => setSharedState((current) => ({ ...current, status: 'error', detail: error instanceof Error ? error.message : 'Shared intervention failed.' })));
    setTab('archive');
  };

  const setViewpoint = (mode: ViewpointContext['mode']) => {
    applyCommands([{ id: commandId('viewpoint'), type: 'set_viewpoint', viewpoint: viewpointFor(mode) }]);
    if (mode === 'embodied') setSelectedCitizenId('citizen-1');
    if (mode === 'institution') setSelectedBuildingId('hospital');
  };

  const provider = (): NarrativeProvider => useExternalAI ? new OpenAICompatibleNarrativeProvider(aiConfig) : new AuthoredNarrativeProvider();

  const narrativeRequest = () => {
    if (!selectedCitizen) throw new Error('Select a citizen first.');
    const allowedFacts = world.facts.filter((fact) => fact.public || fact.visibleToCitizenIds.includes(selectedCitizen.id));
    return {
      citizen: { id: selectedCitizen.id, name: selectedCitizen.name, role: selectedCitizen.role, traits: { trust: selectedCitizen.trust / 100, caution: selectedCitizen.caution / 100, dissent: selectedCitizen.dissent / 100, loyalty: selectedCitizen.loyalty / 100 }, goal: selectedCitizen.goal },
      knownFacts: allowedFacts.map(({ id, statement, reliability }) => ({ id, statement, reliability })),
      recentEvents: world.eventLog.slice(-5).map(({ id, factualSummary }) => ({ id, factualSummary })),
      relationships: world.relationships.filter((relationship) => relationship.fromCitizenId === selectedCitizen.id).map((relationship) => ({ citizenId: relationship.toCitizenId, kind: relationship.kind, trust: relationship.trust })),
      requestedForm: 'dialogue' as const,
    };
  };

  const generateNarrative = async () => {
    setNarrativeBusy(true);
    try {
      const active = provider();
      const result = await active.generate(narrativeRequest());
      setNarrative(result);
      setProviderStatus(`${active.label} responded`);
    } catch (error) {
      setProviderStatus(error instanceof Error ? error.message : 'Narrative generation failed.');
      setNarrative(await new AuthoredNarrativeProvider().generate(narrativeRequest()));
    } finally {
      setNarrativeBusy(false);
    }
  };

  const testProvider = async () => {
    setProviderStatus('Testing connection…');
    const status = await new OpenAICompatibleNarrativeProvider(aiConfig).status();
    setProviderStatus(status.detail);
  };

  const saveAiConfig = () => {
    const { apiKey: _apiKey, ...safeConfig } = aiConfig;
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(safeConfig));
    if (aiConfig.apiKey) sessionStorage.setItem(`${AI_CONFIG_KEY}:key`, aiConfig.apiKey);
    else sessionStorage.removeItem(`${AI_CONFIG_KEY}:key`);
    setAiOpen(false);
  };

  const selectPreset = (key: keyof typeof OPENAI_COMPATIBLE_PRESETS) => setAiConfig({ ...OPENAI_COMPATIBLE_PRESETS[key], apiKey: aiConfig.apiKey });

  const exportScenario = () => downloadText('self-sealing-city-scenario.json', JSON.stringify(scenarioFromWorld(world), null, 2), 'application/json');
  const importScenario = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = worldFromScenario(JSON.parse(await file.text()));
      setWorld(imported);
      setScenarioError('Scenario loaded. Its authoritative history starts now.');
      setToolsOpen(false);
    } catch (error) {
      setScenarioError(error instanceof Error ? error.message : 'Scenario validation failed.');
    }
  };

  const connectShared = async (preview: boolean) => {
    setSharedState((current) => ({ ...current, status: 'connecting', detail: 'Connecting authority…' }));
    try {
      const injected = (window as typeof window & { __SELF_SEALING_SPACETIME_ADAPTER__?: SpacetimeBindingsAdapter }).__SELF_SEALING_SPACETIME_ADAPTER__;
      if (!preview && !injected) throw new Error('Generated SpacetimeDB bindings are not installed in this static build. Use the included server module and adapter contract, or preview the shared flow locally.');
      const authority = new SharedCityAuthority(preview ? new LocalSharedCityAdapter(() => world) : injected!);
      authority.subscribe(setSharedState);
      await authority.connect({ ...sharedConfig });
      sharedAuthorityRef.current = authority;
    } catch (error) {
      setSharedState({ status: 'error', detail: error instanceof Error ? error.message : 'Shared city connection failed.', onlinePlayers: 0, tick: world.tick });
    }
  };

  return (
    <div className="city-app">
      <CityScene snapshot={world} selectedCitizenId={selectedCitizenId} selectedBuildingId={selectedBuildingId} onCitizenSelect={(id) => { setSelectedCitizenId(id); setTab('people'); }} onBuildingSelect={(id) => { setSelectedBuildingId(id); setTab('routes'); }} />

      <header className="city-topbar">
        <div className="city-brand"><p>Routed correction simulation</p><h1>The Self-Sealing City</h1></div>
        <nav className="view-switcher" aria-label="Player perspective">
          {(['steward', 'embodied', 'institution'] as const).map((mode) => <button key={mode} className={world.viewpoint.mode === mode ? 'active' : ''} onClick={() => setViewpoint(mode)}>{mode === 'steward' ? 'City steward' : mode === 'embodied' ? 'Walk as Mara' : 'Hospital desk'}</button>)}
        </nav>
        <div className="time-controls"><span>Day 1 · {String(8 + Math.floor(world.tick / 6)).padStart(2, '0')}:{String((world.tick % 6) * 10).padStart(2, '0')}</span><button onClick={() => applyCommands([{ id: commandId('tick'), type: 'tick', ticks: 1 }])}>+10m</button><button className={running ? 'active' : ''} onClick={() => setRunning((value) => !value)}>{running ? 'Pause' : 'Run'}</button></div>
      </header>

      <aside className="city-metrics glass">
        <p className="eyebrow">City state</p>
        <h2>{world.crisis.title}</h2>
        {Object.entries({ Performance: world.metrics.performance, 'Route access': world.metrics.routeAccess, Stability: world.metrics.stability, Debt: world.metrics.correctionDebt, Legitimacy: world.metrics.legitimacy, 'Public trust': world.metrics.publicTrust, 'Review capacity': world.metrics.reviewCapacity }).map(([label, value]) => <div className="city-metric" key={label}><span>{label}</span><strong>{Math.round(value)}</strong><i><b className={metricClass(value, label === 'Debt')} style={{ width: `${value}%` }} /></i></div>)}
        <div className={`route-verdict ${route.reachable ? 'open' : 'closed'}`}><span>{route.reachable ? 'Route remains reachable' : 'Correction route severed'}</span><strong>{Math.round(route.score)}</strong></div>
      </aside>

      <main className="city-workspace glass">
        <div className="workspace-tabs">
          {(['crisis', 'people', 'routes', 'archive'] as const).map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}
          <button className="ai-button" onClick={() => setAiOpen(true)}>Narrative AI</button>
          <button className="ai-button" onClick={() => setToolsOpen(true)}>Scenario tools</button>
          <button className={`ai-button ${sharedState.status === 'connected' ? 'connected' : ''}`} onClick={() => setSharedOpen(true)}>{sharedState.status === 'connected' ? `${sharedState.onlinePlayers} online` : 'Shared city'}</button>
        </div>

        <div className="workspace-scroll">
          {tab === 'crisis' && <section><p className="eyebrow">Active discrepancy · {world.crisis.stage} · case {world.activeCrisisIndex + 1}/{world.crisisDeck.length}</p><h2>{world.crisis.title}</h2><p>{crisisDescriptions[world.crisis.id] || 'A custom discrepancy is moving through the city’s institutions.'}</p><div className="campaign-track" aria-label="Campaign cases">{world.crisisDeck.map((crisis, index) => <i key={crisis.id} className={`${crisis.stage} ${index === world.activeCrisisIndex ? 'active' : ''}`} title={`${crisis.title}: ${crisis.stage}`} />)}</div><div className="evidence-grid"><div><span>Severity</span><strong>{world.crisis.severity}</strong></div><div><span>Evidence</span><strong>{world.crisis.evidence}</strong></div><div><span>Recurrence</span><strong>{world.crisis.recurrence}×</strong></div><div><span>Public awareness</span><strong>{world.crisis.publicAwareness}</strong></div></div><p className="question">Can the discrepancy reach an adequate response without making you the permanent source of correction?</p>{world.eventLog.length > 0 && !campaignComplete && <button className="primary" onClick={() => applyCommands([{ id: commandId('case'), type: 'advance_crisis' }])}>Close case and face the next discrepancy</button>}{campaignComplete && <div className="ending-card"><strong>{archive.routeMap.reachable && world.metrics.correctionDebt < 50 ? 'A city that can still answer' : 'A city that learned to seal itself'}</strong><p>The campaign archive is complete. Your route choices, dissent record, and unresolved contradictions remain exportable.</p></div>}</section>}

          {tab === 'people' && <section><p className="eyebrow">Person scale · partial knowledge</p><div className="citizen-layout"><div className="citizen-list">{world.citizens.filter((citizen) => citizen.named).map((citizen) => <button key={citizen.id} className={citizen.id === selectedCitizenId ? 'active' : ''} onClick={() => setSelectedCitizenId(citizen.id)}><strong>{citizen.name}</strong><span>{citizen.role}</span></button>)}</div>{selectedCitizen && <article className="person-card"><h2>{selectedCitizen.name}</h2><p>{selectedCitizen.role} · {world.buildings.find((building) => building.id === selectedCitizen.buildingId)?.name}</p><dl><div><dt>Current goal</dt><dd>{selectedCitizen.goal}</dd></div><div><dt>Private facts</dt><dd>{world.facts.filter((fact) => fact.visibleToCitizenIds.includes(selectedCitizen.id)).length}</dd></div><div><dt>Dissent access</dt><dd>{Math.round(selectedCitizen.dissent)}</dd></div><div><dt>Stress</dt><dd>{Math.round(selectedCitizen.stress)}</dd></div></dl><button className="primary" onClick={generateNarrative} disabled={narrativeBusy}>{narrativeBusy ? 'Listening…' : 'Ask for their account'}</button>{narrative && <blockquote><p>“{narrative.dialogue}”</p><small>Confidence {Math.round(narrative.confidence * 100)}% · {providerStatus}</small></blockquote>}</article>}</div></section>}

          {tab === 'routes' && <section><p className="eyebrow">Correction ecology</p><h2>{selectedBuilding?.name || 'City route graph'}</h2><div className="route-list">{world.routeNodes.map((node, index) => <div className={node.blocked ? 'blocked' : ''} key={node.id}><span>{index + 1}</span><p><strong>{node.label}</strong><small>{node.function} · {node.buildingId}</small></p><b>{Math.round(node.access)}</b></div>)}</div><p className="route-path">Reachable path: {route.path.length ? route.path.join(' → ') : 'none'}</p></section>}

          {tab === 'archive' && <section><p className="eyebrow">Plural city archive</p><h2>The city remembers how you correct it</h2><details open><summary>Official history</summary>{world.eventLog.length ? <div className="event-log">{[...world.eventLog].reverse().map((event) => <article key={event.id}><span>{event.tick}</span><div><strong>{event.title}</strong><p>{event.factualSummary}</p><small>{event.provenance} · {Object.entries(event.effects).map(([key, value]) => `${key} ${Number(value) >= 0 ? '+' : ''}${value}`).join(' · ')}</small></div></article>)}</div> : <p className="empty">No authoritative events have been recorded yet.</p>}</details><details><summary>Dissident record</summary>{archive.dissidentRecord.map((line) => <p key={line}>{line}</p>)}</details><details><summary>Causal record</summary>{archive.causalRecord.map((line) => <p key={line}>{line}</p>)}</details><details><summary>Correction-route map</summary><p>{archive.routeMap.reachable ? 'Reachable' : 'Severed'} at {Math.round(archive.routeMap.score)}%. {archive.routeMap.path.join(' → ') || 'No end-to-end route remains.'}</p></details><details><summary>Biographies and unresolved questions</summary>{archive.biographies.map((bio) => <p key={bio.name}><strong>{bio.name}</strong> — {bio.account}</p>)}{archive.unresolvedQuestions.map((line) => <p key={line}>? {line}</p>)}</details><div className="archive-actions"><button onClick={() => downloadText('self-sealing-city-research.json', JSON.stringify({ world, archive }, null, 2), 'application/json')}>Export research JSON</button><button onClick={() => downloadText('self-sealing-city-events.csv', researchCsv(world), 'text/csv')}>Export events CSV</button><button onClick={() => { localStorage.removeItem(SAVE_KEY); setWorld(createInitialWorld()); }}>Start a new city</button></div></section>}
        </div>
      </main>

      <section className="intervention-rail" aria-label="Steward interventions">
        {interventions.map((action) => <button key={action.kind} onClick={() => intervene(action.kind)}><span>{action.label}</span><small>{action.note}</small></button>)}
      </section>

      <div className="scene-hint">Drag to orbit · Scroll to zoom · Select buildings or people</div>
      <a className="tower-return" href="./index.html">Return to the tower</a>

      {aiOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setAiOpen(false)}><section className="ai-modal glass" role="dialog" aria-modal="true" aria-labelledby="ai-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">Optional narrative layer</p><h2 id="ai-title">OpenAI-compatible provider</h2></div><button onClick={() => setAiOpen(false)} aria-label="Close">×</button></header><p>The simulation remains authoritative and fully playable when this is off. Connect any server that implements <code>/v1/models</code> and <code>/v1/chat/completions</code>.</p><label className="switch"><input type="checkbox" checked={useExternalAI} onChange={(event) => setUseExternalAI(event.target.checked)} /><span>Use external narrative provider</span></label><div className="preset-row">{(Object.keys(OPENAI_COMPATIBLE_PRESETS) as Array<keyof typeof OPENAI_COMPATIBLE_PRESETS>).map((key) => <button key={key} onClick={() => selectPreset(key)}>{OPENAI_COMPATIBLE_PRESETS[key].label}</button>)}</div><label>Base URL<input value={aiConfig.baseUrl} onChange={(event) => setAiConfig({ ...aiConfig, baseUrl: event.target.value })} /></label><label>Model<input value={aiConfig.model} onChange={(event) => setAiConfig({ ...aiConfig, model: event.target.value })} /></label><label>API key <small>kept only for this browser session</small><input type="password" value={aiConfig.apiKey || ''} onChange={(event) => setAiConfig({ ...aiConfig, apiKey: event.target.value || undefined })} placeholder="Optional for local servers" /></label><label className="switch"><input type="checkbox" checked={Boolean(aiConfig.supportsJsonSchema)} onChange={(event) => setAiConfig({ ...aiConfig, supportsJsonSchema: event.target.checked })} /><span>Provider supports JSON Schema output</span></label><div className="provider-status">{providerStatus}</div><footer><button onClick={testProvider}>Test connection</button><button className="primary" onClick={saveAiConfig}>Save provider</button></footer></section></div>}
      {toolsOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setToolsOpen(false)}><section className="ai-modal glass" role="dialog" aria-modal="true" aria-labelledby="tools-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">Creator and research tools</p><h2 id="tools-title">Portable scenario packs</h2></div><button onClick={() => setToolsOpen(false)} aria-label="Close">×</button></header><p>Export the current campaign as a validated authoring template, edit its seed, metrics, and crises, then import it without changing the deterministic simulation rules.</p><input ref={scenarioFileRef} hidden type="file" accept="application/json,.json" onChange={(event) => void importScenario(event.target.files?.[0])} /><div className="provider-status">{scenarioError || 'Scenario format v1 · JSON · 1–20 crises'}</div><footer><button onClick={() => scenarioFileRef.current?.click()}>Import scenario</button><button className="primary" onClick={exportScenario}>Export authoring template</button></footer></section></div>}
      {sharedOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setSharedOpen(false)}><section className="ai-modal glass" role="dialog" aria-modal="true" aria-labelledby="shared-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">Optional authoritative multiplayer</p><h2 id="shared-title">Shared SpacetimeDB city</h2></div><button onClick={() => setSharedOpen(false)} aria-label="Close">×</button></header><p>Solo play remains local-first. A deployed shared city uses persistent tables, identities, subscriptions, atomic interventions, votes, narrative jobs, and scheduled ticks.</p><label>Server URL<input value={sharedConfig.uri} onChange={(event) => setSharedConfig({ ...sharedConfig, uri: event.target.value })} /></label><label>Database<input value={sharedConfig.database} onChange={(event) => setSharedConfig({ ...sharedConfig, database: event.target.value })} /></label><label>Display name<input value={sharedConfig.displayName} onChange={(event) => setSharedConfig({ ...sharedConfig, displayName: event.target.value })} /></label><label>Viewpoint role<select value={sharedConfig.role} onChange={(event) => setSharedConfig({ ...sharedConfig, role: event.target.value as SharedCityRole })}><option value="steward">Civic steward</option><option value="embodied">Embodied official</option><option value="institution">Systems architect</option></select></label><div className={`provider-status ${sharedState.status}`}>{sharedState.detail}</div><footer><button onClick={() => void connectShared(true)}>Preview flow locally</button><button className="primary" onClick={() => void connectShared(false)}>Connect deployed city</button></footer></section></div>}
    </div>
  );
}
