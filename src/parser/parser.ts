import { writeFileSync } from "fs";
import { isEmpty, isNil } from "lodash";
import { Contribution, Definition, Line, Rules, Version } from "../types";
import { Page, PageWip, ParserState } from "./types";
import { chapters, lineStartsChapter, lineStartsContribution, linestartsCopyright, lineStartsDefinition, lineStartsRule, lineStartsSection, lineStartsSubrule } from './utils';

export class RuleParser {
  private text: string[];
  private rules: Partial<Rules>;
  private pages: Page[];
  private state: ParserState;

  constructor(text: string) {
    this.text = text.split('\n');
    this.rules = {
      glossary: { definitions: [] },
      credits: { contributions: [] },
    };
    this.state = { documentLocation: 'cover', chapterLocation: 'chapter' };
    this.pages = [];
    this.chunkPages();
    this.metadata();
  }

  // First pass identifies page breaks and divides text into pages
  private chunkPages() {
    let page: PageWip = { lines: [] };
    let lineIdx: number = 0;
    for (let line of this.text) {
      if (/^(\d|[iv]|Legend\sStory\sStudios)+$/.test(line)) {
        // Page breaks
        this.pages.push({ ...page, number: line });
        page = { lines: [] };
        lineIdx = 0;
        continue;
      } else if (isEmpty(line)) {
        // A lot of empty lines are from the pdf conversion, ignore them all
        continue;
      } else if (lineIdx == 0 && line === line.toUpperCase()) {
        // Page headers are excluded from the text
        page.header = line;
      } else {
        // An actual line of text
        page.lines.push({
          idx: lineIdx,
          text: line,
        });
      }
      lineIdx++;
    }
  }

  // Get the version from the cover page
  private getVersion(): Version {
    // This must be run after chunkPages executes
    if (isEmpty(this.pages)) {
      throw new Error("cannot get version, pages is empty");
    }

    // Check if the document has a line containing the version
    const versionLine = this.pages[0].lines.find(l => /^v\d\.\d\.\d$/.test(l.text));
    if (isNil(versionLine)) {
      throw new Error("cannot get version, version pattern not found");
    }

    // Parse the version
    const version = versionLine.text.match(/^v(\d)\.(\d)\.(\d)$/)!;
    return {
      major: Number.parseInt(version[1]),
      minor: Number.parseInt(version[2]),
      patch: Number.parseInt(version[3]),
    }
  }

  // Get the publication date from the cover page
  private getPublicationDate(): string {
    // This must be run after chunkPages executes
    if (isEmpty(this.pages)) {
      throw new Error("cannot get publicationDate, pages is empty");
    }

    // Check if the document has a line containing the publication date
    const pubDateLine = this.pages[0].lines.find(l => /^\d+\s[a-zA-Z]+\s\d+$/.test(l.text));
    if (isNil(pubDateLine)) {
      throw new Error("cannot get publicationDate, publicationDate pattern not found");
    }

    // Capture the publication date
    const pubDate = pubDateLine.text.match(/^(\d+\s[a-zA-Z]+\s\d+)$/)!;
    return pubDate[1];
  }

  // Metadata methods are not parsed during page iteration.
  private metadata() {
    this.rules.version = this.getVersion();
    this.rules.publicationDate = this.getPublicationDate();
  }

  // Move the state's chapter to the next chapter
  private nextChapter(line: Line, pageNumber: string) {
    // Determine current chapter
    const i = chapters.findIndex(c => c === this.state.currentChapter);

    // Store the previous chapter in the appropriate rule field
    switch (i) {
      case 0:
        this.rules.gameConcepts = this.state.chapter;
        break;
      case 1:
        this.rules.objectProperties = this.state.chapter;
        break;
      case 2:
        this.rules.zones = this.state.chapter;
        break;
      case 3:
        this.rules.gameStructure = this.state.chapter;
        break;
      case 4:
        this.rules.layerCardsAbilities = this.state.chapter;
        break;
      case 5:
        this.rules.effects = this.state.chapter;
        break;
      case 6:
        this.rules.combat = this.state.chapter;
        break;
      case 7:
        this.rules.keywords = this.state.chapter;
        break;
      case 8:
        this.rules.additionalRules = this.state.chapter;
        return;
    }

    // Update the state's current chapter
    this.state.currentChapter = chapters[i + 1];

    // Get the id and content from the line
    const match = line.text.match(/^(\d+)\.\s+(.*)$/);

    // Initialize the new chapter
    this.state.chapter = {
      id: isNil(match) ? '' : match[1],
      pages: [pageNumber],
      content: isNil(match) ? '' : match[2],
      sections: [],
    };

    // Update the chapterLocation to root level.
    this.state.chapterLocation = 'chapter';
  }

