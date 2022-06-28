export type Reference = {
  type: 'chapter' | 'section' | 'rule';
  ref: Chapter | Section | Rule;
}

export type Line = {
  idx: number;
  text: string;
}

export type Preface = {
  title: string;
  lines: Line[];
}

export type RuleElement = {
  id: string;
  pages: string[];
  content: string | Line | Line[];
}

export type Chapter = RuleElement & {
  sections: Section[];
}

export type Section = RuleElement & {
  rules: Rule[];
}

export type Rule = RuleElement & {
  children?: Rule[];
  references?: Reference[];
  examples?: string[];
}

export type Version = {
  major: number;
  minor: number;
  patch: number;
}

export type Definition = {
  subject: string;
  definition: string;
  references: Reference[];
}

export type Glossary = {
  definitions: Definition[];
}

export type Credits = {
  contributions: Contribution[];
}

export type Contribution = {
  type: string;
  contributors: string[];
}

export type Rules = {
  version: Version;
  publicationDate: string;
  preface: Preface;
  gameConcepts: Chapter;
  objectProperties: Chapter;
  zones: Chapter;
  gameStructure: Chapter;
  layerCardsAbilities: Chapter;
  effects: Chapter;
  combat: Chapter;
  keywords: Chapter;
  additionalRules: Chapter;
  glossary: Glossary;
  credits: Credits;
  copyright: string;
}