# Publishing and deploying a prototype

This guide explains how to publish a local Camden prototype to GitHub, deploy it on Render, and add a password for deployed access.

Use this when a prototype is ready to share outside your own Mac.

## Recommended workflow

1. Build or edit the journey locally with Codex.
2. Run the prototype locally and check it in the browser.
3. Review the changed files in GitHub Desktop or VS Code.
4. Commit the changes in GitHub Desktop.
5. Publish or push the repository to GitHub.
6. Deploy the GitHub repository on Render.
7. Set a deployed prototype password in Render.

Use GitHub Desktop for committing, publishing and pushing. It gives designers a visual review step before anything is sent to GitHub. Use Codex when you want help checking changes, writing a commit message, or fixing a GitHub Desktop warning.

## GitHub account

You need a GitHub account before you can publish a prototype.

1. Go to `https://github.com`.
2. Sign in, or create an account if you do not have one.
3. Open GitHub Desktop and sign in with the same GitHub account.

## Repository name

Name the GitHub repository after the service or transaction. Use lowercase words separated by hyphens.

For a goose reporting tool called **Report a Goose Sighting**, use:

```text
camden-report-a-goose-sighting-prototype
```

Other examples:

```text
camden-missed-bin-collection-prototype
camden-parking-permit-prototype
camden-council-tax-discount-prototype
```

## Commit the prototype in GitHub Desktop

1. Open GitHub Desktop.
2. Select the prototype repository.
3. Check the changed files list.
4. Use VS Code or Codex to review anything you are unsure about.
5. Enter a short commit message, for example:

```text
Add goose sighting journey
```

6. Click **Commit to main**.

## Publish or push to GitHub

If this is the first time this prototype has gone to GitHub:

1. In GitHub Desktop, click **Publish repository**.
2. Use the repository name:

```text
camden-report-a-goose-sighting-prototype
```

3. Choose the GitHub account or organisation that should own the prototype.
4. Keep it private unless you have been told to make it public.
5. Click **Publish repository**.

If the repository already exists on GitHub:

1. Commit your changes in GitHub Desktop.
2. Click **Push origin**.

If GitHub Desktop shows a warning or conflict, stop and ask Codex to help. Do not force push unless someone technical has checked it.

## Deploy on Render

Render deploys from a GitHub repository. When you push new commits to GitHub, Render can redeploy the prototype automatically.

1. Go to `https://render.com`.
2. Sign in, or create an account.
3. Choose **New**.
4. Choose **Web Service**.
5. Connect your GitHub account if Render asks.
6. Select the prototype repository, for example:

```text
camden-report-a-goose-sighting-prototype
```

7. Use these settings:

```text
Name: camden-report-a-goose-sighting-prototype
Runtime: Node
Build Command: npm ci
Start Command: npm start
```

8. Add the environment variables listed below.
9. Create the web service and wait for the first deploy to finish.

Render automatically provides the `PORT` value the app needs. Do not set `PORT` yourself.

## Render free services

Render's free web services go to sleep after 15 minutes without traffic. This is normal.

When someone opens the prototype after it has gone to sleep, Render wakes it up again. The first page load can take about a minute while this happens, and Render may show a loading page. After it wakes up, the prototype should feel normal again.

This is usually fine for sharing prototypes. If the delay becomes a problem for frequent research sessions or stakeholder reviews, move the Render service to a paid instance type.

## Render environment variables

Add these before the first deploy if you can.

Required:

```text
PROTOTYPE_PASSWORD
```

Set this to the password people must enter before they can view the deployed prototype.

Recommended:

```text
SESSION_SECRET
```

Set this to a long random phrase. It is used to protect prototype session data.

Usually automatic on Render:

```text
NODE_ENV=production
```

Render normally sets `NODE_ENV` to `production` for Node services at runtime. If the deployed prototype does not ask for a password, check that `NODE_ENV` is `production` and that `PROTOTYPE_PASSWORD` is set.

## How the deployed password works

Local prototypes do not need a password. Deployed prototypes should have one.

When someone opens the deployed prototype, their browser will ask for a username and password.

- Username: anything
- Password: the value of `PROTOTYPE_PASSWORD`

Do not commit the password to GitHub and do not put it in the code.

If `PROTOTYPE_PASSWORD` is missing in production, the prototype will show a configuration error instead of opening without a password.

## After making more changes

When you make more changes locally:

1. Test the prototype on your Mac.
2. Commit the changes in GitHub Desktop.
3. Click **Push origin**.
4. Check Render to make sure the deploy succeeds.

## Ask Codex for help

Useful prompts:

```text
Review my local changes before I commit this Camden prototype. Tell me if anything looks risky for deployment.
```

```text
GitHub Desktop is showing a warning. Explain what it means and tell me the safest next step.
```

```text
Render failed to deploy this prototype. Inspect the logs and help me fix the deployment.
```
