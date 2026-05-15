# Camden prototype kit

A small Express and Nunjucks prototype kit for Camden transactional services. It uses `lbcamden-frontend` for the Camden header, footer, button, CSS and static assets, with familiar prototype routes and session-backed data.

## For designers

Start with [DESIGNER-SETUP.md](DESIGNER-SETUP.md). It explains how to clone the repo with GitHub Desktop, open it in Codex, start the prototype on a Mac and stop it again.

Use [PROMPTS.md](PROMPTS.md) for copy-paste prompts that ask Codex to create or edit Camden service journeys using this kit's existing patterns.

Use [PUBLISHING.md](PUBLISHING.md) when a prototype is ready to publish to GitHub, deploy on Render and password protect.

## Run it

The easiest Mac option is to double-click:

```text
start.command
```

If macOS will not run the command files, set their permissions once:

```sh
chmod +x start.command update.command
```

For terminal use:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`.

If port `3000` is already in use, run it on `3010` instead:

```sh
npm run dev:3010
```

Open `http://localhost:3010`.

## Deployed prototype password

See [PUBLISHING.md](PUBLISHING.md) for GitHub publishing, Render deployment and deployed password instructions.

## Add a page

1. Create a Nunjucks view in `app/views`.
2. Add a GET route in `app/routes.js`.
3. For forms, add a POST route that validates input, writes to `req.session.data`, then redirects.

Views can read saved prototype data through the `data` object:

```njk
{{ data.postcode }}
```

## Camden frontend

The project imports `lbcamden-frontend` in `app/assets/sass/application.scss`, serves copied Camden assets from `/assets`, and exposes Camden component macros from `node_modules/lbcamden-frontend/lbcamden`.

Example:

```njk
{% from "components/button/macro.njk" import LBCamdenButton %}

{{ LBCamdenButton({
  text: "Continue",
  preventDoubleClick: true
}) }}
```

## Generating flows with Codex

Ask Codex to follow the existing sample flow:

> Add a Camden prototype journey for reporting a missed bin collection. Use pages for address lookup, collection type, contact details, check answers and confirmation. Store answers in `req.session.data`.

The important files for generated transactional journeys are:

- `app/routes.js`
- `app/views/layouts/main.njk`
- `app/views/macros/forms.njk`
- `app/views/<journey-name>/*.njk`
