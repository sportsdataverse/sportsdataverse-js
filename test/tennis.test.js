import { live } from "./helpers/live.mjs";
import should from 'should';
import { readFileSync } from 'node:fs';
import app, { configure, resetConfig } from '../dist/index.js';

// Offline: the one tennis method, driven by a real ESPN capture through a fake
// `site_v2` transport (provenance in test/fixtures/legacy/README.md).
const SCOREBOARD_ATP = JSON.parse(
    readFileSync(new URL('./fixtures/legacy/tennis_scoreboard_atp_20230620.json', import.meta.url), 'utf8')
);

describe('tennis.getScoreboard (offline, real capture)', () => {
    let calls;
    beforeEach(() => {
        calls = [];
        configure({
            transport: {
                site_v2: async (req) => {
                    calls.push(req);
                    return { status: 200, headers: {}, url: req.url, data: SCOREBOARD_ATP };
                },
            },
        });
    });
    afterEach(() => resetConfig());

    it('fetches the atp scoreboard for a date and returns the ESPN body as-is', async () => {
        const data = await app.tennis.getScoreboard({ year: 2023, month: 6, day: 20 });
        calls.length.should.equal(1);
        calls[0].url.should.equal('https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard');
        calls[0].query.should.eql({ dates: '20230620' });
        data.should.equal(SCOREBOARD_ATP);
        data.leagues.map((l) => l.abbreviation).should.eql(['ATP']);
        data.events.map((e) => e.name).should.eql(['Terra Wortmann Open', 'HSBC Championships']);
        const first = data.events[0].groupings[0].competitions[0];
        first.id.should.equal('134552');
        first.competitors.map((c) => c.athlete.displayName).should.eql(['Louis Wessels', 'Zhang Zhizhen']);
        first.status.type.name.should.equal('STATUS_FINAL');
    });

    it('league selects the path; no date means no `dates` param', async () => {
        await app.tennis.getScoreboard({ league: 'wta' });
        calls[0].url.should.equal('https://site.api.espn.com/apis/site/v2/sports/tennis/wta/scoreboard');
        calls[0].query.should.eql({});
    });
});

live('TNNS Scoreboard', () => {

    it('should populate scoreboard data for the current week and year', async () => {
        const data = await app.tennis.getScoreboard({});
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
    it('should populate scoreboard data for the current week and year and league', async () => {
        const data = await app.tennis.getScoreboard({ league: "wta" })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should populate scoreboard data for the given week and year', async () => {
        const data = await app.tennis.getScoreboard({
            year: 2021,
            month: 2,
            day: 15
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for scoreboard data for the current week and year', async () => {
        const data = await app.tennis.getScoreboard({})
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for scoreboard data for the given week and year', async () => {
        const data = await app.tennis.getScoreboard({
            year: 2021,
            month: 2,
            day: 15
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});