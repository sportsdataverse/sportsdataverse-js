import should from 'should';
import {
  parse_recruiting_list,
  parse_recruiting_paged_list,
  parse_recruiting_institution_rankings,
  parse_recruiting_ranking_feed,
} from '../../dist/parsers/recruiting.js';
import { parserFor, PARSERS } from '../../dist/parsers/_registry.js';
import { FLAT_WRAPPERS } from '../../dist/index.js';
import { FLAT_HOSTS } from '../../dist/core/client.js';

// Unit tests for the 247Sports Recruit Database parsers. Inline raw payloads (no
// network) -> tidy rows: row count + snake_cased flattened keys. Covers the
// generic list flattener plus every dedicated parser (envelope unrolling), and a
// flat-contract metadata block asserting the family registers correctly.

describe('parsers/recruiting: parse_recruiting_list (generic flattener)', () => {
  it('flattens a bare top-level JSON array (the common RDB shape)', () => {
    const raw = [
      { rankingKey: 1, firstName: 'John', lastName: 'Doe', currentStarRating: 5 },
      { rankingKey: 1, firstName: 'Jane', lastName: 'Roe', currentStarRating: 4 },
    ];
    const rows = parse_recruiting_list(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('ranking_key', 1); // rankingKey -> ranking_key
    rows[0].should.have.property('first_name', 'John');
    rows[0].should.have.property('current_star_rating', 5);
  });

  it('walks the LIST_KEYS envelope (list / rankings / items / …)', () => {
    parse_recruiting_list({ list: [{ teamId: 7, name: 'A' }] })[0].should.have.property(
      'team_id',
      7
    );
    parse_recruiting_list({ rankings: [{ key: 9 }] })[0].should.have.property('key', 9);
    parse_recruiting_list({ items: [{ id: 'x' }] })[0].should.have.property('id', 'x');
  });

  it('deep-flattens nested objects and stringifies array cells', () => {
    const rows = parse_recruiting_list([
      { key: 1, source: { name: 'HS', state: 'TX' }, tags: ['a', 'b'] },
    ]);
    rows[0].should.have.property('source_name', 'HS'); // nested -> source_name
    rows[0].should.have.property('source_state', 'TX');
    rows[0].should.have.property('tags', '["a","b"]'); // array -> JSON string
  });

  it('returns [] for empty / malformed payloads', () => {
    parse_recruiting_list([]).should.eql([]);
    parse_recruiting_list({}).should.eql([]);
    parse_recruiting_list({ list: [] }).should.eql([]);
    parse_recruiting_list(null).should.eql([]);
    parse_recruiting_list('nope').should.eql([]);
  });
});

describe('parsers/recruiting: parse_recruiting_paged_list', () => {
  it('flattens the `list[]` of a {pagination, list} paged envelope', () => {
    const raw = {
      pagination: { count: 2, currentPage: 1 },
      list: [
        { key: 11, name: 'photo-a', fileType: 'jpg' },
        { key: 12, name: 'photo-b', fileType: 'png' },
      ],
    };
    const rows = parse_recruiting_paged_list(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('key', 11);
    rows[0].should.have.property('file_type', 'jpg'); // fileType -> file_type
    // pagination context is NOT prefixed by the bare paged-list parser
    rows[0].should.not.have.property('pagination_count');
  });

  it('also accepts a bare array, and returns [] when no list', () => {
    parse_recruiting_paged_list([{ key: 1 }])[0].should.have.property('key', 1);
    parse_recruiting_paged_list({}).should.eql([]);
    parse_recruiting_paged_list(null).should.eql([]);
  });
});

describe('parsers/recruiting: parse_recruiting_institution_rankings', () => {
  it('unrolls list[] and prefixes the pagination_* context onto each row', () => {
    const raw = {
      pagination: { count: 25, currentPage: 1, pageCount: 3 },
      list: [
        { name: 'Alabama', rank: 1, compositeRating: 320.5, commits: 28 },
        { name: 'Georgia', rank: 2, compositeRating: 315.1, commits: 26 },
      ],
    };
    const rows = parse_recruiting_institution_rankings(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('name', 'Alabama');
    rows[0].should.have.property('rank', 1);
    rows[0].should.have.property('composite_rating', 320.5); // compositeRating -> snake
    rows[0].should.have.property('pagination_count', 25); // pagination prefixed
    rows[0].should.have.property('pagination_page_count', 3);
    rows[1].should.have.property('pagination_current_page', 1);
  });

  it('handles a bare array and empty payloads', () => {
    parse_recruiting_institution_rankings([{ name: 'X', rank: 5 }])[0].should.have.property(
      'rank',
      5
    );
    parse_recruiting_institution_rankings({ list: [] }).should.eql([]);
    parse_recruiting_institution_rankings({}).should.eql([]);
    parse_recruiting_institution_rankings(null).should.eql([]);
  });
});

describe('parsers/recruiting: parse_recruiting_ranking_feed', () => {
  it('flattens the `rankings[]` of a PlayerRankingFeedDto envelope', () => {
    const raw = {
      rankings: [
        {
          key: 100,
          firstName: 'Recruit',
          lastName: 'One',
          position: 'QB',
          rankingPosition: 1,
          targetInstitutionName: 'Ohio State',
        },
        { key: 101, firstName: 'Recruit', lastName: 'Two', position: 'WR', rankingPosition: 2 },
      ],
    };
    const rows = parse_recruiting_ranking_feed(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('key', 100);
    rows[0].should.have.property('ranking_position', 1); // rankingPosition -> snake
    rows[0].should.have.property('target_institution_name', 'Ohio State');
    rows[1].should.have.property('position', 'WR');
  });

  it('returns [] for an empty / missing rankings block', () => {
    parse_recruiting_ranking_feed({ rankings: [] }).should.eql([]);
    parse_recruiting_ranking_feed({}).should.eql([]);
    parse_recruiting_ranking_feed(null).should.eql([]);
  });
});

describe('parsers/recruiting: registry wiring', () => {
  it('registers all four recruiting parsers by name', () => {
    for (const name of [
      'parse_recruiting_list',
      'parse_recruiting_paged_list',
      'parse_recruiting_institution_rankings',
      'parse_recruiting_ranking_feed',
    ]) {
      (typeof PARSERS[name]).should.equal('function', `missing ${name}`);
      should(parserFor(name)).equal(PARSERS[name]);
    }
  });
});

describe('recruiting flat-API family metadata (flat-contract style)', () => {
  const family = () => FLAT_WRAPPERS.filter((w) => w.api === 'recruiting');

  it('registers the recruiting family (25 endpoints) on https://api.247sports.com', () => {
    const rows = family();
    rows.length.should.equal(25);
    FLAT_HOSTS.recruiting.should.equal('https://api.247sports.com');
    for (const w of rows) w.host.should.equal('https://api.247sports.com');
  });

  it('every recruiting wrapper names a registered parser, none auth', () => {
    for (const w of family()) {
      (typeof w.parser).should.equal('string', `parser missing on ${w.short}`);
      w.parser.should.startWith('parse_recruiting_');
      (typeof parserFor(w.parser)).should.equal('function', `parser ${w.parser} not registered`);
      should(w.auth).not.be.true(`unexpected auth flag on recruiting_${w.short}`);
    }
  });

  it('uses the generic list parser as the default for most endpoints', () => {
    const rows = family();
    const generic = rows.filter((w) => w.parser === 'parse_recruiting_list').length;
    // most endpoints use the generic flattener; the rest use dedicated parsers
    generic.should.be.above(rows.length / 2);
  });

  it('exposes the proof-slice rankings + recruits + teams endpoints', () => {
    const shorts = family().map((w) => w.short);
    shorts.should.containEql('rankings');
    shorts.should.containEql('recruits');
    shorts.should.containEql('teams');
    shorts.should.containEql('institution_rankings');
  });
});
