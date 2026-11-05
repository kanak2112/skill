/**
 * The skill catalogue as Knack sells it: only skills that live in movement. The main prototype's
 * cognitive skills (mental maths, languages, navigation, cross-examination) are left out, because a
 * patch that guides your muscles can't stream knowledge. build.mjs swaps this in for
 * src/data/catalog.js inside the vault bundle.
 */
import * as all from '../src/data/catalog.js';

export * from '../src/data/catalog.js';
export const DOMAINS = all.DOMAINS.filter((d) => d.id !== 'cognitive');
export const MODELS = all.MODELS.filter((m) => m.domain !== 'cognitive');
export const MODELS_BY_DOMAIN = Object.fromEntries(DOMAINS.map((d) => [d.id, MODELS.filter((m) => m.domain === d.id)]));
export const DEFAULT_MODEL = MODELS[0];
export const SUGGESTIONS = ['Cooking', 'Surgical prep', 'Instrument repair', 'Pottery', 'Climbing', 'Running'];
