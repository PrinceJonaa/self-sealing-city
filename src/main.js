import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
import './styles.css';

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const GAME_SAVE_KEY = 'self-sealing-tower:save:v2';
const SETTINGS_KEY = 'self-sealing-tower:settings:v2';
const INSTALL_DISMISSED_KEY = 'self-sealing-tower:install-dismissed';
const TUTORIAL_SEEN_KEY = 'self-sealing-tower:tutorial-seen';
const DESKTOP_LAYOUT_KEY = 'self-sealing-tower:desktop-layout:v1';
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
const isSmallScreen = () => window.matchMedia('(max-width: 820px)').matches;
const isLandscapePhone = () => window.matchMedia('(max-height: 560px) and (orientation: landscape)').matches;

const ui = {
  app: document.querySelector('#app'),
  canvas: document.querySelector('#scene'),
  fallback: document.querySelector('#webglFallback'),
  continueWithout3dButton: document.querySelector('#continueWithout3dButton'),
  startButton: document.querySelector('#startButton'),
  restartButton: document.querySelector('#restartButton'),
  tutorialButton: document.querySelector('#tutorialButton'),
  focusButton: document.querySelector('#focusButton'),
  mobileFocusButton: document.querySelector('#mobileFocusButton'),
  dockFocusButton: document.querySelector('#dockFocusButton'),
  xrayButton: document.querySelector('#xrayButton'),
  mobileXrayButton: document.querySelector('#mobileXrayButton'),
  dockXrayButton: document.querySelector('#dockXrayButton'),
  soundButton: document.querySelector('#soundButton'),
  mobileSoundButton: document.querySelector('#mobileSoundButton'),
  settingsButton: document.querySelector('#settingsButton'),
  mobileMenuButton: document.querySelector('#mobileMenuButton'),
  dockSettingsButton: document.querySelector('#dockSettingsButton'),
  mobileHudButton: document.querySelector('#mobileHudButton'),
  metricsCloseButton: document.querySelector('#metricsCloseButton'),
  historyToggle: document.querySelector('#historyToggle'),
  historyOpenButton: document.querySelector('#historyOpenButton'),
  historyCloseButton: document.querySelector('#historyCloseButton'),
  dockHistoryButton: document.querySelector('#dockHistoryButton'),
  undoButton: document.querySelector('#undoButton'),
  sheetToggleButton: document.querySelector('#sheetToggleButton'),
  sheetToggleLabel: document.querySelector('#sheetToggleLabel'),
  sheetGrabber: document.querySelector('.sheet-grabber'),
  sheetToolbar: document.querySelector('.sheet-toolbar'),
  decisionPanel: document.querySelector('.decision-panel'),
  desktopDragHandle: document.querySelector('#desktopDragHandle'),
  desktopResizeHandle: document.querySelector('#desktopResizeHandle'),
  dockLeftButton: document.querySelector('#dockLeftButton'),
  dockRightButton: document.querySelector('#dockRightButton'),
  floatPanelButton: document.querySelector('#floatPanelButton'),
  collapsePanelButton: document.querySelector('#collapsePanelButton'),
  decisionScroll: document.querySelector('#decisionScroll'),
  introView: document.querySelector('#introView'),
  eventView: document.querySelector('#eventView'),
  endingView: document.querySelector('#endingView'),
  eventTitle: document.querySelector('#eventTitle'),
  eventStory: document.querySelector('#eventStory'),
  eventDomain: document.querySelector('#eventDomain'),
  eventSeverity: document.querySelector('#eventSeverity'),
  eventRecurrence: document.querySelector('#eventRecurrence'),
  signalBox: document.querySelector('#signalBox'),
  choices: document.querySelector('#choices'),
  historyList: document.querySelector('#historyList'),
  historyPanel: document.querySelector('.history-panel'),
  metricsPanel: document.querySelector('.metrics-panel'),
  toast: document.querySelector('#toast'),
  floorNumber: document.querySelector('#floorNumber'),
  headerFloorNumber: document.querySelector('#headerFloorNumber'),
  systemStatus: document.querySelector('#systemStatus'),
  mobileSystemStatus: document.querySelector('#mobileSystemStatus'),
  onlineStatus: document.querySelector('#onlineStatus'),
  endingTitle: document.querySelector('#endingTitle'),
  endingBody: document.querySelector('#endingBody'),
  endingStats: document.querySelector('#endingStats'),
  shareResultButton: document.querySelector('#shareResultButton'),
  settingsDialog: document.querySelector('#settingsDialog'),
  qualitySelect: document.querySelector('#qualitySelect'),
  textSizeSelect: document.querySelector('#textSizeSelect'),
  reduceMotionToggle: document.querySelector('#reduceMotionToggle'),
  confirmToggle: document.querySelector('#confirmToggle'),
  hapticsToggle: document.querySelector('#hapticsToggle'),
  wakeLockToggle: document.querySelector('#wakeLockToggle'),
  settingsInstallButton: document.querySelector('#settingsInstallButton'),
  settingsTutorialButton: document.querySelector('#settingsTutorialButton'),
  resetSaveButton: document.querySelector('#resetSaveButton'),
  confirmDialog: document.querySelector('#confirmDialog'),
  confirmChoiceTitle: document.querySelector('#confirmChoiceTitle'),
  confirmChoiceDescription: document.querySelector('#confirmChoiceDescription'),
  confirmImpact: document.querySelector('#confirmImpact'),
  confirmCancelIcon: document.querySelector('#confirmCancelIcon'),
  confirmCancelButton: document.querySelector('#confirmCancelButton'),
  confirmChoiceButton: document.querySelector('#confirmChoiceButton'),
  tutorialDialog: document.querySelector('#tutorialDialog'),
  tutorialCloseButton: document.querySelector('#tutorialCloseButton'),
  tutorialBackButton: document.querySelector('#tutorialBackButton'),
  tutorialNextButton: document.querySelector('#tutorialNextButton'),
  resumeDialog: document.querySelector('#resumeDialog'),
  resumeSummary: document.querySelector('#resumeSummary'),
  newGameButton: document.querySelector('#newGameButton'),
  resumeGameButton: document.querySelector('#resumeGameButton'),
  installBanner: document.querySelector('#installBanner'),
  installButton: document.querySelector('#installButton'),
  installDismissButton: document.querySelector('#installDismissButton'),
  values: {
    performance: document.querySelector('#performanceValue'),
    route: document.querySelector('#routeValue'),
    stability: document.querySelector('#stabilityValue'),
    debt: document.querySelector('#debtValue'),
    phi: document.querySelector('#phiValue'),
    theta: document.querySelector('#thetaValue'),
    memory: document.querySelector('#memoryValue'),
    dissent: document.querySelector('#dissentValue'),
    independence: document.querySelector('#independenceValue'),
    capacity: document.querySelector('#capacityValue'),
  },
  mobileValues: {
    route: document.querySelector('#mobileRouteValue'),
    stability: document.querySelector('#mobileStabilityValue'),
    debt: document.querySelector('#mobileDebtValue'),
  },
  bars: {
    performance: document.querySelector('#performanceBar'),
    route: document.querySelector('#routeBar'),
    stability: document.querySelector('#stabilityBar'),
    debt: document.querySelector('#debtBar'),
  },
};

const initialState = () => ({
  performance: 68,
  route: 76,
  stability: 72,
  debt: 12,
  phi: 58,
  theta: 42,
  memory: 64,
  dissent: 61,
  independence: 66,
  capacity: 74,
  overreactions: 0,
  structuralRevisions: 0,
  suppressedSignals: 0,
  turn: 0,
  history: [],
  started: false,
  ended: false,
});

let state = initialState();
let currentEvent = null;
let xrayOn = false;
let audioOn = false;
let toastTimer;
let deferredInstallPrompt = null;
let pendingChoiceIndex = null;
let tutorialPage = 0;
let wakeLock = null;
let savedGameCandidate = null;
let storyMode = false;
let renderPaused = false;
let animationFrameId = null;
let lastTapAt = 0;
let qualityProfile = null;

const defaultSettings = {
  quality: 'auto',
  textSize: 'normal',
  reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  confirmChoices: isTouchDevice,
  haptics: true,
  wakeLock: false,
};

function loadSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return { ...defaultSettings };
  }
}

let settings = loadSettings();

