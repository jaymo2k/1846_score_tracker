const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fc = require('fast-check');
const {
  createSession, validateSessionCreation, COMPANIES
} = require('../game-logic');

// Arbitrary: list of 2+ non-empty player names
const validPlayerNames = fc.array(
  fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  { minLength: 2, maxLength: 6 }
);

const validBankPool = fc.integer({ min: 1, max: 100000 });

describe('Feature: board-game-score-tracker, Property 1: Session creation initializes all players to zero', () => {
  /**
   * Validates: Requirements 2.1
   * For any valid list of 2+ player names and any positive bank pool amount,
   * creating a new Game_Session SHALL result in every player having cash equal
   * to zero and no shareholdings in any company.
   */
  it('all players start with zero cash and no shareholdings', () => {
    fc.assert(
      fc.property(validPlayerNames, validBankPool, (names, bank) => {
        const session = createSession(names, bank);

        // Every player has zero cash
        for (const player of session.players) {
          assert.equal(player.cash, 0);
        }

        // No shareholdings exist
        assert.deepStrictEqual(session.shareholdings, {});

        // No companies incorporated
        assert.deepStrictEqual(session.companies, []);

        // Correct player count
        assert.equal(session.players.length, names.length);

        // Round 1, Stock Round phase
        assert.equal(session.round, 1);
        assert.equal(session.phase, 'Stock Round');

        // Bank pool matches input
        assert.equal(session.bankPool, bank);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: board-game-score-tracker, Property 2: Session creation rejects invalid inputs', () => {
  /**
   * Validates: Requirements 2.2, 2.3, 2.4
   */
  it('rejects fewer than 2 players', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 1 }),
        validBankPool,
        (names, bank) => {
          const errors = validateSessionCreation(names, bank);
          assert.notEqual(errors, null);
          assert.ok(errors.some(e => e.includes('2 players')));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects empty or whitespace-only player names', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', '   ', '\t', '\n'),
        (badName) => {
          const names = ['Alice', badName];
          const errors = validateSessionCreation(names, 1000);
          assert.notEqual(errors, null);
          assert.ok(errors.some(e => e.includes('Player name')));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects non-positive bank pool', () => {
    fc.assert(
      fc.property(
        validPlayerNames,
        fc.oneof(fc.integer({ max: 0 }), fc.constant(0)),
        (names, bank) => {
          const errors = validateSessionCreation(names, bank);
          assert.notEqual(errors, null);
          assert.ok(errors.some(e => e.includes('Bank pool')));
        }
      ),
      { numRuns: 100 }
    );
  });
});