  // Move the state's definition to a new definition
  private nextDefinition(line?: Line) {

    // We can't add a definition if the glossary hasn't been initialized
    if (isNil(this.rules.glossary)) {
      throw new Error('cannot add defintion, glossary has not been initialized');
    }

    if (!isNil(this.state.definition)) {
      // Definitions are created with a trailing comma that should be deleted
      this.state.definition.definition = this.state.definition.definition.trimEnd();
    }

    // The last time this is called, line should be null and we don't want to set it up for another definition
    if (!isNil(line)) {
      // Initialize a new definition
      const newDefinition: Definition = {
        subject: line.text,
        definition: '',
        references: [],
      }

      // Store the definition in state and glossary
      this.state.definition = newDefinition;
      this.rules.glossary!.definitions.push(newDefinition);
    }
  }
  
  // Move the state's contribution to a new contribution
  private nextContribution(line?: Line) {
    
    // We can't add a contribution if credits hasn't been initialized
    if (isNil(this.rules.glossary)) {
      throw new Error('cannot add defintion, credits has not been initialized');
    }
    
    // The last time this is called, line should be null and we don't want to set it up for another contribution
    if (!isNil(line)) {
      
      // Initialize a new contribution
      const newContribution: Contribution = {
        type: line.text,
        contributors: [],
      }

      // Store the definition in state and credits
      this.state.contribution = newContribution;
      this.rules.credits!.contributions.push(newContribution);
    }
  }

  // Parse the input and create the Rules object 
  public parse(): Rules {

    // skip the cover, start at idx 1.
    for (let pageIdx = 1; pageIdx < this.pages.length; pageIdx++) {
      const page = this.pages[pageIdx];
      if (/^Preface$/.test(page.lines[0].text)) {

        // Move state cover -> preface
        this.state.documentLocation = 'preface';
        this.rules.preface = {
          title: 'Preface',
          lines: page.lines.slice(1),
        };
      } else if (/^Table of Contents$/.test(page.lines[0].text)) {

        // Move state preface -> toc
        this.state.documentLocation = 'toc';
      } else if (this.state.documentLocation === 'toc' && lineStartsChapter(page.lines[0])) {

        // Move state toc -> chapters
        this.state.documentLocation = 'chapters';
      } else if (this.state.documentLocation === 'chapters' && /^Glossary$/.test(page.lines[0].text)) {

        // Move state chapters -> glossary
        this.nextChapter(page.lines[0], page.number);
        this.state.documentLocation = 'glossary';

        // Acknowledgments is spelled wrong in the doc, change spelling if it's updated.
      } else if (this.state.documentLocation === 'glossary' && /^Acknowledgments$/.test(page.lines[0].text)) {
        this.nextDefinition();

        // Move state glossary -> credits
        this.state.documentLocation = 'credits';
      }

      // Call additional parsers based on the current state
      switch (this.state.documentLocation) {
        case 'chapters':
          this.parseChapterPage(page);
          break;
        case 'glossary':
          this.parseGlossaryPage(page);
          break;
        case 'credits':
          this.parseCreditsPage(page);
          break;
        default:
          continue;
      }
    }

    // Validate the results and return a Rules object
    return this.validate();
  }

  // Parse a chapter page
  private parseChapterPage(page: Page) {
    let lines = page.lines;

    // Preprocessing
    if (lineStartsChapter(lines[0])) {
      // All chapter headers are the first line of a page
      // If the first line a chapter header, remove it from the list to prevent reprocessing
      this.nextChapter(lines.shift()!, page.number);
    } else {
      // Update current objects' page lists
      
      // Always update the current chapter
      this.state.chapter!.pages.push(page.number);

      if (this.state.chapterLocation === 'section') {
        // If the last rule finished but the chapter has not, only update the section
        this.state.section!.pages.push(page.number);
      }
      if (this.state.chapterLocation === 'rule') {
        // Page break was mid-rule, update the section and rule
        this.state.section!.pages.push(page.number);
        this.state.rule!.pages.push(page.number);
      }
      if (this.state.chapterLocation === 'subrule') {
        // Page break was mid-subrule, update all
        this.state.section!.pages.push(page.number);
        this.state.rule!.pages.push(page.number);
        this.state.subrule!.pages.push(page.number);
      }
    }

    // Iterate over the page's lines
    lines.forEach(line => {
      if (lineStartsSection(line)) {

        // Validate state, chapter must be initialized
        if (isNil(this.state.chapter)) {
          throw new Error('cannot start section, a chapter has not been initialized');
        }

        // Initialize and store the section with id and content from the line
        const match = line.text.match(/^(\d+\.\d+)\.\s+(.*)$/);
        this.state.section = {
          id: isNil(match) ? '' : match[1],
          pages: [page.number],
          content: isNil(match) ? '' : match[2],
          rules: [],
        }
        this.state.chapter.sections.push(this.state.section);

        // Update state's chapter location
        this.state.chapterLocation = 'section';
      } else if (lineStartsRule(line)) {

        // Validate state, section must be initialized
        if (isNil(this.state.section)) {
          throw new Error('cannot start rule, a section has not been initialized');
        }

        // Initialize and store the rule with id and content from the line
        const match = line.text.match(/^(\d\.\d+\.\d+)\.\s+(.*)$/);
        this.state.rule = {
          id: isNil(match) ? '' : match[1],
          pages: [page.number],
          content: [{ idx: line.idx, text: isNil(match) ? '' : match[2] }],
          children: [],
        }
        this.state.section.rules.push(this.state.rule);

        // Update state's chapter location
        this.state.chapterLocation = 'rule';
      } else if (lineStartsSubrule(line)) {

        // Validate state, rule must be initialized
        if (isNil(this.state.rule)) {
          throw new Error('cannot start subrule, a rule has not been initialized');
        }

        // Initialize and store the subrule with id and content from the line
        const match = line.text.match(/^(\d\.\d+\.\d+[a-z])\s(.*)$/);
        this.state.subrule = {
          id: isNil(match) ? '' : match[1],
          pages: [page.number],
          content: [{ idx: line.idx, text: isNil(match) ? '' : match[2] }],
        }

        // If this is the first child, initialize the rule's children array
        if (isNil(this.state.rule!.children)) {
          this.state.rule.children = [];
        }

        // Add the subrule to the rule
        this.state.rule.children.push(this.state.subrule);

        // Update state's chapter location
        this.state.chapterLocation = 'subrule';
      } else if (this.state.chapterLocation === 'rule') {

        // The rule has multiple lines, add this line to it
        (this.state.rule?.content as Line[]).push(line);
      } else if (this.state.chapterLocation === 'subrule') {

        // The subrule has multiple lines, add this line to it
        (this.state.subrule?.content as Line[]).push(line);
      }
    });
  }

