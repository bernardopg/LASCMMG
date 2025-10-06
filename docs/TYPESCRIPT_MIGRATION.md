# TypeScript Migration Guide

## Current Status

LASCMMG is currently written in **JavaScript (ES6+)** for both frontend and backend. However, TypeScript dependencies are included in the project for future migration considerations.

## Why TypeScript Dependencies?

The TypeScript-related packages in `devDependencies` serve several purposes:

1. **Type Checking**: Even without `.ts` files, TypeScript can provide type checking for JavaScript files using JSDoc comments
2. **IDE Support**: Better IntelliSense and autocomplete in modern editors
3. **Future Migration**: Infrastructure ready for gradual TypeScript adoption
4. **Library Types**: Many libraries include TypeScript definitions that improve developer experience

## Current Dependencies

### Root Package

```json
{
  "typescript": "^5.8.3",
  "typescript-eslint": "^8.32.1"
}
```

### Frontend Package

```json
{
  "@types/node": "^20.x.x",
  "@types/react": "^18.x.x",
  "@types/react-dom": "^18.x.x"
}
```

## Migration Strategy (If Desired)

If you decide to migrate to TypeScript, follow this incremental approach:

### Phase 1: Infrastructure Setup (Current State ✓)

- [x] Install TypeScript and related tooling
- [x] Add TypeScript ESLint plugins
- [ ] Create `tsconfig.json` files
- [ ] Configure build tools (Vite already supports TS)

### Phase 2: Gradual Conversion (Backend)

1. **Start with utilities** (`backend/lib/utils/`)
   - Rename `.js` → `.ts`
   - Add type annotations
   - Fix type errors

2. **Move to models** (`backend/lib/models/`)
   - Define interfaces for database entities
   - Type all model methods

3. **Convert middleware** (`backend/lib/middleware/`)
   - Type Express request/response objects
   - Use proper middleware types

4. **Update routes** (`backend/routes/`)
   - Type route handlers
   - Type request/response payloads

5. **Server entry point** (`backend/server.js` → `server.ts`)

### Phase 3: Gradual Conversion (Frontend)

1. **Type definitions** (`src/types/`)
   - Create interfaces for API responses
   - Define component prop types

2. **Utilities and services** (`src/utils/`, `src/services/`)
   - Convert pure JavaScript modules first
   - Add API response types

3. **Hooks** (`src/hooks/`)
   - Type custom hooks with generics
   - Define return types

4. **Components** (`src/components/`)
   - Start with leaf components (no children)
   - Move up to container components
   - Convert pages last

5. **Entry point** (`src/main.jsx` → `main.tsx`)

### Phase 4: Strictness & Cleanup

- Enable strict mode: `"strict": true`
- Remove `any` types
- Add exhaustive checking
- Remove JavaScript files

## Quick Start Config (If Starting Migration)

### Backend `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "noEmit": false
  },
  "include": ["backend/**/*", "scripts/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Frontend `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "allowJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Benefits of Migration

### Pros

- **Type Safety**: Catch errors at compile time
- **Better IDE Support**: Enhanced autocomplete and refactoring
- **Documentation**: Types serve as inline documentation
- **Refactoring Confidence**: Safe large-scale changes
- **Team Collaboration**: Clear contracts between modules

### Cons

- **Learning Curve**: Team needs TypeScript knowledge
- **Build Complexity**: Additional compilation step
- **Migration Time**: Significant effort to convert existing code
- **Dependency Types**: Some libraries may lack good type definitions

## Decision Checkpoint

Before starting migration, consider:

1. **Team Expertise**: Does the team know TypeScript?
2. **Project Size**: Is the codebase large enough to benefit?
3. **Timeline**: Can you afford the migration time?
4. **Maintenance**: Will future developers maintain type definitions?
5. **Dependencies**: Are your key dependencies well-typed?

## Keeping JavaScript (Alternative)

If you decide **NOT** to migrate:

### Option A: Use JSDoc Types

Add type annotations without TypeScript:

```javascript
/**
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @returns {Promise<{success: boolean, token?: string}>}
 */
async function authenticateUser(username, password) {
  // implementation
}
```

Benefits:

- Type checking without conversion
- Works with existing JavaScript
- IDE support improves

### Option B: Remove TypeScript Dependencies

If not planning to use TypeScript at all:

```bash
# Root package.json
npm uninstall typescript typescript-eslint

# Frontend package.json
cd frontend-react
npm uninstall @types/node @types/react @types/react-dom
```

Then update `eslint.config.mjs` to remove TypeScript-related rules.

## Recommendation

**For LASCMMG**:

Given the current state, I recommend:

1. **Keep dependencies** (minimal overhead)
2. **Start using JSDoc** for critical functions
3. **Plan migration** for future major version (2.0.0)
4. **Convert incrementally** if adopting TypeScript

The infrastructure is already in place, so the cost of keeping TypeScript dependencies is minimal while preserving future flexibility.

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Migrating from JavaScript](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)
- [TypeScript with Express](https://blog.logrocket.com/how-to-set-up-node-typescript-express/)
- [TypeScript with React](https://react-typescript-cheatsheet.netlify.app/)

---

**Last Updated**: October 2025
