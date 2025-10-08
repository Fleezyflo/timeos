/**
 * MOH TIME OS v2.0 - VERSION MANAGEMENT
 *
 * Semantic versioning for deployment tracking and compatibility checks.
 * Updated manually at each phase deployment.
 */

const VERSION = {
  major: 2,
  minor: 0,
  patch: 0,
  phase: 10,
  build: 'production', // 'development' | 'staging' | 'production'
  releaseDate: '2025-10-08',

  toString() {
    return `v${this.major}.${this.minor}.${this.patch}-phase${this.phase}`;
  },

  toJSON() {
    return {
      version: this.toString(),
      major: this.major,
      minor: this.minor,
      patch: this.patch,
      phase: this.phase,
      build: this.build,
      releaseDate: this.releaseDate
    };
  }
};

/**
 * Get current system version
 * @returns {string} Version string (e.g., "v2.0.0-phase10")
 */
function getSystemVersion() {
  return VERSION.toString();
}

/**
 * Get full version metadata
 * @returns {Object} Version object with all metadata
 */
function getSystemVersionMetadata() {
  return VERSION.toJSON();
}
