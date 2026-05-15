# Codex prompt templates

Copy one of these prompts into Codex while this repository is open. Replace the bracketed text with your service details.

All prompts should keep to the Camden frontend library and Storybook patterns: https://main--645a25e00de84a612195c9a5.chromatic.com/. Ask Codex to reuse existing Camden/GOV.UK classes, macros and components rather than inventing new styles.

## Create a new multi-page service journey

```text
Create a new Camden prototype journey for [Record a goose sighting] service.

Before changing files, inspect the existing Express/Nunjucks patterns in this repo, especially app/routes.js, app/views/permit, app/views/complaints, app/views/layouts/main.njk and app/views/macros/forms.njk. 

Use the existing architecture: routes in app/routes.js, pages in app/views/[journey-name], Camden frontend macros where appropriate, and session-backed answers in req.session.data.

Follow the Camden frontend library styles and Storybook patterns at https://main--645a25e00de84a612195c9a5.chromatic.com/. Do not invent new visual styles, custom components, spacing systems or button/form patterns unless the library does not provide a suitable pattern.

Create these pages:
- Start page
- Do you like geese? Yes or No
- What type of goose did you see? Text input, single line
- When did you see the goose? Date input with hint "For example, 16 4 2017"
- Check your answers page
- Confirmation page with random reference number

All field require input so add validation for required form fields.

Add a button on the homepage for this new service, above the Examples header. 

Preserve existing code style and keep the implementation lightweight. After changing files, run a local check that the pages return successfully and tell me the local URL to open.
```

## Turn a sketch or wireframe into pages

```text
Use the attached sketch or wireframe to create Camden prototype pages.

First, describe the journey structure you see. Then implement it using the existing repo patterns: Express routes in app/routes.js, Nunjucks views under app/views/[journey-name], Camden/GOV.UK form classes and macros, and answers stored in req.session.data.

Keep the pages accessible and consistent with Camden service patterns and the frontend library Storybook at https://main--645a25e00de84a612195c9a5.chromatic.com/. Do not add new frameworks, tooling, custom visual styles or components when an existing Camden/GOV.UK pattern fits. Add sensible validation, back links, a check answers page and a confirmation page.
```

## Add validation and session-backed answers

```text
Add validation and saved answers to the existing [journey name] journey.

Inspect the current routes and views first. For each form page, validate required fields in the POST route, show an error summary, keep the user on the same page when there are errors, and save valid answers into req.session.data.

Pre-populate form fields from the data object in Nunjucks so answers remain visible when users go back or change an answer. Preserve the current page order, Camden styling and existing copy unless a small copy change is needed for clarity.

Use Camden/GOV.UK validation and error patterns from the existing templates and the Storybook at https://main--645a25e00de84a612195c9a5.chromatic.com/. Do not create custom error styling.
```

## Create a check answers page

```text
Create a check answers page for the [journey name] journey.

Inspect the existing journey pages and route names. Add a Nunjucks check answers page using a GOV.UK summary list. Show all saved answers from req.session.data, include Change links back to the right pages, and add a POST route that continues to the confirmation page.

Keep the existing architecture and Camden styling. Follow the summary list and button patterns from the Camden frontend library and Storybook at https://main--645a25e00de84a612195c9a5.chromatic.com/. Run a local check that the check answers page and confirmation page load.
```

## Restyle or revise an existing flow

```text
Revise the existing [journey name] flow without changing the overall journey pattern.

Keep the same route structure, page order and saved data keys unless there is a clear reason to change them. Improve the page copy, labels, hints and layout to make the journey clearer for Camden residents.

Use existing Camden/GOV.UK classes, macros and Storybook patterns from https://main--645a25e00de84a612195c9a5.chromatic.com/. Do not introduce new frontend libraries, custom components, custom button styles or layout styles that deviate from the frontend library. After editing, summarize what changed and list any pages I should review in the browser.
```

## Add a conditional branch

```text
Add a conditional branch to the [journey name] journey.

If the user answers [answer or condition], send them to [branch page]. Otherwise continue to [normal next page].

Store the answer in req.session.data, preserve back links, add validation, and make sure the check answers page shows the answer with a Change link. Keep the implementation simple and consistent with app/routes.js.

Use the existing Camden frontend styles and Storybook patterns at https://main--645a25e00de84a612195c9a5.chromatic.com/ for any new page, form, button or error state.
```

## Make a small copy change

```text
Update the copy in the [journey name] journey.

Change [specific page or text] to [new wording or goal]. Do not change route names, data keys or journey behaviour unless needed. Preserve Camden styling and existing page structure. Tell me which files changed.

Do not change frontend library classes, component patterns or visual styling unless I explicitly ask for that. If styling is involved, follow the Camden Storybook at https://main--645a25e00de84a612195c9a5.chromatic.com/.
```
