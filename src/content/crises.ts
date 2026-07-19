import type { CrisisState } from '../simulation/types';

export const crisisDeck: CrisisState[] = [
  { id: 'pressure-crisis', title: 'The pressure that returns', stage: 'detected', severity: 58, recurrence: 3, originBuildingId: 'waterworks', implicatedBuildingIds: ['waterworks', 'hospital'], evidence: 42, publicAwareness: 8, pendingDecisionId: 'pressure-response' },
  { id: 'medication-crisis', title: 'The dose that vanished', stage: 'latent', severity: 66, recurrence: 2, originBuildingId: 'hospital', implicatedBuildingIds: ['hospital', 'archive'], evidence: 37, publicAwareness: 11, pendingDecisionId: 'medication-audit' },
  { id: 'signal-crisis', title: 'The green light with no train', stage: 'latent', severity: 53, recurrence: 4, originBuildingId: 'transit', implicatedBuildingIds: ['transit', 'hospital', 'tower'], evidence: 49, publicAwareness: 23, pendingDecisionId: 'signal-review' },
  { id: 'archive-crisis', title: 'The memory scheduled for deletion', stage: 'latent', severity: 47, recurrence: 1, originBuildingId: 'archive', implicatedBuildingIds: ['archive', 'court', 'tower'], evidence: 72, publicAwareness: 5, pendingDecisionId: 'archive-retention' },
  { id: 'rumor-crisis', title: 'The true report inside a false rumor', stage: 'latent', severity: 61, recurrence: 6, originBuildingId: 'press', implicatedBuildingIds: ['press', 'school', 'waterworks'], evidence: 31, publicAwareness: 68, pendingDecisionId: 'public-verification' },
];

export const crisisDescriptions: Record<string, string> = {
  'pressure-crisis': 'A pressure oscillation has appeared three times in separated locations. The waterworks dashboard treats them as isolated events, while hospital reserve systems depend on the same network.',
  'medication-crisis': 'A medication disappears between automated dispensing and patient administration. Local corrections fixed the count twice without explaining the dependency.',
  'signal-crisis': 'Transit control reports a safe signal while no train appears. The same timing network governs emergency hospital access across the river.',
  'archive-crisis': 'A retention policy marks dissent records and rejected causal models for deletion because they slow present review and increase political exposure.',
  'rumor-crisis': 'A widely shared sabotage claim is mostly false, but it contains one accurate observation that official reporting repeatedly omitted.',
};
