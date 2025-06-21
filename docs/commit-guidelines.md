# Commit Message Guidelines

This project uses [Conventional Commits](https://www.conventionalcommits.org/) to ensure consistent and meaningful commit messages. All commits are automatically validated using commitlint.

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation
- **ci**: Changes to CI configuration files and scripts
- **build**: Changes that affect the build system or external dependencies
- **revert**: Reverts a previous commit

## Examples

### Good Examples
```bash
feat: add user authentication endpoint
fix: resolve database connection timeout issue
docs: update API documentation for user routes
test: add unit tests for user service
refactor: improve error handling in auth middleware
perf: optimize database queries in user repository
chore: update dependencies to latest versions
ci: add automated testing workflow
```

### Bad Examples
```bash
# Too vague
fix: bug fix

# Wrong case
Feat: Add new feature

# Too long
feat: add a new feature that allows users to authenticate and login to the system with email and password validation

# Missing type
add user login functionality
```

## Rules

- **Subject line**: Max 72 characters
- **Case**: Use lowercase for subject (except proper nouns)
- **Punctuation**: No period at the end of subject line
- **Mood**: Use imperative mood ("add" not "added" or "adds")
- **Body**: Separate from subject with a blank line if needed
- **Footer**: Reference issues/PRs if applicable

## Validation

Commitlint will automatically check your commit messages when you commit. If your message doesn't follow the convention, the commit will be rejected with helpful error messages.

## Local Testing

You can test commit messages manually:

```bash
# Test a specific message
echo "feat: add new feature" | npx commitlint

# Check recent commits
npm run commitlint
```

## Breaking Changes

For breaking changes, add `!` after the type or use `BREAKING CHANGE:` in the footer:

```bash
feat!: remove deprecated user endpoints

# or

feat: add new user authentication system

BREAKING CHANGE: The old authentication endpoints have been removed.
Use the new /auth endpoints instead.
```