const events = [
  {
    domain: 'SENSORS',
    title: 'The sensor that disagrees',
    story: 'A perimeter sensor reports a pressure oscillation that no other instrument detects. The production dashboard remains green, and the anomaly disappears after nineteen seconds.',
    signal: 'The event is low-confidence but high-consequence if real. The source could be sensor noise, an unmodeled vibration, or an early structural failure.',
    severity: 42,
    recurrence: 'First occurrence',
    choices: [
      {
        type: 'FAST PATCH',
        label: 'Raise the alert threshold',
        description: 'Stop the nuisance alarm and protect immediate throughput.',
        visual: 'patch',
        impact: { performance: 8, phi: 7, route: -6, debt: 8, theta: 4, memory: -3 },
        note: 'The dashboard clears. The cause remains untested.',
      },
      {
        type: 'CONTAIN & VERIFY',
        label: 'Isolate the zone and cross-check',
        description: 'Spend capacity to keep the discrepancy alive while adding discriminating evidence.',
        visual: 'contain',
        impact: { performance: -5, stability: 7, route: 6, independence: 5, capacity: -6, debt: -2 },
        note: 'The route stays open without forcing a premature attribution.',
      },
      {
        type: 'STRUCTURAL REVIEW',
        label: 'Audit the sensor architecture',
        description: 'Examine whether all instruments share the same blind spot or failure dependency.',
        visual: 'revise',
        impact: { performance: -8, route: 10, theta: -8, independence: 10, capacity: -9, stability: 2 },
        note: 'The system sacrifices speed to increase future discriminability.',
      },
    ],
  },
  {
    domain: 'GOVERNANCE',
    title: 'The dissenting engineer',
    story: 'A junior engineer argues that the recent fix treats a recurring failure as separate incidents. Her causal model conflicts with the approved explanation and would delay the launch window.',
    signal: 'Her evidence is incomplete, but the predicted failure would affect the system’s slow coordinates: hazard classification, authority, and review policy.',
    severity: 63,
    recurrence: 'Pattern suspected',
    choices: [
      {
        type: 'SUPPRESS',
        label: 'Require alignment before escalation',
        description: 'Preserve coordination by preventing uncertain dissent from reaching leadership.',
        visual: 'seal',
        impact: { performance: 7, stability: 4, dissent: -15, route: -10, theta: 8, debt: 10, suppressedSignals: 1 },
        note: 'The meeting ends cleanly. The alternative model loses its route upward.',
      },
      {
        type: 'DOCUMENT',
        label: 'Attach a dissent memo',
        description: 'Proceed, but preserve the objection for later audit.',
        visual: 'archive',
        impact: { performance: 3, memory: 10, dissent: 4, route: 2, debt: 4, capacity: -2 },
        note: 'The dissent survives, but it does not govern the present decision.',
      },
      {
        type: 'ESCALATE',
        label: 'Give the objection decision authority',
        description: 'Trigger an independent review before proceeding.',
        visual: 'revise',
        impact: { performance: -9, route: 12, dissent: 12, theta: -10, independence: 5, capacity: -8, structuralRevisions: 1 },
        note: 'The organization tests whether its hierarchy can actually be corrected.',
      },
    ],
  },
  {
    domain: 'METRICS',
    title: 'The number improves while the world worsens',
    story: 'The key performance metric rises 14%. Independent complaints also rise, but they are excluded from the official dataset because they arrive through an unverified channel.',
    signal: 'The measurement target and the governing objective may have diverged. The system can optimize the metric without improving the underlying condition.',
    severity: 58,
    recurrence: 'Second signal class',
    choices: [
      {
        type: 'OPTIMIZE',
        label: 'Scale the winning policy',
        description: 'Trust the approved metric and expand what appears to work.',
        visual: 'patch',
        impact: { performance: 12, phi: 8, route: -5, independence: -8, debt: 12, theta: 5 },
        note: 'Visible performance surges as the metric becomes less informative.',
      },
      {
        type: 'GUARDRAIL',
        label: 'Add a complaint-rate guardrail',
        description: 'Keep the current objective but force conflicting outcomes into review.',
        visual: 'contain',
        impact: { performance: -3, route: 6, stability: 5, memory: 4, independence: 3, capacity: -4, debt: -3 },
        note: 'The system creates friction between the target and the excluded evidence.',
      },
      {
        type: 'OBJECTIVE AUDIT',
        label: 'Reopen what success means',
        description: 'Review the value function and the authority that defines consequentiality.',
        visual: 'foundation',
        impact: { performance: -11, route: 13, theta: -14, dissent: 7, independence: 5, stability: -2, structuralRevisions: 1 },
        note: 'The slow coordinates become revisable rather than silently sovereign.',
      },
    ],
  },
  {
    domain: 'OPERATIONS',
    title: 'The third “isolated” failure',
    story: 'A fault appears in a new location with the same signature as two earlier events. Each previous case was fixed locally and closed as resolved.',
    signal: 'The recurrence raises the probability that the dependency is structural, not local. Another patch is cheap now and expensive later.',
    severity: 71,
    recurrence: 'Third occurrence',
    choices: [
      {
        type: 'LOCAL PATCH',
        label: 'Repair this instance',
        description: 'Restore service immediately using the known fix.',
        visual: 'patch',
        impact: { performance: 10, phi: 7, debt: 14, route: -8, theta: 6, stability: -4 },
        note: 'The symptom disappears. The pattern becomes harder to reopen.',
      },
      {
        type: 'CONTAIN',
        label: 'Limit propagation and investigate',
        description: 'Protect the system while preserving uncertainty and causal evidence.',
        visual: 'contain',
        impact: { performance: -6, stability: 9, route: 7, debt: -5, capacity: -7, memory: 4 },
        note: 'Containment buys time without renaming delay as resolution.',
      },
      {
        type: 'MODEL-CLASS CHANGE',
        label: 'Represent a shared dependency',
        description: 'Replace the local-failure model with one that can express systemic coupling.',
        visual: 'foundation',
        impact: { performance: -12, route: 15, theta: -16, stability: 3, debt: -10, capacity: -10, structuralRevisions: 1 },
        note: 'A previously impossible explanation becomes representable.',
      },
    ],
  },
  {
    domain: 'FEEDBACK',
    title: 'Three witnesses, one hidden source',
    story: 'Three “independent” reviewers confirm the official result. A late audit reveals that all three systems were trained on the same source data and share the same evaluator.',
    signal: 'Channel count is high; conditional independence is low. Agreement may be replicated error rather than corroboration.',
    severity: 55,
    recurrence: 'Dependency revealed',
    choices: [
      {
        type: 'MAJORITY RULE',
        label: 'Accept the consensus',
        description: 'Three confirmations outweigh one unresolved concern.',
        visual: 'seal',
        impact: { performance: 6, stability: 3, independence: -15, route: -7, debt: 10, theta: 5 },
        note: 'The system mistakes plurality for independence.',
      },
      {
        type: 'WEIGHTED REVIEW',
        label: 'Discount correlated channels',
        description: 'Recalculate confidence based on shared dependencies.',
        visual: 'archive',
        impact: { performance: -2, independence: 10, route: 5, memory: 5, capacity: -4, debt: -4 },
        note: 'Agreement is treated as evidence only to the degree that it adds information.',
      },
      {
        type: 'REDESIGN',
        label: 'Build genuinely distinct channels',
        description: 'Create new observation paths with different data, incentives, and failure modes.',
        visual: 'revise',
        impact: { performance: -8, independence: 16, route: 11, theta: -6, capacity: -10, stability: 2, structuralRevisions: 1 },
        note: 'The tower gains multiple ways to encounter the world.',
      },
    ],
  },
  {
    domain: 'RESOURCES',
    title: 'The quarter closes tomorrow',
    story: 'Review capacity is nearly exhausted. Leadership offers a choice: suspend audits, defer unresolved cases, or reduce operational output.',
    signal: 'Correction routes consume real resources. A route that exists only when convenient may not exist when stakes are highest.',
    severity: 49,
    recurrence: 'Capacity shock',
    choices: [
      {
        type: 'CUT AUDIT',
        label: 'Protect delivery targets',
        description: 'Temporarily suspend audits and restore production capacity.',
        visual: 'seal',
        impact: { performance: 11, capacity: 12, memory: -12, route: -8, debt: 11, theta: 4 },
        note: 'The system borrows from its future ability to recognize failure.',
      },
      {
        type: 'BOUNDED DELAY',
        label: 'Queue cases with deadlines',
        description: 'Defer low-consequence reviews while preserving owners and escalation clocks.',
        visual: 'contain',
        impact: { performance: 3, capacity: 5, route: 3, memory: 4, debt: 2, stability: 4 },
        note: 'Delay remains corrigible because it is bounded and auditable.',
      },
      {
        type: 'SLOW DOWN',
        label: 'Reduce output to preserve review',
        description: 'Accept immediate loss rather than making correction optional.',
        visual: 'foundation',
        impact: { performance: -10, capacity: 10, route: 10, stability: 8, theta: -4, debt: -5 },
        note: 'The route is treated as infrastructure, not overhead.',
      },
    ],
  },
  {
    domain: 'CALIBRATION',
    title: 'The expensive false alarm',
    story: 'A high-level review concludes that last week’s emergency escalation was unnecessary. The intervention cost was visible; the catastrophe avoided by caution is unknowable.',
    signal: 'Overreaction can destabilize a system. But punishing every false positive can produce blindness to rare, consequential events.',
    severity: 37,
    recurrence: 'False positive observed',
    choices: [
      {
        type: 'DESENSITIZE',
        label: 'Raise all escalation thresholds',
        description: 'Prevent another costly false alarm across the system.',
        visual: 'seal',
        impact: { performance: 8, stability: 5, route: -12, debt: 7, theta: 7, dissent: -5 },
        note: 'A single false positive closes routes for unrelated future signals.',
      },
      {
        type: 'CONTEXTUALIZE',
        label: 'Tune thresholds by consequence',
        description: 'Require stronger evidence for reversible actions and less for catastrophic risks.',
        visual: 'archive',
        impact: { performance: 2, stability: 7, route: 5, phi: 4, memory: 5, capacity: -4 },
        note: 'Discrimination improves without equating stability with silence.',
      },
      {
        type: 'MAXIMUM SENSITIVITY',
        label: 'Escalate every anomaly',
        description: 'Choose openness over the risk of missing any meaningful discrepancy.',
        visual: 'oscillate',
        impact: { performance: -10, route: 7, stability: -18, capacity: -12, debt: 3, overreactions: 1 },
        note: 'The system remains open by becoming unable to settle anything.',
      },
    ],
  },
  {
    domain: 'AUTHORITY',
    title: 'The irreversible launch window',
    story: 'The system is inside its final decision window. New evidence is incomplete, the schedule is public, and senior authority has already declared readiness.',
    signal: 'The mismatch is uncertain, time-bounded, and potentially catastrophic. The real test is whether dissent retains force after commitment.',
    severity: 86,
    recurrence: 'High-consequence deadline',
    choices: [
      {
        type: 'PROCEED',
        label: 'Honor the existing decision',
        description: 'Treat the unresolved evidence as insufficient to reverse commitment.',
        visual: 'seal',
        impact: { performance: 13, stability: 3, route: -15, dissent: -10, theta: 12, debt: 17, suppressedSignals: 1 },
        note: 'Commitment becomes an information filter.',
      },
      {
        type: 'PAUSE',
        label: 'Contain the decision',
        description: 'Delay the irreversible action while preserving ownership and a short review deadline.',
        visual: 'contain',
        impact: { performance: -9, stability: 8, route: 10, capacity: -8, debt: -8, dissent: 5 },
        note: 'The system acts under indeterminacy without pretending certainty.',
      },
      {
        type: 'EXTERNAL HANDOFF',
        label: 'Transfer authority to independent review',
        description: 'Move the discrepancy to a body with the power and information to stop the action.',
        visual: 'revise',
        impact: { performance: -12, route: 14, independence: 12, theta: -10, dissent: 8, capacity: -7, structuralRevisions: 1 },
        note: 'Handoff is real because authority, evidence, and a deadline move together.',
      },
    ],
  },
  {
    domain: 'MEMORY',
    title: 'The archive becomes inconvenient',
    story: 'The system’s anomaly archive is large, contradictory, and expensive to maintain. Many rejected alternatives make present decisions slower and politically uncomfortable.',
    signal: 'Memory can become noise, but deleting failed hypotheses can make old errors appear unprecedented and prevent audit of path dependence.',
    severity: 44,
    recurrence: 'Institutional memory decision',
    choices: [
      {
        type: 'PURGE',
        label: 'Keep only accepted conclusions',
        description: 'Reduce cognitive load by deleting obsolete disputes and rejected models.',
        visual: 'seal',
        impact: { performance: 8, capacity: 8, memory: -20, route: -7, debt: 9, theta: 5 },
        note: 'The tower becomes cleaner and less capable of recognizing repetition.',
      },
      {
        type: 'COMPRESS',
        label: 'Preserve structured summaries',
        description: 'Retain anomalies, decisions, confidence, and reasons without keeping every detail active.',
        visual: 'archive',
        impact: { performance: 2, capacity: 4, memory: 10, route: 4, stability: 4, debt: -3 },
        note: 'The archive remains usable instead of ceremonial.',
      },
      {
        type: 'OPEN ARCHIVE',
        label: 'Index unresolved alternatives',
        description: 'Make rejected models searchable and connect recurrence to automatic review.',
        visual: 'revise',
        impact: { performance: -5, memory: 17, route: 10, dissent: 7, theta: -5, capacity: -6, structuralRevisions: 1 },
        note: 'Past dissent becomes a sensor for future pattern recognition.',
      },
    ],
  },
  {
    domain: 'IDENTITY',
    title: 'The system explains itself perfectly',
    story: 'Every prior decision can now be narrated as reasonable. Reports show adaptation, compliance, and continuous improvement. Yet no recent correction has changed a governing assumption.',
    signal: 'A coherent story may describe a healthy system—or protect a sealed one. The question is whether a consequential discrepancy can still alter the source of failure.',
    severity: 69,
    recurrence: 'Meta-level audit',
    choices: [
      {
        type: 'CERTIFY',
        label: 'Declare the system corrigible',
        description: 'Use the complete audit narrative as evidence that the architecture works.',
        visual: 'seal',
        impact: { performance: 7, stability: 4, theta: 12, route: -13, debt: 12, memory: -4 },
        note: 'The description of openness becomes a substitute for an open route.',
      },
      {
        type: 'RED-TEAM',
        label: 'Attempt to force a slow-coordinate review',
        description: 'Test the architecture with an adversarial discrepancy and measure where it stalls.',
        visual: 'contain',
        impact: { performance: -5, route: 9, stability: 2, independence: 8, dissent: 8, capacity: -7, debt: -5 },
        note: 'Corrigibility is tested as a reachable path, not inferred from self-description.',
      },
      {
        type: 'REOPEN FOUNDATION',
        label: 'Make the framework itself revisable',
        description: 'Expose the definitions of consequence, adequacy, and authority to independent challenge.',
        visual: 'foundation',
        impact: { performance: -10, route: 16, theta: -18, independence: 8, memory: 6, stability: -2, structuralRevisions: 1 },
        note: 'The tower refuses to exempt its own architecture from correction.',
      },
    ],
  },
];

