import should from 'should';
import {
  parse_odds_api_sports,
  parse_odds_api_sports_odds,
  parse_odds_api_sports_scores,
  parse_odds_api_sports_events,
  parse_odds_api_sports_participants,
  parse_odds_api_event_odds,
  parse_odds_api_event_markets,
  parse_odds_api_sports_odds_history,
  parse_odds_api_sports_events_history,
  parse_odds_api_event_odds_history,
} from '../../dist/parsers/odds_api.js';

// Offline parser tests for The Odds API flat-API family. Inline sample payloads
// (NO real API key, NO network) shaped like the the-odds-api.com responses the
// oddsapiR R package tidies. The odds / event-odds / history parsers unroll
// events -> bookmakers -> markets -> outcomes to ONE ROW PER OUTCOME.

// 1 event x 2 bookmakers x 1 market x 2 outcomes = 4 outcome rows.
const ODDS_PAYLOAD = [
  {
    id: 'evt1',
    sport_key: 'basketball_nba',
    sport_title: 'NBA',
    commence_time: '2024-01-01T00:00:00Z',
    home_team: 'Home Team',
    away_team: 'Away Team',
    bookmakers: [
      {
        key: 'draftkings',
        title: 'DraftKings',
        last_update: '2024-01-01T00:00:00Z',
        markets: [
          {
            key: 'spreads',
            last_update: '2024-01-01T00:00:00Z',
            outcomes: [
              { name: 'Home Team', price: -110, point: -3.5 },
              { name: 'Away Team', price: -110, point: 3.5 },
            ],
          },
        ],
      },
      {
        key: 'fanduel',
        title: 'FanDuel',
        last_update: '2024-01-01T00:01:00Z',
        markets: [
          {
            key: 'spreads',
            last_update: '2024-01-01T00:01:00Z',
            outcomes: [
              { name: 'Home Team', price: -105, point: -3.5 },
              { name: 'Away Team', price: -115, point: 3.5 },
            ],
          },
        ],
      },
    ],
  },
];

describe('odds_api: sports', () => {
  it('flattens the bare sports array (one row per sport)', () => {
    const rows = parse_odds_api_sports([
      { key: 'americanfootball_nfl', group: 'American Football', title: 'NFL', description: 'US Football', active: true, has_outrights: false },
      { key: 'basketball_nba', group: 'Basketball', title: 'NBA', description: 'US Basketball', active: true, has_outrights: false },
    ]);
    rows.length.should.equal(2);
    rows[0].key.should.equal('americanfootball_nfl');
    rows[0].has_outrights.should.equal(false);
  });

  it('returns [] for non-array / empty payloads', () => {
    parse_odds_api_sports(null).should.be.an.Array().and.have.length(0);
    parse_odds_api_sports({}).should.be.an.Array().and.have.length(0);
    parse_odds_api_sports([]).should.be.an.Array().and.have.length(0);
  });
});

describe('odds_api: sports_odds (unroll to one row per outcome)', () => {
  it('unrolls 1 event x 2 bookmakers x 1 market x 2 outcomes -> 4 rows', () => {
    const rows = parse_odds_api_sports_odds(ODDS_PAYLOAD);
    rows.length.should.equal(4);
  });

  it('emits the snake_cased outcome + bookmaker + market columns', () => {
    const rows = parse_odds_api_sports_odds(ODDS_PAYLOAD);
    const r = rows[0];
    r.should.have.properties([
      'id',
      'sport_key',
      'sport_title',
      'commence_time',
      'home_team',
      'away_team',
      'bookmaker_key',
      'bookmaker',
      'bookmaker_last_update',
      'market_key',
      'market_last_update',
      'outcomes_name',
      'outcomes_price',
      'outcomes_point',
    ]);
    r.bookmaker_key.should.equal('draftkings');
    r.bookmaker.should.equal('DraftKings');
    r.market_key.should.equal('spreads');
    r.outcomes_name.should.equal('Home Team');
    r.outcomes_price.should.equal(-110);
    r.outcomes_point.should.equal(-3.5);
    // the `bookmakers` nested array must NOT survive as a column
    should(r.bookmakers).be.undefined();
  });

  it('covers both bookmakers across the 4 rows', () => {
    const rows = parse_odds_api_sports_odds(ODDS_PAYLOAD);
    new Set(rows.map((r) => r.bookmaker_key)).should.deepEqual(new Set(['draftkings', 'fanduel']));
  });

  it('returns [] for an empty events array', () => {
    parse_odds_api_sports_odds([]).should.be.an.Array().and.have.length(0);
    parse_odds_api_sports_odds(null).should.be.an.Array().and.have.length(0);
  });
});

describe('odds_api: sports_scores', () => {
  it('flattens scores events (scores list cell stringified)', () => {
    const rows = parse_odds_api_sports_scores([
      {
        id: 'evt1',
        sport_key: 'basketball_nba',
        sport_title: 'NBA',
        commence_time: '2024-01-01T00:00:00Z',
        completed: true,
        home_team: 'Home',
        away_team: 'Away',
        scores: [
          { name: 'Home', score: '101' },
          { name: 'Away', score: '99' },
        ],
        last_update: '2024-01-01T03:00:00Z',
      },
    ]);
    rows.length.should.equal(1);
    rows[0].completed.should.equal(true);
    // arrays are stringified by `normalize` so rows stay rectangular
    (typeof rows[0].scores).should.equal('string');
  });
});

