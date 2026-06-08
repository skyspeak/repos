/**
 * Vercel serverless entry — exports Express app without calling listen().
 */
import "./env";
import app from "./app";

export default app;