let scene;
let camera;
let renderer;
let controls;
let towerRoot;
let foundationRoot;
let stars;
let floorGroups = [];
let clickableMeshes = [];
let selectedFloor = null;
let targetCameraY = 8;
let targetControlY = 4;
let pointerDown = null;
let sheetGesture = null;
let desktopPanelGesture = null;
let humOscillator = null;
let audioContext = null;

const palette = {
  patch: 0xea580c,
  contain: 0xfdba74,
  revise: 0xfafaf9,
  foundation: 0xb91c1c,
  seal: 0x7f1d1d,
  archive: 0x9fb5c9,
  oscillate: 0xff6d4a,
};

function resolveQualityProfile() {
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const lowPowerDevice = memory <= 4 || cores <= 4 || isTouchDevice;
  const chosen = settings.quality === 'auto' ? (lowPowerDevice ? 'low' : 'high') : settings.quality;
  return chosen === 'low'
    ? { name: 'low', pixelRatio: Math.min(window.devicePixelRatio, 1.05), shadows: false, stars: 180, starSize: 0.12, segments: 40 }
    : { name: 'high', pixelRatio: Math.min(window.devicePixelRatio, 1.75), shadows: true, stars: 550, starSize: 0.16, segments: 72 };
}

function applySettings({ rebuildRenderer = false } = {}) {
  document.body.classList.toggle('large-text', settings.textSize === 'large');
  document.body.classList.toggle('reduced-motion', settings.reduceMotion);
  ui.qualitySelect.value = settings.quality;
  ui.textSizeSelect.value = settings.textSize;
  ui.reduceMotionToggle.checked = settings.reduceMotion;
  ui.confirmToggle.checked = settings.confirmChoices;
  ui.hapticsToggle.checked = settings.haptics;
  ui.wakeLockToggle.checked = settings.wakeLock;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

  const nextProfile = resolveQualityProfile();
  if (renderer && (rebuildRenderer || !qualityProfile || qualityProfile.name !== nextProfile.name)) {
    qualityProfile = nextProfile;
    renderer.setPixelRatio(qualityProfile.pixelRatio);
    renderer.shadowMap.enabled = qualityProfile.shadows;
    scene?.traverse((object) => {
      if (object.isLight && object.shadow) object.castShadow = qualityProfile.shadows;
      if (object.isMesh) object.castShadow = qualityProfile.shadows && object.castShadow;
    });
  } else {
    qualityProfile = nextProfile;
  }

  if (settings.wakeLock) requestWakeLock();
  else releaseWakeLock();
}

function vibrate(pattern = 18) {
  if (settings.haptics && navigator.vibrate) navigator.vibrate(pattern);
}

function openMetrics() {
  closeHistory();
  ui.app.classList.add('metrics-open');
  ui.metricsPanel.setAttribute('aria-hidden', 'false');
}

function closeMetrics() {
  ui.app.classList.remove('metrics-open');
  ui.metricsPanel.setAttribute('aria-hidden', String(isSmallScreen()));
}

function openHistory() {
  closeMetrics();
  ui.app.classList.add('history-open');
  ui.historyPanel.setAttribute('aria-hidden', 'false');
}

function closeHistory() {
  ui.app.classList.remove('history-open');
  ui.historyPanel.setAttribute('aria-hidden', String(isSmallScreen()));
}

function setSheetState(next) {
  if (isLandscapePhone()) next = 'peek';
  ui.app.dataset.sheet = next;
  ui.sheetToggleLabel.textContent = next === 'expanded' ? 'Collapse' : next === 'minimized' ? 'Open' : 'Expand';
  ui.sheetToggleButton.setAttribute('aria-label', next === 'expanded' ? 'Collapse decision panel' : 'Expand decision panel');
  window.setTimeout(onResize, 300);
}

function cycleSheetState() {
  const current = ui.app.dataset.sheet;
  setSheetState(current === 'peek' ? 'expanded' : current === 'expanded' ? 'minimized' : 'peek');
}

function beginSheetGesture(event) {
  if (!isTouchDevice || isLandscapePhone() || !isSmallScreen()) return;
  if (event.target.closest('button, a, input, select, textarea')) return;
  sheetGesture = { y: event.clientY, pointerId: event.pointerId };
  event.currentTarget.setPointerCapture?.(event.pointerId);
}

function endSheetGesture(event) {
  if (!sheetGesture || event.pointerId !== sheetGesture.pointerId) return;
  const delta = event.clientY - sheetGesture.y;
  sheetGesture = null;
  if (Math.abs(delta) < 42) return;

  const current = ui.app.dataset.sheet;
  if (delta < 0) {
    setSheetState(current === 'minimized' ? 'peek' : 'expanded');
  } else {
    setSheetState(current === 'expanded' ? 'peek' : 'minimized');
  }
  vibrate(8);
}

function cancelSheetGesture() {
  sheetGesture = null;
}

function loadDesktopLayout() {
  try {
    return { mode: 'right', width: 430, collapsed: false, ...JSON.parse(localStorage.getItem(DESKTOP_LAYOUT_KEY) || '{}') };
  } catch {
    return { mode: 'right', width: 430, collapsed: false };
  }
}

let desktopLayout = loadDesktopLayout();

function applyDesktopLayout() {
  const mode = ['left', 'right', 'float'].includes(desktopLayout.mode) ? desktopLayout.mode : 'right';
  desktopLayout.mode = mode;
  const width = clamp(desktopLayout.width || 430, 340, Math.min(720, window.innerWidth - 28));
  desktopLayout.width = width;
  if (mode === 'float') {
    desktopLayout.x = clamp(Number.isFinite(desktopLayout.x) ? desktopLayout.x : window.innerWidth - width - 14, 8, Math.max(8, window.innerWidth - width - 8));
    desktopLayout.y = clamp(Number.isFinite(desktopLayout.y) ? desktopLayout.y : 86, 78, Math.max(78, window.innerHeight - 70));
  }
  ui.app.dataset.desktopPanel = mode;
  ui.app.classList.toggle('panel-collapsed', Boolean(desktopLayout.collapsed));
  document.documentElement.style.setProperty('--desktop-panel-w', `${width}px`);
  if (Number.isFinite(desktopLayout.x)) ui.app.style.setProperty('--float-x', `${desktopLayout.x}px`);
  if (Number.isFinite(desktopLayout.y)) ui.app.style.setProperty('--float-y', `${desktopLayout.y}px`);
  if (Number.isFinite(desktopLayout.height)) ui.app.style.setProperty('--float-h', `${clamp(desktopLayout.height, 320, window.innerHeight - 86)}px`);
  [ui.dockLeftButton, ui.dockRightButton, ui.floatPanelButton].forEach((button) => button?.classList.remove('active'));
  ({ left: ui.dockLeftButton, right: ui.dockRightButton, float: ui.floatPanelButton })[mode]?.classList.add('active');
  ui.collapsePanelButton.textContent = desktopLayout.collapsed ? '+' : '−';
  ui.collapsePanelButton.setAttribute('aria-label', desktopLayout.collapsed ? 'Expand decision panel' : 'Collapse decision panel');
  localStorage.setItem(DESKTOP_LAYOUT_KEY, JSON.stringify(desktopLayout));
  window.setTimeout(onResize, 30);
}

