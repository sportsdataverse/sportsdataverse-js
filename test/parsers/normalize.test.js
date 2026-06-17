import should from 'should';
import { normalize, snakeCase } from '../../dist/parsers/_normalize.js';

// Unit tests for the json_normalize-equivalent used by the flat-API parsers:
// deep flatten (`_` separator), snake_case keys, stringify array cells, empty -> [].

describe('parsers/_normalize: snakeCase', () => {
  it('lowercases and underscores camelCase / PascalCase / dotted keys', () => {
    snakeCase('gamePk').should.equal('game_pk');
    snakeCase('TeamName').should.equal('team_name');
    snakeCase('teams.home.team.id').should.equal('teams_home_team_id');
    snakeCase('already_snake').should.equal('already_snake');
    snakeCase('id').should.equal('id');
  });

  it('splits runs of capitals on the trailing word boundary', () => {
    snakeCase('homeRBI').should.equal('home_rbi');
    snakeCase('ERAValue').should.equal('era_value');
  });
});

describe('parsers/_normalize: normalize', () => {
  it('flattens a nested object with a `_` separator', () => {
    const rows = normalize([{ a: { b: 1 } }]);
    rows.length.should.equal(1);
    rows[0].should.have.property('a_b', 1);
    rows[0].should.not.have.property('a');
  });

  it('snake_cases the flattened keys', () => {
    const rows = normalize([{ team: { teamName: 'NYY', teamId: 147 } }]);
    rows[0].should.have.property('team_team_name', 'NYY');
    rows[0].should.have.property('team_team_id', 147);
  });

  it('stringifies array-valued cells (JSON.stringify) so rows stay rectangular', () => {
    const rows = normalize([{ id: 1, tags: ['a', 'b'] }]);
    rows[0].tags.should.equal('["a","b"]');
    (typeof rows[0].tags).should.equal('string');
  });

  it('flattens nested arrays-of-scalars only at the leaf (object nesting still expands)', () => {
    const rows = normalize([{ outer: { inner: [1, 2, 3] } }]);
    rows[0].should.have.property('outer_inner', '[1,2,3]');
  });

  it('returns [] for non-array, null, or empty input', () => {
    normalize([]).should.eql([]);
    normalize(null).should.eql([]);
    normalize(undefined).should.eql([]);
    normalize({ not: 'an array' }).should.eql([]);
  });

  it('handles multiple rows and preserves scalar leaves', () => {
    const rows = normalize([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ]);
    rows.length.should.equal(2);
    rows[1].should.eql({ id: 2, name: 'b' });
  });
});
