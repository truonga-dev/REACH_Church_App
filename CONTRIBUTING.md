# Contributing Guide - REACH Church Vietnam

Thank you for your interest in contributing to REACH Church Vietnam! This guide will help you get started.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Code Style](#code-style)
5. [Testing](#testing)
6. [Commit Conventions](#commit-conventions)
7. [Pull Requests](#pull-requests)
8. [Reporting Issues](#reporting-issues)

---

## Code of Conduct

Please be respectful and inclusive. We welcome contributions from everyone regardless of background, experience level, or identity. Harassment or discrimination will not be tolerated.

---

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Submit a pull request

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/REACH_Church_App.git
cd REACH_Church_App

# Add upstream remote
git remote add upstream https://github.com/truonga-dev/REACH_Church_App.git

# Create feature branch
git checkout -b feature/your-feature-name
```

---

## Development Workflow

### 1. Sync with Upstream

```bash
git fetch upstream
git rebase upstream/develop
```

### 2. Create Feature Branch

```bash
git checkout -b feature/descriptive-name
# or
git checkout -b fix/bug-description
```

**Branch Naming Conventions:**
- `feature/auth-improvements`
- `fix/bible-search-bug`
- `docs/update-readme`
- `refactor/optimize-api-calls`
- `test/add-unit-tests`

### 3. Make Changes

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Make your changes
code src/...
```

### 4. Test Changes

```bash
# Run linting
npm run lint
npm run lint -- --fix  # Auto-fix issues

# Run tests
npm run test
npm run test:watch

# Check types
npm run type-check

# Build
npm run build
```

### 5. Commit Changes

```bash
git add .
git commit -m "type(scope): description"
```

---

## Code Style

### TypeScript

✅ **Do's:**
- Use strict TypeScript (`strict: true`)
- Define proper types and interfaces
- Avoid `any` type
- Use enums for constants
- Export types from dedicated files

❌ **Don'ts:**
- Use `any` without justification
- Ignore TypeScript errors
- Mix dynamic typing

### Example:

```typescript
// ✅ Good
interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName?: string
  role: 'user' | 'admin' | 'moderator'
}

const updateProfile = (profile: UserProfile): Promise<UserProfile> => {
  // Implementation
}

// ❌ Bad
const updateProfile = (profile: any) => {
  // Implementation
}
```

### React Components

✅ **Do's:**
- Use functional components with hooks
- Memoize expensive components
- Separate concerns (containers vs presentational)
- Use TypeScript for props

❌ **Don'ts:**
- Use class components (unless necessary)
- Props drilling too deep (use Context for shared state)
- Inline styles (use CSS modules)

### Example:

```typescript
// ✅ Good
interface BibleVersProps {
  book: string
  chapter: number
  verse: number
  text: string
  onHighlight?: (id: string, color: string) => void
}

export const BibleVerse: React.FC<BibleVerseProps> = ({
  book,
  chapter,
  verse,
  text,
  onHighlight,
}) => {
  return (
    <div className={styles.verse}>
      <span className={styles.reference}>
        {book} {chapter}:{verse}
      </span>
      <p className={styles.text}>{text}</p>
    </div>
  )
}

// ❌ Bad
export const BibleVerse = (props) => (
  <div style={{ padding: '10px' }}>
    <span>{props.book} {props.chapter}:{props.verse}</span>
    <p>{props.text}</p>
  </div>
)
```

### Naming Conventions

```typescript
// Files
- Components: PascalCase (BibleVerse.tsx)
- Utils: camelCase (bibleSearch.ts)
- Constants: UPPER_SNAKE_CASE (BIBLE_BOOKS.ts)

// Variables & Functions
- camelCase: const userName = 'John'
- PascalCase: class User, enum Status
- Constants: const MAX_RETRIES = 3

// Booleans
- is/has prefix: const isLoading, hasError
```

### Comments

```typescript
// ✅ Good
/**
 * Fetches Bible verses for a specific book and chapter
 * 
 * @param book - Bible book name (e.g., "Genesis")
 * @param chapter - Chapter number
 * @returns Array of verses with text
 * @throws Error if book or chapter not found
 */
async function getBibleVerses(book: string, chapter: number) {
  // Implementation
}

// ❌ Bad
// Get verses
function get(b, c) {
  // code
}
```

---

## Testing

### Test Structure

```typescript
describe('Feature/Component Name', () => {
  describe('Feature subset', () => {
    test('should do X when Y', () => {
      // Arrange
      const input = ...
      
      // Act
      const result = function(input)
      
      // Assert
      expect(result).toBe(expected)
    })
  })
})
```

### Test Guidelines

- ✅ Test behavior, not implementation
- ✅ Use descriptive test names
- ✅ Keep tests isolated and independent
- ✅ Mock external dependencies
- ✅ Aim for 80%+ coverage on critical paths

### Running Tests

```bash
# Run all tests
npm run test

# Run specific file
npm run test -- bible.test.ts

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, etc.
- `ci`: CI/CD configuration

### Examples

```bash
git commit -m "feat(auth): add two-factor authentication"
git commit -m "fix(bible): fix verse search case sensitivity"
git commit -m "docs: update API documentation"
git commit -m "refactor(components): simplify BibleVerse component"
git commit -m "test: add unit tests for bible search"
```

---

## Pull Requests

### Before Creating PR

- [ ] Branch is up to date with `develop`
- [ ] Code follows style guide
- [ ] Tests pass: `npm run test`
- [ ] Lint passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Types check: `npm run type-check`

### PR Title Format

```
type(scope): description

Examples:
- feat: add Bible sharing functionality
- fix: correct prayer request notification
- docs: update setup guide
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Motivation and Context
Why is this change needed? What problem does it solve?

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?
- [ ] Unit tests
- [ ] Manual testing
- [ ] E2E tests

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #123

## Checklist
- [ ] My code follows the code style
- [ ] I have performed a self review
- [ ] I have commented my code
- [ ] Tests pass locally
- [ ] No new warnings generated
```

### Review Process

1. All PRs require at least 1 approval
2. CI/CD pipeline must pass
3. Code review feedback must be addressed
4. Maintainers will merge when ready

---

## Reporting Issues

### Bug Reports

Include:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, browser, Node version)
- Screenshots/logs

### Feature Requests

Include:
- Description of feature
- Use case
- Proposed solution
- Alternatives considered

### Security Issues

Please report security issues privately to security@reach-church.com

---

## Documentation

When adding features, please update:

1. **README.md** - If it's user-facing
2. **API_DOCUMENTATION.md** - For API changes
3. **ARCHITECTURE.md** - For architectural changes
4. **Code comments** - JSDoc for functions

---

## Resources

- 📖 [Next.js Documentation](https://nextjs.org/docs)
- ⚛️ [React Documentation](https://react.dev)
- 🔷 [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- 🔐 [Supabase Documentation](https://supabase.com/docs)
- 🧪 [Jest Documentation](https://jestjs.io/docs/getting-started)

---

## Getting Help

- 📚 Check existing issues
- 💬 Ask in discussions
- 📧 Email: dev-team@reach-church.com

---

Thank you for contributing! 🎉

---

**Last Updated:** June 5, 2026
