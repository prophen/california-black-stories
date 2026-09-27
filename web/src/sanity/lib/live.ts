import "server-only";

import { defineLive } from "next-sanity/live";
import { client } from "./client";

// Public, published content only. Add draft preview when the content model is ready.
export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: false,
  browserToken: false,
});
