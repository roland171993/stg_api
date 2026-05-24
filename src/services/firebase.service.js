/**
 * firebase.service.js
 *
 * Wraps firebase-admin initialisation and token verification.
 *
 * Design goals:
 *  - Lazy init: Firebase is only loaded when actually needed (OAuth routes).
 *  - Mockable : verifyIdToken is exported as a standalone function so unit tests
 *               can jest.mock() this module without touching firebase-admin.
 *  - Safe     : double-init is silently ignored.
 */

const admin  = require('firebase-admin');
const logger = require('../config/logger');

const TAG = 'FirebaseService';
let   _initialized = false;

/* ------------------------------------------------------------------ */
/* Internal                                                             */
/* ------------------------------------------------------------------ */

function _ensureInitialized() {
  if (_initialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      'FIREBASE_PROJECT_ID env var is missing. ' +
      'OAuth sign-in requires a Firebase project.'
    );
  }

  // Two supported credential strategies:
  //  1. GOOGLE_APPLICATION_CREDENTIALS env var (path to service-account.json)
  //  2. FIREBASE_SERVICE_ACCOUNT env var (base-64 encoded service-account JSON)
  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8')
    );
    credential = admin.credential.cert(serviceAccount);
  } else {
    // Falls back to GOOGLE_APPLICATION_CREDENTIALS or GCP metadata server
    credential = admin.credential.applicationDefault();
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({ credential, projectId });
  }

  _initialized = true;
  logger.info(`[${new Date().toISOString()}] [${TAG}] Firebase Admin initialised (project=${projectId})`);
}

/* ------------------------------------------------------------------ */
/* Public API                                                           */
/* ------------------------------------------------------------------ */

/**
 * Verifies a Firebase ID token (issued after Google / Apple sign-in).
 *
 * @param  {string} idToken  — the raw Firebase ID token from the Android app
 * @returns {Promise<admin.auth.DecodedIdToken>}
 * @throws  firebase-admin auth errors (auth/id-token-expired, etc.)
 */
async function verifyIdToken(idToken) {
  _ensureInitialized();
  return admin.auth().verifyIdToken(idToken, /* checkRevoked= */ true);
}

/**
 * Exposed for testing — lets tests override _initialized without
 * touching module internals.
 */
function _resetForTests() {
  _initialized = false;
}

module.exports = { verifyIdToken, _resetForTests };