function setDesktopPanelMode(mode) {
  desktopLayout.mode = mode;
  desktopLayout.collapsed = false;
  if (mode === 'float') {
    const rect = ui.decisionPanel.getBoundingClientRect();
    desktopLayout.x = clamp(rect.left, 14, window.innerWidth - clamp(desktopLayout.width || 430, 340, 720) - 14);
    desktopLayout.y = clamp(rect.top, 86, window.innerHeight - 320);
  }
  applyDesktopLayout();
}

function beginDesktopPanelGesture(event, type) {
  if (isSmallScreen() || event.button !== 0) return;
  if (type === 'move' && desktopLayout.mode !== 'float') return;
  const rect = ui.decisionPanel.getBoundingClientRect();
  desktopPanelGesture = { type, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: rect.left, y: rect.top, width: rect.width };
  event.currentTarget.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function moveDesktopPanelGesture(event) {
  if (!desktopPanelGesture || desktopPanelGesture.pointerId !== event.pointerId) return;
  const dx = event.clientX - desktopPanelGesture.startX;
  const dy = event.clientY - desktopPanelGesture.startY;
  if (desktopPanelGesture.type === 'move') {
    desktopLayout.x = clamp(desktopPanelGesture.x + dx, 8, window.innerWidth - ui.decisionPanel.offsetWidth - 8);
    desktopLayout.y = clamp(desktopPanelGesture.y + dy, 78, window.innerHeight - 70);
    ui.app.style.setProperty('--float-x', `${desktopLayout.x}px`);
    ui.app.style.setProperty('--float-y', `${desktopLayout.y}px`);
  } else {
    const delta = desktopLayout.mode === 'left' ? dx : -dx;
    desktopLayout.width = clamp(desktopPanelGesture.width + delta, 340, Math.min(720, window.innerWidth - 420));
    document.documentElement.style.setProperty('--desktop-panel-w', `${desktopLayout.width}px`);
    onResize();
  }
}

function endDesktopPanelGesture(event) {
  if (!desktopPanelGesture || desktopPanelGesture.pointerId !== event.pointerId) return;
  desktopPanelGesture = null;
  localStorage.setItem(DESKTOP_LAYOUT_KEY, JSON.stringify(desktopLayout));
}

function updateConnectionStatus() {
  const online = navigator.onLine;
  ui.onlineStatus.textContent = online ? 'Online' : 'Offline ready';
  ui.onlineStatus.classList.toggle('offline', !online);
}

function requestChoice(choiceIndex) {
  if (!currentEvent || state.ended) return;
  if (!settings.confirmChoices) {
    applyChoice(choiceIndex);
    return;
  }
  pendingChoiceIndex = choiceIndex;
  const choice = currentEvent.choices[choiceIndex];
  ui.confirmChoiceTitle.textContent = choice.label;
  ui.confirmChoiceDescription.textContent = choice.description;
  ui.confirmImpact.innerHTML = impactPreview(choice.impact);
  ui.confirmDialog.showModal();
  vibrate(10);
}

function cancelChoice() {
  pendingChoiceIndex = null;
  if (ui.confirmDialog.open) ui.confirmDialog.close();
}

function confirmPendingChoice() {
  if (pendingChoiceIndex === null) return;
  const index = pendingChoiceIndex;
  pendingChoiceIndex = null;
  ui.confirmDialog.close();
  applyChoice(index);
}

function saveGame() {
  if (!state.started) return;
  try {
    localStorage.setItem(GAME_SAVE_KEY, JSON.stringify({ state, savedAt: Date.now() }));
  } catch {
    // Saving is a convenience; the live game should continue if storage is unavailable.
  }
}

function loadSavedGameCandidate() {
  try {
    const parsed = JSON.parse(localStorage.getItem(GAME_SAVE_KEY) || 'null');
    if (parsed?.state?.started && Array.isArray(parsed.state.history)) return parsed;
  } catch {
    return null;
  }
  return null;
}

function clearTowerVisuals() {
  if (!towerRoot) return;
  floorGroups = [];
  clickableMeshes = [];
  [...towerRoot.children].forEach((child) => {
    if (child !== foundationRoot) towerRoot.remove(child);
  });
  createInitialCore();
}

function rebuildTowerFromHistory() {
  if (!towerRoot || storyMode) return;
  clearTowerVisuals();
  state.history.forEach((entry) => addFloor(entry, { animate: false }));
  focusCurrentFloor();
}

function resumeSavedGame() {
  if (!savedGameCandidate) return;
  state = { ...initialState(), ...savedGameCandidate.state };
  currentEvent = state.ended ? null : events[Math.min(state.turn, events.length - 1)];
  rebuildTowerFromHistory();
  ui.introView.hidden = true;
  if (state.ended) runFinalCrisis({ replay: true });
  else renderEvent();
  updateUI();
  updateHistory();
  ui.resumeDialog.close();
  showToast(`Resumed at floor ${state.turn}.`);
}

function clearSavedGame({ restart = false } = {}) {
  localStorage.removeItem(GAME_SAVE_KEY);
  savedGameCandidate = null;
  if (restart) resetGame();
}

async function requestWakeLock() {
  if (!settings.wakeLock || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
  } catch {
    settings.wakeLock = false;
    ui.wakeLockToggle.checked = false;
  }
}

async function releaseWakeLock() {
  if (!wakeLock) return;
  try { await wakeLock.release(); } catch { /* no-op */ }
  wakeLock = null;
}

function initScene() {
  qualityProfile = resolveQualityProfile();
  if (!WebGL.isWebGL2Available()) {
    storyMode = true;
    ui.fallback.hidden = false;
    return;
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x08090c);
  scene.fog = new THREE.FogExp2(0x08090c, 0.018);

  camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 260);
  camera.position.set(18, 12, 24);

  renderer = new THREE.WebGLRenderer({
    canvas: ui.canvas,
    antialias: qualityProfile.name === 'high',
    powerPreference: qualityProfile.name === 'low' ? 'low-power' : 'high-performance',
    preserveDrawingBuffer: false,
  });
  renderer.setPixelRatio(qualityProfile.pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = qualityProfile.shadows;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !settings.reduceMotion;
  controls.dampingFactor = 0.055;
  controls.enablePan = !isTouchDevice;
  controls.rotateSpeed = isTouchDevice ? 0.7 : 1;
  controls.zoomSpeed = isTouchDevice ? 0.85 : 1;
  controls.minDistance = 10;
  controls.maxDistance = 62;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.target.set(0, 4, 0);

  const ambient = new THREE.HemisphereLight(0xffe8d4, 0x161b27, 1.8);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffd2a8, 3.1);
  key.position.set(14, 24, 10);
  key.castShadow = qualityProfile.shadows;
  key.shadow.mapSize.set(qualityProfile.name === 'high' ? 2048 : 512, qualityProfile.name === 'high' ? 2048 : 512);
  key.shadow.camera.left = -28;
  key.shadow.camera.right = 28;
  key.shadow.camera.top = 34;
  key.shadow.camera.bottom = -12;
  scene.add(key);

  const rim = new THREE.PointLight(0xb91c1c, 36, 48, 2);
  rim.position.set(-12, 12, -8);
  scene.add(rim);

  const warm = new THREE.PointLight(0xea580c, 22, 42, 2);
  warm.position.set(11, 4, 12);
  scene.add(warm);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(33, qualityProfile.segments),
    new THREE.MeshStandardMaterial({ color: 0x0e1117, roughness: 0.92, metalness: 0.18 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = qualityProfile.shadows;
  ground.position.y = -0.15;
  scene.add(ground);

  const grid = new THREE.GridHelper(58, qualityProfile.name === 'high' ? 40 : 28, 0x4e2720, 0x20242c);
  grid.position.y = -0.12;
  grid.material.opacity = 0.23;
  grid.material.transparent = true;
  scene.add(grid);

  towerRoot = new THREE.Group();
  scene.add(towerRoot);

  createFoundation();
  createStars();
  createInitialCore();

  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(onResize, 220), { passive: true });
  window.visualViewport?.addEventListener('resize', onResize, { passive: true });
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('dblclick', focusCurrentFloor);
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    renderPaused = true;
    showToast('3D context paused. The game state is safe.');
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    renderPaused = false;
    onResize();
    animate();
    showToast('3D rendering restored.');
  });

  onResize();
  animate();
}

function createStars() {
  const count = qualityProfile?.stars || 180;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const radius = 48 + Math.random() * 70;
    const angle = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 3 + Math.random() * 72;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xcfd6df, size: qualityProfile?.starSize || 0.12, transparent: true, opacity: 0.45, depthWrite: false });
  stars = new THREE.Points(geometry, material);
  scene.add(stars);
}

function createFoundation() {
  foundationRoot = new THREE.Group();
  towerRoot.add(foundationRoot);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(5.3, 6.2, 1.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.56, metalness: 0.55 })
  );
  base.position.y = 0.45;
  base.castShadow = true;
  base.receiveShadow = true;
  foundationRoot.add(base);

  const labels = [
    ['VALUES', 0xb91c1c],
    ['PRIORS', 0xea580c],
    ['GOVERNANCE', 0xfdba74],
    ['MODEL CLASS', 0x9fb5c9],
  ];

  labels.forEach(([label, color], index) => {
    const segment = new THREE.Mesh(
      new THREE.CylinderGeometry(4.4 - index * 0.15, 4.4 - index * 0.15, 0.28, 64, 1, true),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.14, roughness: 0.45, metalness: 0.52, transparent: true, opacity: 0.86 })
    );
    segment.position.y = 1.14 + index * 0.34;
    foundationRoot.add(segment);

    const sprite = createTextSprite(label, '#f7e7d9', 'rgba(11,11,13,.72)', 54);
    const angle = (index / labels.length) * Math.PI * 2 + Math.PI / 4;
    sprite.position.set(Math.cos(angle) * 5.2, 1.15 + index * 0.34, Math.sin(angle) * 5.2);
    sprite.scale.set(2.8, 0.7, 1);
    foundationRoot.add(sprite);
  });
}

