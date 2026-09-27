# Sanity connection

The Next.js app in `web/` connects to California Black Stories (`bq2hoxdt`), dataset `production`. Sanity Studio remains a standalone app in `studio/`.

## Local development

Run `npm run dev` in `studio/` (http://localhost:3333) and in `web/` (http://localhost:3000), in separate terminals. Install dependencies with `npm install` in each directory after cloning.

The web app reads its project and dataset from `web/.env.local`. Copy `web/.env.example` to that file on another machine. Set those same public variables in your frontend hosting environment before building.

## Adding content later

No custom schemas or content have been added. Define and register content types in `studio/schemaTypes/index.ts`, then run these commands from `studio/`:

```sh
npx sanity schemas deploy
npm run typegen
```

Define named GROQ queries with `defineQuery` from `next-sanity` in `web/src/`. TypeGen scans those files and writes `web/sanity.types.ts`; run it again after schema or query changes. Automatic generation is also enabled for Studio development/builds. Commit generated types with your app changes.

In Server Components, import `sanityFetch` from `@/sanity/lib/live` and call `await sanityFetch({ query: YOUR_QUERY })`; the result's `data` field contains the query result. The root layout already includes `SanityLive` for published-content updates. The starter home page is unchanged because there are no content types to query yet.

Use `client` from `@/sanity/lib/client` for direct published-content queries, `urlFor` from `@/sanity/lib/image` for image URLs, and `PortableText` from `next-sanity` for rich text. Next Image allows images from this project's production dataset.

This setup targets public, published content and needs no API token. Draft previews, Presentation, and Visual Editing can be added later with a suitable read-only token and authenticated draft-mode routes. Never put a secret token in a `NEXT_PUBLIC_` variable. The local web origin (`http://localhost:3000`) is registered for CORS.

Before deploying the frontend, add its production origin using `npx sanity cors add https://your-domain.example` from `studio/`. Configure credentialed origins only if enabling authenticated previews.
