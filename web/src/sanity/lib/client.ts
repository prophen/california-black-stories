import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

if (!projectId || !dataset) {
  throw new Error(
    "Set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET in web/.env.local.",
  );
}

export const client = createClient({
  projectId,
  dataset,
  apiVersion: "2026-09-27",
  useCdn: true,
  perspective: "published",
});
