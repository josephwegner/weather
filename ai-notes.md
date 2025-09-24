# Code Quality Action Items

> Generated from audit of commit `5414db0` - "working version of hourly forecasts"
> Date: 2025-09-23

## 🔥 HIGH PRIORITY - Fix Immediately

### 1. Fix Broken Date Filtering in Hourly Forecast

**Problem**: `getHourlyForecastForDay` returns 48 hours instead of 24 because filtering logic is commented out

**Files Affected**:
- `src/services/weatherApi.ts:184-187`
- `src/test/services/weatherApi.enhanced.test.ts` (2 failing tests)

**Tasks**:
- [ ] **Fix the date filtering logic** in `weatherApi.ts`
  - Uncomment lines 184-187
  - Debug timezone offset calculation
  - Ensure UTC to local time conversion works correctly
  - Test with different timezones to verify accuracy
- [ ] **Verify test expectations** in `weatherApi.enhanced.test.ts`
  - Confirm test mock data matches expected 24-hour format
  - Update test assertions if filtering logic changes
- [ ] **Test edge cases**
  - Daylight saving time transitions
  - Dates crossing month/year boundaries
  - Different user timezones

**Acceptance Criteria**:
- `npm run test:run` passes all tests
- Function returns exactly 24 hours for any given date
- Hours are correctly filtered to requested date in local timezone

---

### 2. Fix Development Tooling Pipeline

**Problem**: ESLint broken, TypeScript errors preventing quality checks

**Files Affected**:
- `.eslintrc.cjs` (missing dependency)
- Multiple test files with TypeScript mock errors
- `package.json` (missing dependencies)

**Tasks**:

#### 2a. Fix ESLint Configuration
- [ ] **Install missing ESLint dependency**
  ```bash
  npm install --save-dev @rushstack/eslint-patch
  ```
- [ ] **Verify ESLint runs successfully**
  ```bash
  npm run lint:check
  npm run lint
  ```
- [ ] **Fix any newly discovered linting issues**

#### 2b. Fix TypeScript Mock Errors
- [ ] **Fix axios mock setup** in test files
  - Add proper Jest mock types: `npm install --save-dev @types/jest`
  - Update mock declarations in test setup
  - Fix `mockResolvedValue` and `mockRejectedValue` type errors
- [ ] **Fix Vue component test types**
  - Update `DayForecastRow.test.ts` to properly expose `isExpanded` property
  - Consider using `@vue/test-utils` properly for component internals
  - Add proper Vue component type assertions

#### 2c. Add Pre-commit Hooks
- [ ] **Install and configure husky**
  ```bash
  npm install --save-dev husky lint-staged
  ```
- [ ] **Add pre-commit configuration** to `package.json`
  ```json
  "lint-staged": {
    "*.{ts,vue}": ["eslint --fix", "prettier --write"],
    "*.{ts,vue}": "vue-tsc --noEmit"
  }
  ```
- [ ] **Set up Git hooks**
  ```bash
  npx husky install
  npx husky add .husky/pre-commit "npx lint-staged"
  ```

**Acceptance Criteria**:
- `npm run lint:check` runs without errors
- `npm run type-check` passes with no TypeScript errors
- Pre-commit hooks prevent committing code with linting/type errors
- All tests pass: `npm run test:run`

---

### 3. Clean Up Debug Code

**Problem**: Production code contains debug statements and commented code

**Files Affected**:
- `src/services/weatherApi.ts:200` (console.log)
- `src/stores/weather.ts:65` (console.log)
- `src/services/weatherApi.ts:184-187` (commented code)

**Tasks**:
- [ ] **Remove console.log statements**
  - `weatherApi.ts:200` - Remove the debug console.log
  - `weather.ts:65` - Remove or replace with proper logging
- [ ] **Clean up commented code**
  - Either fix and uncomment the date filtering logic, or remove entirely
  - Remove any other dead code found during cleanup
- [ ] **Add proper logging strategy** (optional enhancement)
  - Consider adding a logging service for development mode
  - Replace console.logs with proper debug logging that can be toggled

