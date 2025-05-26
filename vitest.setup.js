// Setup file for Vitest
import '@testing-library/jest-dom';

// Extend the matchers
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

expect.extend(matchers);
