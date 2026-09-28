import { neon } from "@neondatabase/serverless";

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

// Durable log of every question asked. Fire-and-forget safe: failures are
// logged to the console and never break the ask request.
export async function logQuestion(question: string) {
  if (!sql) {
    console.warn("[ask] DATABASE_URL not set; skipping question log");
    return;
  }
  try {
    await sql`insert into question_logs (question) values (${question})`;
  } catch (err) {
    console.error("[ask] Failed to log question:", err);
  }
}
