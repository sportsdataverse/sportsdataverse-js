import should from 'should';
import {
  parse_fox_bifrost_list,
  parse_fox_bifrost_scoreboard,
  parse_fox_bifrost_standings,
  parse_fox_bifrost_event,
  parse_fox_bifrost_team_roster,
  parse_fox_bifrost_search,
} from '../../dist/parsers/fox_bifrost.js';
import { parserFor, PARSERS } from '../../dist/parsers/_registry.js';
import { FLAT_WRAPPERS } from '../../dist/index.js';
import { FLAT_HOSTS } from '../../dist/core/client.js';

// Unit tests for the Fox Sports Bifrost parsers. Inline raw payloads (no
// network) -> tidy rows: row count + snake_cased flattened keys. Covers the
// generic module-shell flattener plus every dedicated parser (scoreboard /
// standings / event / team_roster / search), and a flat-contract metadata
// block asserting the family registers correctly on api.foxsports.com with no
// auth and a resolvable parser per endpoint.

describe('parsers/fox_bifrost: parse_fox_bifrost_list (generic flattener)', () => {
  it('flattens the first list-bearing key (groupList) into rows', () => {
    const raw = {
      title: 'Conferences',
      groupList: [
        { id: 'sec', title: 'SEC', selected: true },
        { id: 'b1g', title: 'Big Ten', selected: false },
      ],
    };
    const rows = parse_fox_bifrost_list(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('id', 'sec');
    rows[0].should.have.property('title', 'SEC');
  });

  it('deep-flattens + snake_cases a single module object into one row', () => {
    const rows = parse_fox_bifrost_list({ teamId: 5, navItems: [], logo: { webUrl: 'x' } });
    rows.length.should.equal(1);
    rows[0].should.have.property('team_id', 5);
    rows[0].should.have.property('logo_web_url', 'x'); // deep-flatten + snake
  });

  it('accepts a bare array payload', () => {
    parse_fox_bifrost_list([{ id: 9 }])[0].should.have.property('id', 9);
  });

  it('returns [] for empty / malformed payloads', () => {
    parse_fox_bifrost_list({}).should.eql([]);
    parse_fox_bifrost_list(null).should.eql([]);
    parse_fox_bifrost_list('nope').should.eql([]);
  });
});

describe('parsers/fox_bifrost: parse_fox_bifrost_scoreboard', () => {
  it('unrolls selectionGroupList[].selectionList[] into one row per game w/ group meta', () => {
    const raw = {
      selectionGroupList: [
        {
          title: 'Top 25',
          id: 'top25',
          selectionList: [
            { eventId: 100, homeTeam: { name: 'GA' }, awayTeam: { name: 'BAMA' } },
            { eventId: 101, homeTeam: { name: 'OSU' }, awayTeam: { name: 'MICH' } },
          ],
        },
      ],
    };
    const rows = parse_fox_bifrost_scoreboard(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('event_id', 100);
    rows[0].should.have.property('group_title', 'Top 25'); // group meta prefixed
    rows[0].should.have.property('home_team_name', 'GA'); // deep-flatten
  });

  it('falls back to a bare events[] list (top-events segment)', () => {
    const rows = parse_fox_bifrost_scoreboard({ events: [{ eventId: 7, status: 'live' }] });
    rows[0].should.have.property('event_id', 7);
  });

  it('returns [] for empty / malformed payloads', () => {
    parse_fox_bifrost_scoreboard({ selectionGroupList: [] }).should.eql([]);
    parse_fox_bifrost_scoreboard(null).should.eql([]);
  });
});

describe('parsers/fox_bifrost: parse_fox_bifrost_standings', () => {
  it('unrolls standingsSections[].standings[] into one row per entry w/ section meta', () => {
    const raw = {
      standingsSections: [
        {
          id: 'east',
          title: 'East',
          standings: [
            { team: 'NE', wins: 12, losses: 5 },
            { team: 'BUF', wins: 11, losses: 6 },
          ],
        },
      ],
    };
    const rows = parse_fox_bifrost_standings(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('wins', 12);
    rows[0].should.have.property('section_title', 'East');
  });

  it('falls back to the generic flattener for un-sectioned payloads', () => {
    const rows = parse_fox_bifrost_standings({ groupList: [{ id: 'x', title: 'X' }] });
    rows[0].should.have.property('id', 'x');
  });

  it('returns [] for empty / malformed payloads', () => {
    parse_fox_bifrost_standings({ standingsSections: [] }).should.eql([]);
    parse_fox_bifrost_standings(null).should.eql([]);
  });
});

describe('parsers/fox_bifrost: parse_fox_bifrost_event', () => {
  it('unrolls teamStatsComparison.items[] into one row per compared stat', () => {
    const raw = {
      template: 'matchup',
      teamStatsComparison: {
        items: [
          { title: 'Points / Game', leftItemDetails: { value: '31.2' }, rightItemDetails: { value: '28.7' } },
          { title: 'Total Yards', leftItemDetails: { value: '450' }, rightItemDetails: { value: '410' } },
        ],
      },
    };
    const rows = parse_fox_bifrost_event(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('title', 'Points / Game');
    rows[0].should.have.property('left_item_details_value', '31.2');
  });

  it('falls back to gameStats.items[] then to a single shell row', () => {
    parse_fox_bifrost_event({ gameStats: { items: [{ title: 'A' }] } })[0].should.have.property(
      'title',
      'A'
    );
    const shell = parse_fox_bifrost_event({ header: { eventId: 5 } });
    shell.length.should.equal(1);
    shell[0].should.have.property('header_event_id', 5);
  });

  it('returns [] for empty / malformed payloads', () => {
    parse_fox_bifrost_event({}).should.eql([]);
    parse_fox_bifrost_event(null).should.eql([]);
  });
});

describe('parsers/fox_bifrost: parse_fox_bifrost_team_roster', () => {
  it('unrolls groups[].rows[] into one row per player w/ group meta', () => {
    const raw = {
      title: 'Roster',
      groups: [
        {
          template: 'offense',
          headers: [],
          rows: [
            { name: 'QB One', number: 1 },
            { name: 'RB Two', number: 22 },
          ],
        },
      ],
    };
    const rows = parse_fox_bifrost_team_roster(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('name', 'QB One');
    rows[0].should.have.property('group_template', 'offense');
  });

  it('returns [] for empty / malformed payloads', () => {
    parse_fox_bifrost_team_roster({ groups: [] }).should.eql([]);
    parse_fox_bifrost_team_roster(null).should.eql([]);
  });
});

describe('parsers/fox_bifrost: parse_fox_bifrost_search', () => {
  it('unrolls results[] into one row per hit', () => {
    const raw = { results: [{ title: 'Teams', components: [] }, { title: 'Players', components: [] }] };
    const rows = parse_fox_bifrost_search(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('title', 'Teams');
  });

  it('returns [] for empty / malformed payloads', () => {
    parse_fox_bifrost_search({ results: [] }).should.eql([]);
    parse_fox_bifrost_search(null).should.eql([]);
  });
});

describe('parsers/fox_bifrost: registry wiring', () => {
  it('registers all six fox_bifrost parsers by name', () => {
    for (const name of [
      'parse_fox_bifrost_list',
      'parse_fox_bifrost_scoreboard',
      'parse_fox_bifrost_standings',
      'parse_fox_bifrost_event',
      'parse_fox_bifrost_team_roster',
      'parse_fox_bifrost_search',
    ]) {
      (typeof PARSERS[name]).should.equal('function', `missing ${name}`);
      should(parserFor(name)).equal(PARSERS[name]);
    }
  });
});

describe('fox_bifrost flat-API family metadata (flat-contract style)', () => {
  const family = () => FLAT_WRAPPERS.filter((w) => w.api === 'fox_bifrost');

  it('registers the fox_bifrost family (38 endpoints) on https://api.foxsports.com', () => {
    const rows = family();
    rows.length.should.equal(38);
    FLAT_HOSTS.fox_bifrost.should.equal('https://api.foxsports.com');
    for (const w of rows) w.host.should.equal('https://api.foxsports.com');
  });

  it('every fox_bifrost wrapper names a registered parser, none auth', () => {
    for (const w of family()) {
      (typeof w.parser).should.equal('string', `parser missing on ${w.short}`);
      w.parser.should.startWith('parse_fox_bifrost_');
      (typeof parserFor(w.parser)).should.equal('function', `parser ${w.parser} not registered`);
      should(w.auth).not.be.true(`unexpected auth flag on fox_bifrost_${w.short}`);
    }
  });

  it('every wrapper carries the public apikey query param with a default', () => {
    for (const w of family()) {
      const apikey = w.queryParams.find((q) => q.queryKey === 'apikey');
      should.exist(apikey, `apikey missing on ${w.short}`);
      // default present so calls work out of the box (no account/token needed)
      should.exist(apikey.default, `apikey default missing on ${w.short}`);
    }
  });

  it('carries the api-version query param (defaulted) on every endpoint the spec declares it', () => {
    // foxpolls is the lone spec endpoint with no api-version param; all others
    // pin it (default 1.1) so the bifrost data tier resolves out of the box.
    for (const w of family().filter((w) => w.short !== 'foxpolls')) {
      const apiVersion = w.queryParams.find((q) => q.queryKey === 'api-version');
      should.exist(apiVersion, `api-version missing on ${w.short}`);
      apiVersion.default.should.equal('1.1', `api-version default wrong on ${w.short}`);
    }
  });

  it('uses the generic list parser as the default for most endpoints', () => {
    const rows = family();
    const generic = rows.filter((w) => w.parser === 'parse_fox_bifrost_list').length;
    generic.should.be.above(rows.length / 2);
  });
});
