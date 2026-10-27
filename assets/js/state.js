/* The person's answers, kept in memory and in sessionStorage (cleared when the tab closes).
   Nothing is ever sent anywhere. */
(function (global) {
  'use strict';
  const HLIA = global.HLIA;
  const model = HLIA.model;
  const KEY = 'hlia-session-v1';

  const blank = () => ({
    residence: null, sameBirth: true, birth: null, passports: [], status: 'citizen', birthYear: null,
    workType: null,
    income: { amount: null, currency: 'LOCAL', period: 'month' },
    household: { shared: false, total: null, adults: 2, children: 0 },
    tenure: null, savings: null, netWorth: { bracket: null, skip: false },
    basics: { water: false, toilet: false, power: false, cooking: false, internet: false, food: false },
    education: null, health: null, travel: null, support: null, stateHelp: null, start: null,
  });

  const S = {
    a: blank(),
    step: 1,
    maxStep: 1,
    view: 'intro', // intro | wizard | results
    basicsTouched: false,
    passportsTouched: false,

    reset() { Object.assign(this, { a: blank(), step: 1, maxStep: 1, view: 'intro', basicsTouched: false, passportsTouched: false }); this.save(); },
    save() {
      try {
        sessionStorage.setItem(KEY, JSON.stringify({ a: this.a, step: this.step, maxStep: this.maxStep, view: this.view, basicsTouched: this.basicsTouched, passportsTouched: this.passportsTouched }));
      } catch (e) { /* storage can be blocked */ }
    },
    load() {
      try {
        const raw = sessionStorage.getItem(KEY);
        if (!raw) return false;
        const d = JSON.parse(raw);
        this.a = Object.assign(blank(), d.a);
        this.step = d.step || 1; this.maxStep = d.maxStep || 1; this.view = d.view || 'intro';
        this.basicsTouched = !!d.basicsTouched; this.passportsTouched = !!d.passportsTouched;
        // a saved country that no longer exists would break the model
        if (this.a.residence && !model.byId[this.a.residence]) this.a.residence = null;
        return true;
      } catch (e) { return false; }
    },
    // A first guess for the country, from the browser's language setting (for example es-AR).
    guessCountry() {
      const langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
      for (const l of langs) {
        const m = /-([A-Za-z]{2})\b/.exec(l);
        if (!m) continue;
        const c = model.countries.find((x) => x.iso2 === m[1].toUpperCase());
        if (c) return c.id;
      }
      return null;
    },
    birthId() { return this.a.sameBirth ? this.a.residence : this.a.birth || this.a.residence; },

    // Which of the eight areas have enough answers to be counted.
    ready() {
      const a = this.a, out = [];
      if (a.residence && a.passports.length) out.push('mobility', 'stability');
      if (a.residence && a.income.amount != null && a.income.amount > 0) out.push('income');
      if (a.tenure && a.savings) out.push('wealth');
      if (this.basicsTouched) out.push('basics');
      if (a.education) out.push('education');
      if (a.health) out.push('health');
      if (a.workType && a.support != null && a.stateHelp && a.savings) out.push('safety');
      return out;
    },
    // Answers with neutral stand-ins for anything not answered yet (those areas are not counted).
    forModel() {
      const a = JSON.parse(JSON.stringify(this.a));
      a.birth = this.birthId();
      a.income.amount = a.income.amount || 0;
      a.workType = a.workType || 'informal';
      a.tenure = a.tenure || 'rent';
      a.savings = a.savings || 'none';
      a.education = a.education || 'secondary';
      a.health = a.health || 'basic';
      a.travel = a.travel === true;
      a.support = a.support === true;
      a.stateHelp = a.stateHelp || 'partly';
      return a;
    },
    compute(only) {
      if (!this.a.residence) return null;
      return model.compute(this.forModel(), only ? { only } : {});
    },
  };

  HLIA.state = S;
})(window);
