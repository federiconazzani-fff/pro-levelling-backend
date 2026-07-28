/**
 * Utility for triggering haptic feedback patterns.
 * Falls back gracefully if Navigator Haptics API is unavailable.
 */
export const haptic = {
  /**
   * Light pulse - for standard taps and navigation.
   */
  light: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium pulse - for successful actions or active state toggles.
   */
  medium: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(25);
    }
  },

  /**
   * Impact pulse - slightly sharper than medium.
   */
  impact: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(20);
    }
  },

  /**
   * Heavy pulse - for critical completions or high-impact actions.
   */
  heavy: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([40, 30, 40]);
    }
  },

  /**
   * Error pulse - for failed actions or warnings.
   */
  error: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }
  },

  /**
   * Selection pulse - very subtle for input changes.
   */
  selection: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(5);
    }
  },

  /**
   * Success pulse - for completions.
   */
  success: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([10, 30, 20]);
    }
  }
};
