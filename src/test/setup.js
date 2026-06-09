import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock crypto.randomUUID for environments that don't support it
if (!global.crypto) {
  global.crypto = {};
}
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9));
}