  // Parse a glossary page
  private parseGlossaryPage(page: Page) {
    for (let line of page.lines) {
      if (line.text === 'Glossary') {
        // Ignore the first line, it just says "Glossary"
        continue;
      }

      if (lineStartsDefinition(line)) {

        // Initialize a new definition
        this.nextDefinition(line);
      } else {

        // Validate the state
        if (isNil(this.state.definition)) {
          throw new Error('cannot add text to definition, definition has not been instatniated');
        }

        // Add this line to the current definition, put a space at the end to seperate them
        // This can be improved by storing a list in the state and joining them with a ' ' at the end
        this.state.definition.definition += line.text + ' '
      }
    }
  }

  // Parse a credits page
  private parseCreditsPage(page: Page) {

    // The copyright is always at the bottom of the credits page, so it'll be handled in this method.
    const copyrightLines: string[] = [];
    let inCopyright = false;

    // Iterate over the page lines
    for (let line of page.lines) {
      // "Acknowledgments" word is misspelled in the original text
      if (line.text === 'Acknowledgments') {
        // Ignore the first line, it just says "Acknowledgments"
        continue;
      }

      // Check if we've made it into the copyright
      if (linestartsCopyright(line)) {
        inCopyright = true;
      }
      
      if (inCopyright) {
        // add the line to copyright
        copyrightLines.push(line.text);

        // Don't do the contribution steps
        continue;
      }

      if (lineStartsContribution(line)) {
        // Initialize a new contribution
        this.nextContribution(line);
      } else {
        
        // Validate the state
        if (isNil(this.state.contribution)) {
          throw new Error('cannot add text to contribution, contribution has not been instatniated');
        }

        // Add the line the the current contribution
        this.state.contribution!.contributors.push(line.text);
      }
    }

    // After iterating through the lines, add the copyright to the Rules object
    // Assumes the copyright will never be split across 2 pages.
    if (inCopyright) {
      this.rules.copyright = copyrightLines.join(' ');
    }
  }

  // Ensure each part of rules was created, then convert the Partial<Rules> to a Rules object
  private validate(): Rules {
    if (isNil(this.rules.version)) {
      throw new Error('version was not defined');
    }
    if (isNil(this.rules.publicationDate)) {
      throw new Error('publicationDate was not defined');
    }
    if (isNil(this.rules.preface)) {
      throw new Error('preface was not defined');
    }
    if (isNil(this.rules.gameConcepts)) {
      throw new Error('gameConcepts was not defined');
    }
    if (isNil(this.rules.objectProperties)) {
      throw new Error('objectProperties was not defined');
    }
    if (isNil(this.rules.zones)) {
      throw new Error('zones was not defined');
    }
    if (isNil(this.rules.gameStructure)) {
      throw new Error('gameStructure was not defined');
    }
    if (isNil(this.rules.layerCardsAbilities)) {
      throw new Error('layerCardsAbilities was not defined');
    }
    if (isNil(this.rules.effects)) {
      throw new Error('effects was not defined');
    }
    if (isNil(this.rules.combat)) {
      throw new Error('combat was not defined');
    }
    if (isNil(this.rules.keywords)) {
      throw new Error('keywords was not defined');
    }
    if (isNil(this.rules.additionalRules)) {
      throw new Error('additionalRules was not defined');
    }
    if (isNil(this.rules.glossary)) {
      throw new Error('glossary was not defined');
    }
    if (isNil(this.rules.credits)) {
      throw new Error('credits was not defined');
    }
    return this.rules as Rules;
  }
}

// The intended entrypoint for the parser
export function parseRules(text: string): Rules {
  const parser = new RuleParser(text);
  return parser.parse();
}