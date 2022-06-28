import { readFileSync } from "fs"
import { parseRules } from "../src/parser";
import { Line } from "../src/types";

describe('parser', () => {
  let testrules: string;

  beforeAll(() => {
    testrules = readFileSync('./test/testRules.txt').toString();
  })

  it('fails if there are no pages', () => {
    expect(() => parseRules('no pages!')).toThrowError('cannot get version, pages is empty');
  });

  it('parses successfully', () => {
    expect(() => parseRules(testrules)).not.toThrowError();
  });

  it('parses version', () => {
    const result = parseRules(testrules);

    expect(result.version).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
    });
  });

  it('parses preface', () => {
    const result = parseRules(testrules);

    expect(result.preface.title).toEqual('Preface');
    expect(result.preface.lines).toHaveLength(2);
    expect(result.preface.lines[0]).toEqual({ idx: 1, text: 'this is a preface' });
    expect(result.preface.lines[1]).toEqual({ idx: 2, text: 'it has 2 lines' });
  });

  it('parses single-page chapters', () => {
    const result = parseRules(testrules);

    expect(result.gameConcepts.id).toEqual('1');
    expect(result.gameConcepts.content).toEqual('Game Concepts');
    expect(result.gameConcepts.pages).toEqual(['1']);

    expect(result.zones.id).toEqual('3');
    expect(result.zones.content).toEqual('Zones');
    expect(result.zones.pages).toEqual(['8']);

    expect(result.gameStructure.id).toEqual('4');
    expect(result.gameStructure.content).toEqual('Game Structure');
    expect(result.gameStructure.pages).toEqual(['9']);

    expect(result.layerCardsAbilities.id).toEqual('5');
    expect(result.layerCardsAbilities.content).toEqual('Layers, Cards, & Abilities');
    expect(result.layerCardsAbilities.pages).toEqual(['10']);

    expect(result.effects.id).toEqual('6');
    expect(result.effects.content).toEqual('Effects');
    expect(result.effects.pages).toEqual(['11']);

    expect(result.combat.id).toEqual('7');
    expect(result.combat.content).toEqual('Combat');
    expect(result.combat.pages).toEqual(['12']);

    expect(result.keywords.id).toEqual('8');
    expect(result.keywords.content).toEqual('Keywords');
    expect(result.keywords.pages).toEqual(['13']);

    expect(result.additionalRules.id).toEqual('9');
    expect(result.additionalRules.content).toEqual('AdditionalRules');
    expect(result.additionalRules.pages).toEqual(['14']);
  });

  it('parses multi-page chapters', () => {
    const result = parseRules(testrules);

    expect(result.objectProperties.id).toEqual('2');
    expect(result.objectProperties.content).toEqual('Object Properties');
    expect(result.objectProperties.pages).toEqual(['2', '3', '4', '5', '6', '7']);
  });

  it('parses single-page sections', () => {
    const result = parseRules(testrules);

    const sections = result.gameConcepts.sections
    expect(sections).toHaveLength(2);
    expect(sections[0].id).toEqual('1.0');
    expect(sections[0].pages).toEqual(['1']);
    expect(sections[0].content).toEqual('First Section');
    expect(sections[1].id).toEqual('1.1');
    expect(sections[1].pages).toEqual(['1']);
    expect(sections[1].content).toEqual('Second Section');
  });

  it('parses multi-page sections', () => {
    const result = parseRules(testrules);

    const sections = result.objectProperties.sections
    expect(sections).toHaveLength(1);
    expect(sections[0].id).toEqual('2.0');
    expect(sections[0].pages).toEqual(['3', '4', '5', '6', '7']);
    expect(sections[0].content).toEqual('Next Page Section');
  });

  it('parses single-page rules', () => {
    const result = parseRules(testrules);

    let rules = result.gameConcepts.sections[0].rules
    expect(rules).toHaveLength(1);
    expect(rules[0].id).toEqual('1.0.1');
    expect(rules[0].pages).toEqual(['1']);
    let content = rules[0].content as Line[];
    expect(content).toHaveLength(1);
    expect(content[0].idx).toEqual(2);
    expect(content[0].text).toEqual('The rules in this document apply to any game of Flesh and Blood.');

    rules = result.gameConcepts.sections[1].rules
    expect(rules).toHaveLength(2);
    expect(rules[0].id).toEqual('1.1.1');
    expect(rules[0].pages).toEqual(['1']);
    expect(rules[1].id).toEqual('1.1.2');
    expect(rules[1].pages).toEqual(['1']);
    content = rules[0].content as Line[];
    expect(content).toHaveLength(1);
    expect(content[0].idx).toEqual(5);
    expect(content[0].text).toEqual('This section has two rules.');
    content = rules[1].content as Line[];
    expect(content).toHaveLength(1);
    expect(content[0].idx).toEqual(6);
    expect(content[0].text).toEqual('This is the second rule of this section.');
  });

  it('parses multi-page rules', () => {
    const result = parseRules(testrules);

    let rules = result.objectProperties.sections[0].rules
    expect(rules).toHaveLength(1);
    expect(rules[0].id).toEqual('2.0.1');
    expect(rules[0].pages).toEqual(['4', '5', '6', '7']);
    let content = rules[0].content as Line[];
    expect(content).toHaveLength(2);
    expect(content[0].idx).toEqual(0);
    expect(content[0].text).toEqual('This is a next page rule');
    expect(content[1].idx).toEqual(0);
    expect(content[1].text).toEqual('and it continues on the next page');
  });

  it('parses single-page subrules', () => {
    const result = parseRules(testrules);

    let subrules = result.gameConcepts.sections[0].rules[0].children!;
    expect(subrules).toHaveLength(1);
    expect(subrules[0].id).toEqual('1.0.1a');
    expect(subrules[0].pages).toEqual(['1']);
    let content = subrules[0].content as Line[];
    expect(content).toHaveLength(1);
    expect(content[0].idx).toEqual(3);
    expect(content[0].text).toEqual('This is the first subrule');

    subrules = result.gameConcepts.sections[1].rules[1].children!;
    expect(subrules).toHaveLength(2);
    expect(subrules[0].id).toEqual('1.1.2a');
    expect(subrules[0].pages).toEqual(['1']);
    expect(subrules[1].id).toEqual('1.1.2b');
    expect(subrules[1].pages).toEqual(['1']);
    content = subrules[0].content as Line[];
    expect(content).toHaveLength(1);
    expect(content[0].idx).toEqual(7);
    expect(content[0].text).toEqual('This is a child rule.');
    content = subrules[1].content as Line[];
    expect(content).toHaveLength(1);
    expect(content[0].idx).toEqual(8);
    expect(content[0].text).toEqual('This is the second child rule.');
  });

  it('parses multi-page subrules', () => {
    const result = parseRules(testrules);

    let subrules = result.objectProperties.sections[0].rules[0].children!;
    expect(subrules).toHaveLength(1);
    expect(subrules[0].id).toEqual('2.0.1a');
    expect(subrules[0].pages).toEqual(['6', '7']);
    let content = subrules[0].content as Line[];
    expect(content).toHaveLength(2);
    expect(content[0].idx).toEqual(0);
    expect(content[0].text).toEqual('This is a next page child rule');
    expect(content[1].idx).toEqual(0);
    expect(content[1].text).toEqual('and it continues on the next page as well');
  });

  it('parses glossary', () => {
    const result = parseRules(testrules);

    expect(result.glossary.definitions).toHaveLength(2);
    expect(result.glossary.definitions[0].subject).toEqual('Chapter');
    let def = 'One of the main divisions of a relatively lengthy piece of writing, such as a book, ' +
      'that is usually numbered or titled.'
    expect(result.glossary.definitions[0].definition).toEqual(def);
    expect(result.glossary.definitions[1].subject).toEqual('Rule');
    def = 'An authoritative, prescribed direction for conduct, especially one of the regulations governing procedure ' +
      'in a legislative body or a regulation observed by the players in a game, sport, or contest.'
    expect(result.glossary.definitions[1].definition).toEqual(def);
  });

  it('parses credits', () => {
    const result = parseRules(testrules);

    expect(result.credits.contributions).toHaveLength(3);
    expect(result.credits.contributions[0].type).toEqual('Flesh and Blood Creator');
    expect(result.credits.contributions[0].contributors).toEqual(['James White']);
    expect(result.credits.contributions[1].type).toEqual('Rules and Policy Manager');
    expect(result.credits.contributions[1].contributors).toEqual(['Joshua James Scott']);
    expect(result.credits.contributions[2].type).toEqual('Development Team');
    expect(result.credits.contributions[2].contributors).toHaveLength(2);
    expect(result.credits.contributions[2].contributors[0]).toEqual('Jason Chung');
    expect(result.credits.contributions[2].contributors[1]).toEqual('Sasha Markovic');

    const copyright = '© 2022 Nobody. No Rights Reserved. 123 Address, Place, Place 12345, Place. ' +
      'Some info about the terms of the copyright'
    expect(result.copyright).toEqual(copyright);
  });
});