**Acceptance Criteria**:
- No `console.log` statements in production code
- No commented-out code blocks
- Clean, readable codebase ready for production

---

## ⚠️ MEDIUM PRIORITY - Technical Debt

### 4. Simplify State Management Architecture

**Problem**: Potential confusion between multiple state patterns and lack of global error handling

**Files Affected**:
- `src/stores/weather.ts`
- `src/components/WeeklyForecast.vue`
- `src/components/DayForecastRow.vue`

**Tasks**:

#### 4a. Consolidate Forecast State
- [ ] **Review state structure** in `weather.ts`
  - Evaluate if both `hourlyForecast` and `hourlyForecastByDate` are needed
  - Consider merging into single, more flexible structure
  - Document the decision and rationale
- [ ] **Simplify loading states**
  - Consider centralizing loading state management
  - Reduce boilerplate in components
- [ ] **Add proper TypeScript interfaces** for all state shapes
  - Ensure type safety across state mutations
  - Add JSDoc comments for complex state interactions

#### 4b. Add Global Error Boundary
- [ ] **Create error boundary component**
  - Add Vue error boundary for unhandled component errors
  - Create centralized error handling strategy
- [ ] **Implement error recovery**
  - Add retry mechanisms for failed API calls
  - Provide user-friendly error messages
  - Add error reporting/logging (optional)

**Acceptance Criteria**:
- State management is intuitive and well-documented
- Error handling is consistent across the application
- Components have minimal boilerplate for common operations

---

### 5. Improve Test Reliability and Coverage

**Problem**: Mock setup issues and potential gaps in test coverage

**Files Affected**:
- `src/test/services/weatherApi.enhanced.test.ts`
- `src/test/components/DayForecastRow.test.ts`
- `src/test/setup.ts`

**Tasks**:

#### 5a. Fix Test Infrastructure
- [ ] **Improve axios mocking setup**
  - Create reusable mock factories
  - Add proper TypeScript support for mocks
  - Ensure mocks reset properly between tests
- [ ] **Fix Vue component testing**
  - Add proper component wrapper utilities
  - Fix internal property access issues
  - Add better component state testing helpers

#### 5b. Enhance Test Coverage
- [ ] **Add integration tests**
  - Test full user workflows (expand day → load hourly data)
  - Test error scenarios and recovery
  - Test cache behavior across components
- [ ] **Add performance tests** (optional)
  - Test caching effectiveness
  - Test component render performance
  - Test API rate limiting behavior

#### 5c. Improve Test Organization
- [ ] **Add test utilities**
  - Create shared test data factories
  - Add custom matchers for weather data
  - Standardize test structure across files
- [ ] **Add test documentation**
  - Document testing patterns and conventions
  - Add examples of how to test new features

**Acceptance Criteria**:
- All tests are reliable and pass consistently
- Test setup is simple and reusable
- Good coverage of both happy path and error scenarios
- Tests serve as documentation for expected behavior

---

## 📋 Completion Checklist

### High Priority (Complete All Before Next Feature)
- [ ] Date filtering fixed and tests passing
- [ ] ESLint and TypeScript errors resolved
- [ ] Pre-commit hooks working
- [ ] Debug code removed
- [ ] All tests passing: `npm run test:run`
- [ ] All quality checks passing: `npm run lint && npm run type-check`

### Medium Priority (Complete Before v1.0)
- [ ] State management simplified and documented
- [ ] Global error handling implemented
- [ ] Test infrastructure improved
- [ ] Integration tests added
- [ ] Code review of all changes completed

---

## 🔄 Post-Completion Actions

After completing these items:

1. **Run full quality suite**:
   ```bash
   npm run lint
   npm run type-check
   npm run test:run
   npm run build
   ```

2. **Update documentation** to reflect any architectural changes

3. **Consider adding** a `CONTRIBUTING.md` file with development guidelines

4. **Set up CI/CD pipeline** to automatically run these checks on pull requests

---

*Generated by Claude Code Audit - Update this file as items are completed*