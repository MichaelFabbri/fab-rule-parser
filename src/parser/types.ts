import { Chapter, Contribution, Definition, Line, Rule, Section } from "../types";

export type DocumentLocation = 'cover' | 'preface' | 'toc' | 'chapters' | 'glossary' | 'credits';
export type ChapterLocation = 'chapter' | 'section' | 'rule' | 'subrule';

export type ParserState = {
  documentLocation: DocumentLocation;
  chapterLocation: ChapterLocation;
  currentChapter?: string;
  chapter?: Chapter;
  section?: Section;
  rule?: Rule;
  subrule?: Rule;
  definition?: Definition;
  contribution?: Contribution;
}

export type Page = {
  number: string,
  header?: string,
  lines: Line[];
}

export type PageWip = Omit<Page, 'number'>;