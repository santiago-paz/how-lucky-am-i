// Run with: npm test
// The wizard's state: when an area counts, when the live panel may show a place, and when the country is only a guess.

import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../assets/js/util.js');
await import('../assets/js/data/world.js');
await import('../assets/js/data/passports.js');
await import('../assets/js/model.js');
await import('../assets/js/state.js');

const S = globalThis.HLIA.state;
// the browser's language list, as the page reads it to guess a country
const browser = (...languages) => Object.defineProperty(globalThis, 'navigator', { value: { languages, language: languages[0] || '' }, configurable: true });
const fresh = (over = {}) => { S.reset(); Object.assign(S.a, over); };

test('a country and a passport count two areas, and an income adds a third', () => {
  fresh({ residence: 'ARG', passports: ['ARG'] });
  assert.deepEqual(S.ready(), ['mobility', 'stability']);
  S.a.income.amount = 1500000;
  assert.deepEqual(S.ready(), ['mobility', 'stability', 'income']);
});

test('a shared household counts as income by its total', () => {
  fresh({ residence: 'DEU', passports: ['DEU'] });
  S.a.household = { shared: true, total: 3000, adults: 2, children: 1 };
  assert.ok(S.ready().includes('income'));
  S.a.household.shared = false; // the total stays in the form but no longer counts
  assert.ok(!S.ready().includes('income'));
});

test('the place waits for income, or for the money step to be passed', () => {
  fresh({ residence: 'ARG', passports: ['ARG'] });
  assert.equal(S.placed(), false);
  S.a.income.amount = 900000;
  assert.equal(S.placed(), true);
  fresh({ residence: 'ARG', passports: ['ARG'] });
  S.maxStep = 3; // no income of my own: nothing to wait for once step 2 is done
  assert.equal(S.placed(), true);
});

test('the country is a guess only until the visitor has looked at it', () => {
  browser('es-AR');
  assert.equal(S.guessCountry(), 'ARG');
  fresh({ residence: 'ARG', passports: ['ARG'] });
  assert.equal(S.guessing(), true);
  S.passportsTouched = true; // they edited the passports, so they are reading step 1
  assert.equal(S.guessing(), false);
  fresh({ residence: 'ARG', passports: ['ARG'] });
  S.maxStep = 2; // they passed step 1
  assert.equal(S.guessing(), false);
  fresh({ residence: 'BRA', passports: ['BRA'] }); // they chose another country
  assert.equal(S.guessing(), false);
});

test('picking the country from the list ends the guess, even when it is the same country', () => {
  browser('es-AR');
  fresh({ residence: 'ARG', passports: ['ARG'] });
  assert.equal(S.guessing(), true);
  S.residenceTouched = true; // the visitor chose Argentina from the list
  assert.equal(S.guessing(), false);
  fresh({ residence: 'ARG', passports: ['ARG'] }); // a new visit starts with the guess again
  assert.equal(S.residenceTouched, false);
  assert.equal(S.guessing(), true);
});

test('without a guess from the browser nothing is guessed', () => {
  browser('en');
  assert.equal(S.guessCountry(), null);
  fresh({ residence: 'ARG', passports: ['ARG'] });
  assert.equal(S.guessing(), false);
});
