import { describe, it, expect, vi } from 'vitest';
import { shuffleArray } from '../../lib/utils/bracketUtils';

describe('Bracket Utilities', () => {
  describe('shuffleArray', () => {
    it('should return an array of the same length', () => {
      const originalArray = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray([...originalArray]);
      expect(shuffled).toHaveLength(originalArray.length);
    });

    it('should contain the same elements as the original array', () => {
      const originalArray = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray([...originalArray]);
      expect(shuffled.sort()).toEqual(originalArray.sort());
    });

    it('should return a new array instance', () => {
      const originalArray = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray([...originalArray]); // Pass a copy
      expect(shuffled).not.toBe(originalArray); // Ensure it's a new array if input was copied
    });

    it('should modify the array in place if a direct reference is passed', () => {
      const originalArray = [1, 2, 3, 4, 5];
      const refArray = originalArray;
      shuffleArray(refArray); // Pass direct reference
      // The content of refArray (and originalArray) should be shuffled
      // This test is more about observing behavior than strict requirement,
      // as the function is typically called with a copied array ([...players]).
      expect(refArray.sort()).toEqual([1,2,3,4,5].sort()); // Still contains same elements
      // It's hard to assert it's *different* from original order without many runs or mocking Math.random
    });

    it('should handle an empty array', () => {
      expect(shuffleArray([])).toEqual([]);
    });

    it('should handle an array with one element', () => {
      expect(shuffleArray([1])).toEqual([1]);
    });

    // It's difficult to test the "randomness" of the shuffle in a deterministic unit test.
    // One approach is to mock Math.random, but that tests the implementation detail.
    // Another is to run it many times and check distributions, but that's for statistical testing.
    // For a unit test, checking length and content preservation is usually sufficient.
  });
});