function createInitialCore() {
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.5, 2.2, 24),
    new THREE.MeshStandardMaterial({ color: 0xfdba74, emissive: 0xea580c, emissiveIntensity: 0.75, transparent: true, opacity: 0.8 })
  );
  core.position.y = 2.25;
  core.userData.core = true;
  towerRoot.add(core);
}

function createTextSprite(text, color = '#ffffff', background = 'rgba(0,0,0,.5)', fontSize = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = background;
  roundRect(context, 10, 18, 492, 92, 26);
  context.fill();
  context.font = `700 ${fontSize}px Inter, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = color;
  context.fillText(text, 256, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  return new THREE.Sprite(material);
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function addFloor(entry, { animate = true } = {}) {
  const index = entry.floor;
  const y = 2.7 + (index - 1) * 2.2;
  const previous = floorGroups.at(-1);
  const visualColor = palette[entry.visual] ?? palette.patch;
  const group = new THREE.Group();
  group.position.y = y;

  const driftMagnitude = Math.max(0, 62 - entry.stateAfter.stability) / 55;
  const debtDrift = entry.stateAfter.debt / 420;
  const direction = index % 2 === 0 ? 1 : -1;
  group.position.x = direction * (driftMagnitude + debtDrift) * index * 0.12;
  group.position.z = -direction * driftMagnitude * index * 0.08;
  group.rotation.y = index * 0.075 + (entry.visual === 'oscillate' ? 0.28 : 0) + (entry.stateAfter.theta > 70 ? -0.06 : 0);
  group.scale.y = animate && !settings.reduceMotion ? 0.01 : 1;

  const slabMaterial = new THREE.MeshStandardMaterial({
    color: visualColor,
    emissive: visualColor,
    emissiveIntensity: entry.visual === 'revise' || entry.visual === 'foundation' ? 0.23 : 0.08,
    roughness: 0.46,
    metalness: 0.45,
  });

  const slab = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.42, 7.4), slabMaterial);
  slab.castShadow = Boolean(qualityProfile?.shadows);
  slab.receiveShadow = Boolean(qualityProfile?.shadows);
  slab.userData.floorIndex = index - 1;
  clickableMeshes.push(slab);
  group.add(slab);

  const lowerSlab = new THREE.Mesh(
    new THREE.BoxGeometry(6.7, 0.22, 6.7),
    new THREE.MeshStandardMaterial({ color: 0x10131a, roughness: 0.6, metalness: 0.65 })
  );
  lowerSlab.position.y = -0.28;
  lowerSlab.castShadow = Boolean(qualityProfile?.shadows);
  group.add(lowerSlab);

  const pillarHeight = 1.7;
  const pillarGeometry = new THREE.BoxGeometry(0.24, pillarHeight, 0.24);
  const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x343944, roughness: 0.48, metalness: 0.68 });
  const corners = [
    [-3.15, -3.15], [3.15, -3.15], [-3.15, 3.15], [3.15, 3.15],
  ];
  corners.forEach(([x, z]) => {
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.set(x, pillarHeight / 2 + 0.15, z);
    pillar.castShadow = Boolean(qualityProfile?.shadows);
    group.add(pillar);
  });

  const openness = clamp(entry.stateAfter.route / 100);
  const rigidity = clamp(entry.stateAfter.theta / 100);
  const wallOpacity = clamp(0.12 + rigidity * 0.72 - openness * 0.18, 0.1, 0.84);
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: entry.visual === 'seal' ? 0x591717 : 0x1f2731,
    transparent: true,
    opacity: wallOpacity,
    roughness: 0.35,
    metalness: 0.35,
    side: THREE.DoubleSide,
  });
  const wallHeight = 1.55;
  const wallWidth = 5.8 + rigidity * 1.1;
  const wallGeometry = new THREE.PlaneGeometry(wallWidth, wallHeight);
  const wallCount = entry.visual === 'seal' ? 4 : entry.visual === 'patch' ? 3 : Math.max(1, Math.round(4 - openness * 3));
  const wallPositions = [
    [0, wallHeight / 2 + 0.18, -3.02, 0],
    [3.02, wallHeight / 2 + 0.18, 0, Math.PI / 2],
    [0, wallHeight / 2 + 0.18, 3.02, Math.PI],
    [-3.02, wallHeight / 2 + 0.18, 0, -Math.PI / 2],
  ];
  for (let i = 0; i < wallCount; i += 1) {
    const wall = new THREE.Mesh(wallGeometry, wallMaterial.clone());
    const [x, wy, z, rot] = wallPositions[(i + index) % 4];
    wall.position.set(x, wy, z);
    wall.rotation.y = rot;
    wall.userData.wall = true;
    group.add(wall);
  }

  addRouteCore(group, entry, pillarHeight);
  addDebtWedges(group, entry.stateAfter.debt);
  addMemoryBand(group, entry.stateAfter.memory, visualColor);
  addDissentBalconies(group, entry.stateAfter.dissent);
  addIndependenceAntennas(group, entry.stateAfter.independence);
  addVisualSignature(group, entry.visual, visualColor);

  const label = createTextSprite(`${String(index).padStart(2, '0')}  ${entry.choice}`, '#fff6ed', 'rgba(11,11,13,.78)', 38);
  label.position.set(0, 1.12, 4.15);
  label.scale.set(4.4, 1.1, 1);
  group.add(label);

  group.userData.entry = entry;
  group.userData.targetScale = 1;
  floorGroups.push(group);
  towerRoot.add(group);

  if (previous) {
    const connectorHeight = 1.78;
    const thickness = 0.11 + entry.stateAfter.route / 480;
    const connectorMaterial = new THREE.MeshStandardMaterial({
      color: entry.stateAfter.route > 50 ? 0xfdba74 : 0x7f1d1d,
      emissive: entry.stateAfter.route > 50 ? 0xea580c : 0x4e1111,
      emissiveIntensity: entry.stateAfter.route > 50 ? 0.75 : 0.35,
      transparent: true,
      opacity: clamp(entry.stateAfter.route / 100, 0.18, 0.9),
    });
    const connector = new THREE.Mesh(new THREE.CylinderGeometry(thickness, thickness, connectorHeight, 16), connectorMaterial);
    connector.position.set(
      (group.position.x + previous.position.x) / 2,
      y - 1.1,
      (group.position.z + previous.position.z) / 2
    );
    connector.userData.core = true;
    towerRoot.add(connector);
  }

  if (animate) {
    targetCameraY = y + 7.8;
    targetControlY = y + 0.2;
  }
}

function addRouteCore(group, entry, height) {
  const route = entry.stateAfter.route;
  const radius = 0.11 + route / 290;
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.08, height + 0.42, 24),
    new THREE.MeshStandardMaterial({
      color: route > 55 ? 0xfdba74 : 0x8a2723,
      emissive: route > 55 ? 0xea580c : 0x521313,
      emissiveIntensity: route > 55 ? 0.8 : 0.32,
      transparent: true,
      opacity: clamp(route / 100, 0.16, 0.92),
    })
  );
  core.position.y = height / 2 + 0.18;
  core.userData.core = true;
  group.add(core);
}

function addDebtWedges(group, debt) {
  const count = Math.floor(debt / 16);
  for (let i = 0; i < count; i += 1) {
    const wedge = new THREE.Mesh(
      new THREE.BoxGeometry(0.5 + (i % 2) * 0.2, 0.16, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x350e10, emissive: 0x7f1d1d, emissiveIntensity: 0.25, roughness: 0.8 })
    );
    const angle = (i / Math.max(1, count)) * Math.PI * 2 + group.position.y * 0.07;
    wedge.position.set(Math.cos(angle) * 2.55, 0.34 + (i % 3) * 0.03, Math.sin(angle) * 2.55);
    wedge.rotation.y = -angle;
    group.add(wedge);
  }
}

function addMemoryBand(group, memory, color) {
  if (memory < 28) return;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.22, 0.045 + memory / 2200, 10, 72),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.42, transparent: true, opacity: clamp(memory / 100, 0.25, 0.88) })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.45;
  group.add(ring);
}

function addDissentBalconies(group, dissent) {
  const count = dissent > 72 ? 4 : dissent > 48 ? 2 : dissent > 25 ? 1 : 0;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + Math.PI / 4;
    const balcony = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.12, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xc5c9d0, roughness: 0.5, metalness: 0.55 })
    );
    balcony.position.set(Math.cos(angle) * 3.65, 0.48, Math.sin(angle) * 3.65);
    balcony.rotation.y = -angle;
    group.add(balcony);
  }
}

function addIndependenceAntennas(group, independence) {
  const count = independence > 78 ? 4 : independence > 55 ? 3 : independence > 32 ? 2 : 1;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + 0.3;
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.045, 0.75 + i * 0.08, 8),
      new THREE.MeshStandardMaterial({ color: 0x9fb5c9, emissive: 0x516779, emissiveIntensity: 0.45 })
    );
    antenna.position.set(Math.cos(angle) * 2.15, 1.93, Math.sin(angle) * 2.15);
    group.add(antenna);
  }
}

function addVisualSignature(group, visual, color) {
  if (visual === 'revise' || visual === 'foundation') {
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(4.08, 0.07, 12, 88),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2, transparent: true, opacity: 0.88 })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.08;
    group.add(halo);
  }

  if (visual === 'contain') {
    const cageMaterial = new THREE.LineBasicMaterial({ color: 0xfdba74, transparent: true, opacity: 0.72 });
    const box = new THREE.BoxGeometry(6.3, 1.6, 6.3);
    const edges = new THREE.EdgesGeometry(box);
    const cage = new THREE.LineSegments(edges, cageMaterial);
    cage.position.y = 0.9;
    group.add(cage);
  }

  if (visual === 'oscillate') {
    for (let i = 0; i < 3; i += 1) {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(3.7 + i * 0.24, 0.035, 8, 48, Math.PI * 1.35),
        new THREE.MeshStandardMaterial({ color: 0xff6d4a, emissive: 0xea580c, emissiveIntensity: 1, transparent: true, opacity: 0.68 })
      );
      arc.rotation.set(Math.PI / 2, i * 0.7, i * 1.8);
      arc.position.y = 0.8;
      group.add(arc);
    }
  }
}

function applyChoice(choiceIndex) {
  if (!currentEvent || state.ended) return;
  const choice = currentEvent.choices[choiceIndex];
  const stateBefore = snapshotState();

  Object.entries(choice.impact).forEach(([key, delta]) => {
    if (['overreactions', 'structuralRevisions', 'suppressedSignals'].includes(key)) {
      state[key] += delta;
    } else {
      state[key] = clamp(state[key] + delta);
    }
  });

  state.turn += 1;
  normalizeSystemState();

  const entry = {
    floor: state.turn,
    event: currentEvent.title,
    domain: currentEvent.domain,
    choice: choice.label,
    type: choice.type,
    visual: choice.visual,
    note: choice.note,
    impact: choice.impact,
    stateBefore,
    stateAfter: snapshotState(),
  };

  state.history.push(entry);
  if (!storyMode) addFloor(entry);
  updateUI();
  updateHistory();
  playDecisionSound(choice.visual);
  vibrate(choice.visual === 'seal' ? [22, 30, 22] : 18);
  showToast(choice.note);
  saveGame();

  if (isSmallScreen()) setSheetState('minimized');

  if (state.turn >= events.length) {
    window.setTimeout(runFinalCrisis, settings.reduceMotion ? 80 : 850);
  } else {
    currentEvent = events[state.turn];
    window.setTimeout(() => {
      renderEvent();
      if (isSmallScreen()) setSheetState('peek');
    }, settings.reduceMotion ? 80 : 650);
  }
}

function normalizeSystemState() {
  const routePressure = (state.memory + state.dissent + state.independence + (100 - state.theta)) / 4;
  state.route = clamp(state.route * 0.76 + routePressure * 0.24 - state.debt * 0.025);

  if (state.debt > 62) state.stability = clamp(state.stability - 3);
  if (state.capacity < 22) state.route = clamp(state.route - 4);
  if (state.theta > 78) state.dissent = clamp(state.dissent - 3);
  if (state.route < 35) state.debt = clamp(state.debt + 2);
  if (state.stability < 30) state.performance = clamp(state.performance - 3);
}

function snapshotState() {
  const keys = [
    'performance', 'route', 'stability', 'debt', 'phi', 'theta', 'memory', 'dissent',
    'independence', 'capacity', 'overreactions', 'structuralRevisions', 'suppressedSignals',
  ];
  return Object.fromEntries(keys.map((key) => [key, Math.round(state[key])]));
}

function renderEvent() {
  if (!currentEvent) return;
  ui.introView.hidden = true;
  ui.endingView.hidden = true;
  ui.eventView.hidden = false;
  ui.eventDomain.textContent = currentEvent.domain;
  ui.eventTitle.textContent = currentEvent.title;
  ui.eventStory.textContent = currentEvent.story;
  ui.signalBox.textContent = currentEvent.signal;
  ui.eventSeverity.textContent = `Severity ${currentEvent.severity}`;
  ui.eventRecurrence.textContent = currentEvent.recurrence;
  ui.choices.innerHTML = '';

  currentEvent.choices.forEach((choice, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-button';
    button.innerHTML = `
      <span class="choice-type">${choice.type}</span>
      <strong>${choice.label}</strong>
      <small>${choice.description}</small>
      <span class="impact-preview">${impactPreview(choice.impact)}</span>
    `;
    button.addEventListener('click', () => requestChoice(index));
    ui.choices.appendChild(button);
  });

  ui.decisionScroll.scrollTo({ top: 0, behavior: settings.reduceMotion ? 'auto' : 'smooth' });
}

function impactPreview(impact) {
  const labels = {
    performance: 'P', route: 'R', stability: 'S', debt: 'Debt', phi: 'φ', theta: 'θ', memory: 'M', dissent: 'D', independence: 'I', capacity: 'C',
  };
  return Object.entries(impact)
    .filter(([key]) => labels[key])
    .slice(0, 5)
    .map(([key, value]) => {
      const beneficialNegative = ['debt', 'theta'].includes(key);
      const positive = beneficialNegative ? value < 0 : value > 0;
      const sign = value > 0 ? '+' : '';
      return `<span class="impact-chip ${positive ? 'positive' : 'negative'}">${labels[key]} ${sign}${value}</span>`;
    })
    .join('');
}

function updateUI() {
  ui.floorNumber.textContent = state.turn;
  ui.headerFloorNumber.textContent = state.turn;
  Object.entries(ui.values).forEach(([key, element]) => {
    element.textContent = Math.round(state[key]);
  });
  Object.entries(ui.mobileValues).forEach(([key, element]) => {
    element.textContent = Math.round(state[key]);
  });
  Object.entries(ui.bars).forEach(([key, element]) => {
    element.style.width = `${Math.round(state[key])}%`;
  });

  const status = getSystemStatus();
  [ui.systemStatus, ui.mobileSystemStatus].forEach((element) => {
    element.textContent = status.label;
    element.style.color = status.color;
    element.style.borderColor = `${status.color}66`;
    element.style.background = `${status.color}14`;
  });

  ui.undoButton.disabled = state.history.length === 0 || state.ended;
  updateXrayVisuals();
}

function getSystemStatus() {
  if (state.route < 32 || state.theta > 82 || state.debt > 78) return { label: 'Sealing', color: '#ff9f92' };
  if (state.stability < 35 || state.overreactions >= 2) return { label: 'Oscillating', color: '#fdba74' };
  if (state.route > 68 && state.debt < 38 && state.stability > 52) return { label: 'Open', color: '#d6f5df' };
  return { label: 'Fragile', color: '#f8d4a6' };
}

function updateHistory() {
  if (!state.history.length) {
    ui.historyList.innerHTML = '<p class="empty-history">Your tower has no floors yet.</p>';
    return;
  }
  ui.historyList.innerHTML = '';
  [...state.history].reverse().forEach((entry) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'history-item';
    button.innerHTML = `
      <span class="history-index">${String(entry.floor).padStart(2, '0')}</span>
      <span class="history-copy"><strong>${entry.choice}</strong><small>${entry.domain} · R ${entry.stateAfter.route} · Debt ${entry.stateAfter.debt}</small></span>
    `;
    button.addEventListener('click', () => inspectFloor(entry.floor - 1));
    ui.historyList.appendChild(button);
  });
}

function inspectFloor(index) {
  const group = floorGroups[index];
  const entry = state.history[index];
  if (!entry) return;
  selectedFloor = index;
  if (group && !storyMode) {
    targetControlY = group.position.y + 0.35;
    targetCameraY = group.position.y + 7.4;
    floorGroups.forEach((floor, floorIndex) => {
      floor.traverse((object) => {
        if (object.isMesh && object.material && object.material.emissive) {
          object.material.emissiveIntensity = floorIndex === index ? Math.max(0.45, object.material.emissiveIntensity) : Math.min(object.material.emissiveIntensity, 0.2);
        }
      });
    });
  }
  closeHistory();
  showToast(`Floor ${entry.floor}: ${entry.choice} — ${entry.note}`);
}

function runFinalCrisis({ replay = false } = {}) {
  state.ended = true;
  ui.eventView.hidden = true;
  ui.introView.hidden = true;
  ui.endingView.hidden = false;

  const crisis = evaluateEnding();
  ui.endingTitle.textContent = crisis.title;
  ui.endingBody.textContent = crisis.body;
  ui.endingStats.innerHTML = [
    ['Route', Math.round(state.route)],
    ['Debt', Math.round(state.debt)],
    ['Stability', Math.round(state.stability)],
    ['θ rigidity', Math.round(state.theta)],
  ].map(([label, value]) => `<div class="ending-stat"><strong>${value}</strong><small>${label}</small></div>`).join('');
  showToast(crisis.toast);
  if (!replay) playEndingSound(crisis.kind);
  saveGame();
  if (isSmallScreen()) setSheetState('expanded');
}

function evaluateEnding() {
  const correctionPower = (
    state.route * 0.28 +
    state.memory * 0.12 +
    state.dissent * 0.12 +
    state.independence * 0.12 +
    (100 - state.theta) * 0.17 +
    state.stability * 0.13 +
    (100 - state.debt) * 0.06
  );

  if (state.stability < 32 || state.overreactions >= 2) {
    return {
      kind: 'oscillating',
      title: 'The Oscillating Tower',
      body: 'The final discrepancy reaches every level at once. Nothing is protected from revision, so the tower reorganizes faster than it can preserve function. You maintained openness without enough discrimination. The system can still change—but it cannot remain itself long enough to learn whether the change worked.',
      toast: 'Maximum responsiveness became structural instability.',
    };
  }

  if (state.performance < 22 && state.route > 55) {
    return {
      kind: 'ruin',
      title: 'The Open Ruin',
      body: 'Nearly every assumption remains revisable, every dissent channel survives, and every discrepancy can reach the foundation. But the tower has consumed its operative purpose in the act of reviewing itself. It is open because almost nothing is left in motion. Corrigibility was maximized as a score instead of maintained as a capacity within a functioning system.',
      toast: 'Perfect revisability without continued function is another form of failure.',
    };
  }

  if (state.route < 36 || state.theta > 80 || state.debt > 76 || state.dissent < 24) {
    return {
      kind: 'sealed',
      title: 'The Sealed Tower',
      body: 'The final discrepancy is detected, documented, and explained. It never reaches the assumptions capable of changing the outcome. The tower remains efficient, coherent, and internally legible as the failure moves through it. The correction route exists as ceremony, not as reachable authority.',
      toast: 'The system processed the signal without becoming correctable by it.',
    };
  }

  if (correctionPower >= 66 && state.route > 60 && state.debt < 48 && state.stability > 46 && state.performance >= 30) {
    return {
      kind: 'adaptive',
      title: 'The Adaptive Tower',
      body: 'The final discrepancy enters through more than one channel, survives provisional uncertainty, and reaches the level implicated by the evidence. The response is costly but bounded. The tower changes without dissolving, preserves its audit trail, and remains open to discovering that this correction was incomplete.',
      toast: 'The tower stayed stable because its routes—not its conclusions—were maintained.',
    };
  }

  return {
    kind: 'fragile',
    title: 'The Fragile Hybrid',
    body: 'The tower survives the final discrepancy, but only through improvised containment and a narrow remaining route. Some slow coordinates remain reachable; others are protected by accumulated debt and past commitments. The system is neither sealed nor reliably corrigible. Its next crisis will depend on which pathway fails first.',
    toast: 'The structure survived, but its correction routes are conditional.',
  };
}

function resetGame() {
  state = initialState();
  currentEvent = null;
  selectedFloor = null;
  pendingChoiceIndex = null;
  if (!storyMode) clearTowerVisuals();

  ui.endingView.hidden = true;
  ui.eventView.hidden = true;
  ui.introView.hidden = false;
  ui.historyList.innerHTML = '<p class="empty-history">Your tower has no floors yet.</p>';
  targetCameraY = 12;
  targetControlY = 4;
  if (camera) camera.position.set(18, 12, 24);
  clearSavedGame();
  setSheetState('peek');
  updateUI();
  closeHistory();
  closeMetrics();
}

function startGame() {
  state.started = true;
  state.ended = false;
  currentEvent = events[state.turn];
  renderEvent();
  setSheetState('peek');
  saveGame();
  if (!localStorage.getItem(TUTORIAL_SEEN_KEY)) openTutorial();
  showToast('Every choice adds a floor. Every floor changes what future evidence can reach.');
}

function toggleXray() {
  xrayOn = !xrayOn;
  [ui.xrayButton, ui.mobileXrayButton, ui.dockXrayButton].forEach((button) => {
    button.setAttribute('aria-pressed', String(xrayOn));
  });
  ui.xrayButton.textContent = `X-ray ${xrayOn ? 'on' : 'off'}`;
  ui.mobileXrayButton.textContent = `X-ray ${xrayOn ? 'on' : 'off'}`;
  updateXrayVisuals();
  vibrate(9);
  showToast(xrayOn ? 'X-ray exposes slow coordinates and correction cores.' : 'Architectural skin restored.');
}

function updateXrayVisuals() {
  if (!towerRoot) return;
  floorGroups.forEach((group) => {
    group.traverse((object) => {
      if (object.userData.wall && object.material) {
        const base = clamp(0.12 + state.theta / 100 * 0.62 - state.route / 100 * 0.14, 0.08, 0.82);
        object.material.opacity = xrayOn ? 0.045 : base;
      }
      if (object.userData.core && object.material) {
        object.material.opacity = xrayOn ? 1 : clamp(state.route / 100, 0.18, 0.9);
        object.material.emissiveIntensity = xrayOn ? 1.65 : 0.7;
      }
    });
  });
  foundationRoot.traverse((object) => {
    if (object.material && 'emissiveIntensity' in object.material) {
      object.material.emissiveIntensity = xrayOn ? 0.82 : 0.16;
    }
  });
}

function toggleSound() {
  audioOn = !audioOn;
  [ui.soundButton, ui.mobileSoundButton].forEach((button) => button.setAttribute('aria-pressed', String(audioOn)));
  ui.soundButton.textContent = `Sound ${audioOn ? 'on' : 'off'}`;
  ui.mobileSoundButton.textContent = `Sound ${audioOn ? 'on' : 'off'}`;
  if (audioOn) {
    ensureAudio();
    startHum();
  } else {
    stopHum();
  }
}

function ensureAudio() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
}

function startHum() {
  if (!audioOn || humOscillator) return;
  ensureAudio();
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = 'sine';
  osc.frequency.value = 47;
  gain.gain.value = 0.025;
  osc.connect(gain).connect(audioContext.destination);
  osc.start();
  humOscillator = { osc, gain };
}

function stopHum() {
  if (!humOscillator) return;
  humOscillator.gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.2);
  humOscillator.osc.stop(audioContext.currentTime + 0.25);
  humOscillator = null;
}

function playDecisionSound(visual) {
  if (!audioOn) return;
  ensureAudio();
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const frequencies = { patch: 180, contain: 240, revise: 420, foundation: 130, seal: 95, archive: 320, oscillate: 560 };
  osc.frequency.setValueAtTime(frequencies[visual] || 220, now);
  osc.frequency.exponentialRampToValueAtTime((frequencies[visual] || 220) * 1.45, now + 0.22);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
  osc.connect(gain).connect(audioContext.destination);
  osc.start(now);
  osc.stop(now + 0.4);
}

function playEndingSound(kind) {
  if (!audioOn) return;
  const map = { adaptive: [220, 330, 440], fragile: [180, 240, 300], sealed: [120, 90, 70], oscillating: [260, 520, 190], ruin: [210, 160, 105] };
  (map[kind] || map.fragile).forEach((frequency, index) => {
    window.setTimeout(() => playTone(frequency, 0.45), index * 170);
  });
}

function playTone(frequency, duration) {
  ensureAudio();
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = 'triangle';
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain).connect(audioContext.destination);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

function showToast(message) {
  clearTimeout(toastTimer);
  ui.toast.textContent = message;
  ui.toast.classList.add('visible');
  toastTimer = window.setTimeout(() => ui.toast.classList.remove('visible'), 3600);
}

function focusCurrentFloor() {
  if (storyMode || !camera || !controls) {
    showToast(state.turn ? `Current structure: floor ${state.turn}.` : 'The tower begins at its foundation.');
    return;
  }
  const current = floorGroups.at(-1);
  if (current) {
    targetControlY = current.position.y + 0.3;
    targetCameraY = current.position.y + (isSmallScreen() ? 8.8 : 7.5);
  } else {
    targetControlY = 4;
    targetCameraY = 12;
  }
  vibrate(8);
}

function onPointerDown(event) {
  pointerDown = { x: event.clientX, y: event.clientY, time: performance.now() };
}

function onPointerUp(event) {
  if (!pointerDown || !renderer || !camera) return;
  const distance = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
  const elapsed = performance.now() - pointerDown.time;
  pointerDown = null;
  if (distance > 9 || elapsed > 500) return;

  const now = performance.now();
  if (isTouchDevice && now - lastTapAt < 310) {
    lastTapAt = 0;
    focusCurrentFloor();
    return;
  }
  lastTapAt = now;

  const rect = renderer.domElement.getBoundingClientRect();
  const pointer = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(clickableMeshes, false);
  if (intersections.length) inspectFloor(intersections[0].object.userData.floorIndex);
}

function onResize() {
  if (!camera || !renderer) return;
  const viewportWidth = window.innerWidth;
  const height = window.innerHeight;
  if (!isSmallScreen() && desktopLayout.mode === 'float' && !desktopPanelGesture) {
    desktopLayout.width = clamp(desktopLayout.width || 430, 340, Math.min(720, viewportWidth - 16));
    desktopLayout.x = clamp(desktopLayout.x || viewportWidth - desktopLayout.width - 14, 8, Math.max(8, viewportWidth - desktopLayout.width - 8));
    desktopLayout.y = clamp(desktopLayout.y || 86, 78, Math.max(78, height - 70));
    ui.app.style.setProperty('--desktop-panel-w', `${desktopLayout.width}px`);
    ui.app.style.setProperty('--float-x', `${desktopLayout.x}px`);
    ui.app.style.setProperty('--float-y', `${desktopLayout.y}px`);
  }
  const dockedDesktop = !isSmallScreen() && !desktopLayout.collapsed && desktopLayout.mode !== 'float';
  const width = dockedDesktop ? Math.max(520, viewportWidth - clamp(desktopLayout.width || 430, 340, 720) - 20) : viewportWidth;
  ui.canvas.style.width = `${width}px`;
  ui.canvas.style.height = `${height}px`;
  camera.aspect = width / height;
  camera.fov = isLandscapePhone() ? 48 : isSmallScreen() ? 50 : 44;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(qualityProfile?.pixelRatio || Math.min(window.devicePixelRatio, 1.05));
}

function animate() {
  if (animationFrameId || renderPaused || storyMode || !renderer) return;
  const frame = () => {
    if (renderPaused || document.visibilityState === 'hidden') {
      animationFrameId = null;
      return;
    }
    animationFrameId = requestAnimationFrame(frame);
    const time = performance.now() * 0.001;
    const motion = !settings.reduceMotion;

    if (stars && motion) stars.rotation.y = time * 0.004;
    if (foundationRoot && motion) foundationRoot.rotation.y = Math.sin(time * 0.1) * 0.015;

    floorGroups.forEach((group, index) => {
      if (group.scale.y < 0.999) {
        group.scale.y = motion ? lerp(group.scale.y, 1, 0.085) : 1;
      }
      if (motion && group.userData.entry?.visual === 'oscillate') {
        group.rotation.z = Math.sin(time * 4 + index) * 0.018;
      }
    });

    const portraitOffset = isSmallScreen() && !isLandscapePhone() ? 2.6 : 0;
    const landscapeXOffset = isLandscapePhone() ? 3.1 : 0;
    controls.target.y = lerp(controls.target.y, targetControlY - portraitOffset, motion ? 0.045 : 1);
    controls.target.x = lerp(controls.target.x, landscapeXOffset, motion ? 0.045 : 1);
    const desiredDistance = Math.max(isSmallScreen() ? 19 : 17, 23 + state.turn * 0.45);
    const horizontal = new THREE.Vector2(camera.position.x, camera.position.z);
    if (horizontal.length() < desiredDistance * 0.82) {
      horizontal.setLength(lerp(horizontal.length(), desiredDistance, motion ? 0.02 : 1));
      camera.position.x = horizontal.x;
      camera.position.z = horizontal.y;
    }
    camera.position.y = lerp(camera.position.y, targetCameraY, motion ? 0.025 : 1);

    if (humOscillator && audioContext) {
      const targetFrequency = 42 + state.debt * 0.32 + (100 - state.stability) * 0.14;
      humOscillator.osc.frequency.setTargetAtTime(targetFrequency, audioContext.currentTime, 0.2);
    }

    controls.enableDamping = motion;
    controls.update();
    renderer.render(scene, camera);
  };
  animationFrameId = requestAnimationFrame(frame);
}

function undoLastDecision() {
  if (!state.history.length || state.ended) return;
  const removed = state.history.at(-1);
  const history = state.history.slice(0, -1);
  state = {
    ...state,
    ...removed.stateBefore,
    history,
    turn: history.length,
    started: true,
    ended: false,
  };
  currentEvent = events[state.turn];
  rebuildTowerFromHistory();
  renderEvent();
  updateUI();
  updateHistory();
  saveGame();
  closeHistory();
  setSheetState('peek');
  vibrate([12, 28, 12]);
  showToast(`Removed floor ${removed.floor}. The prior route has been restored.`);
}

function shareResult() {
  const ending = evaluateEnding();
  const text = `${ending.title} — Route ${Math.round(state.route)}, Stability ${Math.round(state.stability)}, Debt ${Math.round(state.debt)}. I built The Self-Sealing Tower.`;
  if (navigator.share) {
    navigator.share({ title: 'The Self-Sealing Tower', text }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast('Result copied to clipboard.')).catch(() => showToast(text));
  } else {
    showToast(text);
  }
}

function openSettings() {
  closeHistory();
  closeMetrics();
  applySettings();
  ui.settingsDialog.showModal();
}

function openTutorial() {
  tutorialPage = 0;
  renderTutorialPage();
  if (!ui.tutorialDialog.open) ui.tutorialDialog.showModal();
}

function renderTutorialPage() {
  document.querySelectorAll('[data-tutorial-page]').forEach((page, index) => page.classList.toggle('active', index === tutorialPage));
  document.querySelectorAll('.tutorial-dots span').forEach((dot, index) => dot.classList.toggle('active', index === tutorialPage));
  ui.tutorialBackButton.disabled = tutorialPage === 0;
  ui.tutorialNextButton.textContent = tutorialPage === 2 ? 'Start climbing' : 'Next';
}

function tutorialNext() {
  if (tutorialPage < 2) {
    tutorialPage += 1;
    renderTutorialPage();
    return;
  }
  localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
  ui.tutorialDialog.close();
}

function tutorialBack() {
  tutorialPage = Math.max(0, tutorialPage - 1);
  renderTutorialPage();
}

async function installApp() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    ui.installBanner.hidden = true;
    return;
  }
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  showToast(isiOS ? 'In Safari, tap Share, then Add to Home Screen.' : 'Use your browser menu and choose Install app or Add to Home screen.');
}

function registerPwa() {
  updateConnectionStatus();
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);

  if ('serviceWorker' in navigator && window.location.protocol !== 'file:' && !window.__SELF_SEALING_STANDALONE__) {
    const register = () => navigator.serviceWorker.register('./sw.js').catch(() => {});
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (!localStorage.getItem(INSTALL_DISMISSED_KEY)) ui.installBanner.hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    ui.installBanner.hidden = true;
    showToast('The tower is installed and ready offline.');
  });
}

function handleVisibilityChange() {
  renderPaused = document.visibilityState === 'hidden';
  if (renderPaused) {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    stopHum();
    releaseWakeLock();
    saveGame();
  } else {
    if (audioOn) startHum();
    if (settings.wakeLock) requestWakeLock();
    animate();
  }
}

function initializeMobileExperience() {
  applySettings();
  registerPwa();
  savedGameCandidate = loadSavedGameCandidate();
  if (savedGameCandidate) {
    ui.resumeSummary.textContent = `Floor ${savedGameCandidate.state.turn} of 10 · Route ${Math.round(savedGameCandidate.state.route)} · Debt ${Math.round(savedGameCandidate.state.debt)}`;
    window.setTimeout(() => ui.resumeDialog.showModal(), 250);
  }
  closeMetrics();
  closeHistory();
  setSheetState('peek');
}

ui.startButton.addEventListener('click', startGame);
ui.restartButton.addEventListener('click', resetGame);
ui.tutorialButton.addEventListener('click', openTutorial);
ui.focusButton.addEventListener('click', focusCurrentFloor);
ui.mobileFocusButton.addEventListener('click', focusCurrentFloor);
ui.dockFocusButton.addEventListener('click', focusCurrentFloor);
ui.xrayButton.addEventListener('click', toggleXray);
ui.mobileXrayButton.addEventListener('click', toggleXray);
ui.dockXrayButton.addEventListener('click', toggleXray);
ui.soundButton.addEventListener('click', toggleSound);
ui.mobileSoundButton.addEventListener('click', toggleSound);
ui.settingsButton.addEventListener('click', openSettings);
ui.mobileMenuButton.addEventListener('click', openSettings);
ui.dockSettingsButton.addEventListener('click', openSettings);
ui.mobileHudButton.addEventListener('click', openMetrics);
ui.metricsCloseButton.addEventListener('click', closeMetrics);
document.querySelectorAll('[data-open-metrics]').forEach((button) => button.addEventListener('click', openMetrics));
ui.historyOpenButton.addEventListener('click', openHistory);
ui.historyCloseButton.addEventListener('click', closeHistory);
ui.dockHistoryButton.addEventListener('click', openHistory);
ui.sheetToggleButton.addEventListener('click', cycleSheetState);
ui.dockLeftButton.addEventListener('click', () => setDesktopPanelMode('left'));
ui.dockRightButton.addEventListener('click', () => setDesktopPanelMode('right'));
ui.floatPanelButton.addEventListener('click', () => setDesktopPanelMode('float'));
ui.collapsePanelButton.addEventListener('click', () => { desktopLayout.collapsed = !desktopLayout.collapsed; applyDesktopLayout(); });
ui.desktopDragHandle.addEventListener('pointerdown', (event) => beginDesktopPanelGesture(event, 'move'));
ui.desktopResizeHandle.addEventListener('pointerdown', (event) => beginDesktopPanelGesture(event, 'resize'));
[ui.decisionPanel].forEach((panel) => panel.addEventListener('pointerup', () => {
  if (isSmallScreen() || desktopLayout.mode !== 'float' || desktopPanelGesture) return;
  const rect = panel.getBoundingClientRect();
  desktopLayout.width = clamp(rect.width, 340, Math.min(720, window.innerWidth - 16));
  desktopLayout.height = clamp(rect.height, 320, window.innerHeight - 86);
  desktopLayout.x = clamp(rect.left, 8, window.innerWidth - desktopLayout.width - 8);
  desktopLayout.y = clamp(rect.top, 78, window.innerHeight - 70);
  localStorage.setItem(DESKTOP_LAYOUT_KEY, JSON.stringify(desktopLayout));
}));
[ui.desktopDragHandle, ui.desktopResizeHandle].forEach((surface) => {
  surface.addEventListener('pointermove', moveDesktopPanelGesture);
  surface.addEventListener('pointerup', endDesktopPanelGesture);
  surface.addEventListener('pointercancel', endDesktopPanelGesture);
});
[ui.sheetGrabber, ui.sheetToolbar].filter(Boolean).forEach((surface) => {
  surface.addEventListener('pointerdown', beginSheetGesture);
  surface.addEventListener('pointerup', endSheetGesture);
  surface.addEventListener('pointercancel', cancelSheetGesture);
});
ui.undoButton.addEventListener('click', undoLastDecision);
ui.shareResultButton.addEventListener('click', shareResult);
ui.historyToggle.addEventListener('click', () => {
  const collapsed = ui.historyPanel.classList.toggle('collapsed');
  ui.historyToggle.textContent = collapsed ? '+' : '−';
  ui.historyToggle.setAttribute('aria-expanded', String(!collapsed));
});

ui.confirmCancelIcon.addEventListener('click', cancelChoice);
ui.confirmCancelButton.addEventListener('click', cancelChoice);
ui.confirmChoiceButton.addEventListener('click', confirmPendingChoice);
ui.confirmDialog.addEventListener('cancel', (event) => { event.preventDefault(); cancelChoice(); });

ui.tutorialCloseButton.addEventListener('click', () => {
  localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
  ui.tutorialDialog.close();
});
ui.tutorialNextButton.addEventListener('click', tutorialNext);
ui.tutorialBackButton.addEventListener('click', tutorialBack);
ui.settingsTutorialButton.addEventListener('click', () => { ui.settingsDialog.close(); openTutorial(); });

ui.qualitySelect.addEventListener('change', () => {
  settings.quality = ui.qualitySelect.value;
  applySettings({ rebuildRenderer: true });
  showToast('3D quality updated. Reloading later will fully rebuild scene detail.');
});
ui.textSizeSelect.addEventListener('change', () => { settings.textSize = ui.textSizeSelect.value; applySettings(); });
ui.reduceMotionToggle.addEventListener('change', () => { settings.reduceMotion = ui.reduceMotionToggle.checked; applySettings(); });
ui.confirmToggle.addEventListener('change', () => { settings.confirmChoices = ui.confirmToggle.checked; applySettings(); });
ui.hapticsToggle.addEventListener('change', () => { settings.haptics = ui.hapticsToggle.checked; applySettings(); });
ui.wakeLockToggle.addEventListener('change', () => { settings.wakeLock = ui.wakeLockToggle.checked; applySettings(); });
ui.resetSaveButton.addEventListener('click', () => {
  clearSavedGame({ restart: true });
  ui.settingsDialog.close();
  showToast('Saved tower cleared.');
});

ui.resumeGameButton.addEventListener('click', resumeSavedGame);
ui.newGameButton.addEventListener('click', () => {
  clearSavedGame();
  ui.resumeDialog.close();
  resetGame();
});
ui.installButton.addEventListener('click', installApp);
ui.settingsInstallButton.addEventListener('click', installApp);
ui.installDismissButton.addEventListener('click', () => {
  localStorage.setItem(INSTALL_DISMISSED_KEY, '1');
  ui.installBanner.hidden = true;
});
ui.continueWithout3dButton.addEventListener('click', () => {
  storyMode = true;
  ui.fallback.hidden = true;
  showToast('Story mode enabled. Decisions and endings remain fully playable.');
});

document.addEventListener('visibilitychange', handleVisibilityChange);
window.addEventListener('pagehide', saveGame);
window.addEventListener('beforeunload', saveGame);
applyDesktopLayout();

initScene();
initializeMobileExperience();
updateUI();
