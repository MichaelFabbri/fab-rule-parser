import { Line } from "../types";

const definitionOverrides = ['(1H)','(2H)'];
const contributionTypes = ['Flesh and Blood Creator', 'Rules and Policy Manager', 'Development Team', 'Community Contributors'];

export const chapters = ['gameConcepts', 'objectProperties', 'zones', 'gameStructure', 'layerCardsAbilities',
  'effects', 'combat', 'keywords', 'additionalRules'];

export function lineStartsChapter(line: Line): boolean {
  return /^\d+\.\s+[A-Za-z\s&$]+/.test(line.text);
}
export function lineStartsSection(line: Line): boolean {
  return /^\d+\.\d+\.\s+[A-Za-z\s$]+/.test(line.text);
}
export function lineStartsRule(line: Line): boolean {
  return /^\d+\.\d+\.\d+\.\s+[A-Za-z\s$]+/.test(line.text);
}
export function lineStartsSubrule(line: Line): boolean {
  return /^\d+\.\d+\.\d+[a-z]\s+[A-Za-z\s$]+/.test(line.text);
}
export function lineStartsDefinition(line: Line): boolean {
  return definitionOverrides.includes(line.text)
    || (line.text.split(' ').length < 4 && !/[\.,;():]/g.test(line.text));
}
export function lineStartsContribution(line: Line): boolean {
  return contributionTypes.includes(line.text);
}
export function linestartsCopyright(line: Line): boolean {
  return line.text.includes('©');
}
