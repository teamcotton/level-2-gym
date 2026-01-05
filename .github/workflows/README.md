# GitHub Actions Workflows

## Update Dependencies Workflow

The `update-dependencies.yml` workflow automatically checks for and updates minor dependencies and security patches daily.

### Fixing "GitHub Actions is not permitted to create or approve pull requests" Error

If you encounter this error, you have two options:

#### Option 1: Enable GitHub Actions to Create PRs (Recommended)

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Actions** → **General**
3. Scroll down to **Workflow permissions**
4. Select **"Read and write permissions"**
5. Check the box for **"Allow GitHub Actions to create and approve pull requests"**
6. Click **Save**

#### Option 2: Use a Personal Access Token (PAT)

If you need more control or can't enable the above setting:

1. Create a Personal Access Token (classic):
   - Go to GitHub **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
   - Click **Generate new token (classic)**
   - Give it a descriptive name like "Auto-Updates"
   - Select scopes: `repo` (all), `workflow`
   - Generate and copy the token

2. Add the token as a repository secret:
   - Go to your repository **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `PAT_TOKEN`
   - Value: Paste your token
   - Click **Add secret**

The workflow is already configured to use `PAT_TOKEN` if available, falling back to `GITHUB_TOKEN` otherwise.

### Testing the Workflow

To manually test the workflow:

1. Go to **Actions** tab in your repository
2. Select **Update Minor Dependencies** workflow
3. Click **Run workflow**
4. Click the green **Run workflow** button

### How It Works

The workflow:

1. Runs daily at 9:00 AM UTC (or manually via workflow_dispatch)
2. Updates minor and patch dependencies in root, frontend, and backend
3. Runs tests, type checking, and linting
4. Creates a PR if there are dependency changes
5. Labels PRs based on test results (adds "breaking-changes" label if tests fail)
6. Provides detailed PR description with test status