describe('odds_api: sports_events', () => {
  it('flattens events (one row per event)', () => {
    const rows = parse_odds_api_sports_events([
      { id: 'evt1', sport_key: 'basketball_nba', sport_title: 'NBA', commence_time: '2024-01-01T00:00:00Z', home_team: 'Home', away_team: 'Away' },
    ]);
    rows.length.should.equal(1);
    rows[0].id.should.equal('evt1');
  });
});

describe('odds_api: sports_participants', () => {
  it('flattens participants (one row per participant)', () => {
    const rows = parse_odds_api_sports_participants([
      { id: 'par_1', full_name: 'Los Angeles Lakers' },
      { id: 'par_2', full_name: 'Boston Celtics' },
    ]);
    rows.length.should.equal(2);
    rows[0].full_name.should.equal('Los Angeles Lakers');
  });
});

describe('odds_api: event_odds (single event -> one row per outcome)', () => {
  it('unrolls a single event object (props add outcomes_description)', () => {
    const rows = parse_odds_api_event_odds({
      id: 'evt1',
      sport_key: 'basketball_nba',
      sport_title: 'NBA',
      commence_time: '2024-01-01T00:00:00Z',
      home_team: 'Home',
      away_team: 'Away',
      bookmakers: [
        {
          key: 'draftkings',
          title: 'DraftKings',
          last_update: '2024-01-01T00:00:00Z',
          markets: [
            {
              key: 'player_points',
              last_update: '2024-01-01T00:00:00Z',
              outcomes: [
                { name: 'Over', description: 'LeBron James', price: -120, point: 25.5 },
                { name: 'Under', description: 'LeBron James', price: 100, point: 25.5 },
              ],
            },
          ],
        },
      ],
    });
    rows.length.should.equal(2);
    rows[0].market_key.should.equal('player_points');
    rows[0].outcomes_description.should.equal('LeBron James');
    rows[0].outcomes_name.should.equal('Over');
  });

  it('returns [] when the event is not an object', () => {
    parse_odds_api_event_odds(null).should.be.an.Array().and.have.length(0);
    parse_odds_api_event_odds([]).should.be.an.Array().and.have.length(0);
  });
});

describe('odds_api: event_markets (one row per bookmaker x market)', () => {
  it('lists available markets (no outcomes to unroll)', () => {
    const rows = parse_odds_api_event_markets({
      id: 'evt1',
      sport_key: 'basketball_nba',
      sport_title: 'NBA',
      commence_time: '2024-01-01T00:00:00Z',
      home_team: 'Home',
      away_team: 'Away',
      bookmakers: [
        {
          key: 'draftkings',
          title: 'DraftKings',
          markets: [
            { key: 'player_points', last_update: '2024-01-01T00:00:00Z' },
            { key: 'player_rebounds', last_update: '2024-01-01T00:00:00Z' },
          ],
        },
      ],
    });
    rows.length.should.equal(2);
    rows[0].bookmaker_key.should.equal('draftkings');
    new Set(rows.map((r) => r.market_key)).should.deepEqual(new Set(['player_points', 'player_rebounds']));
    should(rows[0].bookmakers).be.undefined();
  });
});

describe('odds_api: sports_odds_history (snapshot timestamps prefixed)', () => {
  it('wraps data[] events and prefixes timestamp columns onto each outcome', () => {
    const rows = parse_odds_api_sports_odds_history({
      timestamp: '2024-01-01T00:00:00Z',
      previous_timestamp: '2023-12-31T00:00:00Z',
      next_timestamp: '2024-01-02T00:00:00Z',
      data: ODDS_PAYLOAD,
    });
    rows.length.should.equal(4);
    rows[0].timestamp.should.equal('2024-01-01T00:00:00Z');
    rows[0].previous_timestamp.should.equal('2023-12-31T00:00:00Z');
    rows[0].next_timestamp.should.equal('2024-01-02T00:00:00Z');
    rows[0].outcomes_name.should.equal('Home Team');
  });

  it('returns [] for a malformed payload', () => {
    parse_odds_api_sports_odds_history(null).should.be.an.Array().and.have.length(0);
    parse_odds_api_sports_odds_history({ data: null }).should.be.an.Array().and.have.length(0);
  });
});

describe('odds_api: sports_events_history (one row per event, timestamps prefixed)', () => {
  it('prefixes the snapshot timestamps onto each event row', () => {
    const rows = parse_odds_api_sports_events_history({
      timestamp: '2024-01-01T00:00:00Z',
      previous_timestamp: '2023-12-31T00:00:00Z',
      next_timestamp: '2024-01-02T00:00:00Z',
      data: [
        { id: 'evt1', sport_key: 'basketball_nba', sport_title: 'NBA', commence_time: '2024-01-01T00:00:00Z', home_team: 'Home', away_team: 'Away' },
      ],
    });
    rows.length.should.equal(1);
    rows[0].timestamp.should.equal('2024-01-01T00:00:00Z');
    rows[0].id.should.equal('evt1');
  });
});

describe('odds_api: event_odds_history (single nested event -> one row per outcome)', () => {
  it('unrolls the data event object and prefixes snapshot timestamps', () => {
    const rows = parse_odds_api_event_odds_history({
      timestamp: '2024-01-01T00:00:00Z',
      previous_timestamp: '2023-12-31T00:00:00Z',
      next_timestamp: '2024-01-02T00:00:00Z',
      data: ODDS_PAYLOAD[0],
    });
    rows.length.should.equal(4);
    rows[0].timestamp.should.equal('2024-01-01T00:00:00Z');
    rows[0].bookmaker_key.should.equal('draftkings');
  });
});
