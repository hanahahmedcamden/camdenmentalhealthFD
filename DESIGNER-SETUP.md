# Designer setup

This guide is for Camden designers using a Mac. You do not need to be a developer to run the prototype kit locally.

## What to install

Install these apps first:

- GitHub Desktop, to clone and update the repository.
- Codex, to ask for changes to journeys and pages.
- Visual Studio Code, to open and read the code when you want to inspect what Codex changed.
- The current Node.js 22 LTS desktop installer, to run the prototype on your Mac.

The normal Node.js desktop installer includes `node` and `npm`. It does not include `nvm`, and designers do not need `nvm`.

If you already use `nvm`, the project includes `.nvmrc` so `start.command` and `update.command` can select Node 22 for you.

## Clone with GitHub Desktop

1. Open GitHub Desktop.
2. Choose **File > Clone repository**.
3. Select this repository from GitHub.
4. Choose where to save it on your Mac.
5. Click **Clone**.

## Open the repo in Codex

1. Open Codex.
2. Choose **File > Open folder**.
3. Select the folder you cloned with GitHub Desktop.
4. This will create a project with the name of the cloned repo.
5. From here you can start prompting.

Useful copy-paste prompts are in [PROMPTS.md](PROMPTS.md).

## Open the code in VS Code

1. Open Visual Studio Code.
2. Choose **File > Open Folder**.
3. Select the folder you cloned with GitHub Desktop.

You can use VS Code to review pages, routes and copy changes. The most common files are in `app/routes.js` and `app/views`.

## Start the prototype

1. In Finder, open the cloned repository folder.
2. Double-click `start.command`.
3. Leave the Terminal window open while you use the prototype.

The first run may take a few minutes because it installs the project dependencies.

If macOS says it cannot run `start.command`, open Terminal in the repository folder and run:

```sh
chmod +x start.command update.command
```

Then double-click `start.command` again.

## View it in the browser

Open:

```text
http://localhost:3000
```

If port `3000` is busy, `start.command` will try:

```text
http://localhost:3010
```

The Terminal window will show the exact address to open.

## Stop the prototype

Click the Terminal window that is running the prototype, then press:

```text
Control+C
```

You can close the Terminal window after it stops.

## If the port is busy

If the Terminal says the port is busy:

1. Stop any other prototype Terminal windows with `Control+C`.
2. Double-click `start.command` again.
3. If it is still busy, ask Codex: `The Camden prototype port is busy. Help me find and stop the local process safely.`

## Update the kit

To get the latest repository changes:

1. Make sure the prototype is stopped.
2. Double-click `update.command`.
3. When it finishes, double-click `start.command`.

`update.command` gets the latest committed changes from GitHub, reinstalls the exact project dependencies, and runs a build check. It does not publish your work or make a commit.

If GitHub Desktop says you have local changes, ask Codex to review them before updating.

## Password protect a deployed prototype

See [PUBLISHING.md](PUBLISHING.md) for how to publish a prototype to GitHub, deploy it on Render and set a password for deployed access.
