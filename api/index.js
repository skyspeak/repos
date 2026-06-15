/**
 * Vercel serverless entry (committed). Heavy bundle is generated at build time
 * as api/bundle.js — see artifacts/api-server/vercel-build.mjs.
 */
const mod = require("./bundle.js");
const app = mod.default ?? mod;
module.exports = app;
