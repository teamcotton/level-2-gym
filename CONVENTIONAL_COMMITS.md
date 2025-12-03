# Conventional Commits

This project enforces [Conventional Commits](https://www.conventionalcommits.org/) specification for all commit messages.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Minimum required format:**

```
<type>: <subject>
```

## Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

## Examples

### Simple commits

```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve navigation bug"
git commit -m "docs: update README with setup instructions"
```

### With scope

```bash
git commit -m "feat(auth): add login functionality"
git commit -m "fix(api): handle null responses"
git commit -m "test(components): add unit tests for Button"
```

### With breaking changes

```bash
git commit -m "feat(api): change response format

BREAKING CHANGE: API responses now return data in camelCase instead of snake_case"
```

## Enforcement

Commit messages are validated using `commitlint` via a Husky `commit-msg` hook. Invalid commits will be rejected with an error message explaining what's wrong.

## Tips

- Keep the subject line under 72 characters
- Use imperative mood ("add feature" not "added feature")
- Don't capitalize the first letter of the subject
- Don't end the subject line with a period
