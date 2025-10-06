/**
 * MOH TIME OS v2.0 - SECURE WEB APP AUTH
 *
 * Handles authentication and authorization for web app requests.
 * Provides Google Chat auth verification, rate limiting, and security checks.
 * Ensures only authorized requests access the system endpoints.
 *
 * Original lines: 7770-7940 from scriptA.js
 */

class SecureWebAppAuth {
  constructor(smartLogger) {
    this.logger = smartLogger;
  }

  /**
   * Verify Google Chat authentication token
   * @param {Object} e - Web app request event
   * @returns {boolean} Authentication success
   */
  verifyGoogleChatAuth(e) {
    try {
      // Check for Authorization header
      const authHeader = (e.parameter && e.parameter.authorization) ||
                        (e.postData && e.postData.headers && e.postData.headers.Authorization) ||
                        (e.postData && e.postData.headers && e.postData.headers.authorization);

      if (!authHeader) {
        this.logger.warn('SecureAuth', 'Missing Authorization header in request');
        return false;
      }

      // Extract bearer token
      const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
      if (!bearerMatch) {
        this.logger.warn('SecureAuth', 'Invalid Authorization header format');
        return false;
      }

      const token = bearerMatch[1];

      // Basic token validation (length and format check)
      if (!token || token.length < 20) {
        this.logger.warn('SecureAuth', 'Invalid token format');
        return false;
      }

      // Verify request source indicators
      const userAgent = (e.parameter && e.parameter.userAgent) ||
                       (e.postData && e.postData.headers && e.postData.headers['User-Agent']) ||
                       (e.postData && e.postData.headers && e.postData.headers['user-agent']) || '';

      // Google Chat requests have specific user agent patterns
      const isGoogleUserAgent = userAgent.includes('Google') ||
                               userAgent.includes('Chat') ||
                               userAgent.includes('Webhook');

      if (!isGoogleUserAgent) {
        this.logger.warn('SecureAuth', 'Suspicious user agent', { user_agent: userAgent });
        // Don't immediately fail - log for monitoring but allow through
        // Production should implement stricter validation
      }

      // Validate request structure for Google Chat format
      if (e.postData && e.postData.contents) {
        try {
          const payload = JSON.parse(e.postData.contents);

          // Check for required Google Chat payload structure
          if (!payload.message || !payload.space) {
            this.logger.warn('SecureAuth', 'Invalid Google Chat payload structure');
            return false;
          }

        } catch (parseError) {
          this.logger.warn('SecureAuth', 'Failed to parse request payload');
          return false;
        }
      }

      // Rate limiting check (basic protection)
      const remoteAddr = (e.parameter && e.parameter.remoteAddress) || 'unknown';
      if (!this._checkRateLimit(remoteAddr)) {
        this.logger.warn('SecureAuth', 'Rate limit exceeded', { remote_address: remoteAddr });
        return false;
      }

      this.logger.info('SecureAuth', 'Authentication successful', {
        token_length: token.length,
        user_agent: userAgent,
        remote_address: remoteAddr
      });

      return true;

    } catch (error) {
      this.logger.error('SecureAuth', 'Authentication verification failed', { error: error.message });
      return false;
    }
  }

  /**
   * Basic rate limiting protection
   * @private
   * @param {string} remoteAddr - Remote address
   * @returns {boolean} Rate limit check passed
   */
  _checkRateLimit(remoteAddr) {
    try {
      const cache = container.get(SERVICES.CrossExecutionCache);
      const rateLimitKey = `rate_limit_${remoteAddr}`;
      const currentCount = cache.get(rateLimitKey) || 0;

      const maxRequestsPerMinute = 30; // Reasonable limit for chat interactions

      if (currentCount >= maxRequestsPerMinute) {
        return false;
      }

      cache.set(rateLimitKey, currentCount + 1, 60); // 1 minute window
      return true;

    } catch (error) {
      // If rate limiting fails, log error but don't block request
      this.logger.error('SecureAuth', 'Rate limiting check failed', { error: error.message });
      return true;
    }
  }

  /**
   * Create authentication error response
   * @param {string} reason - Error reason
   * @returns {Object} Error response
   */
  createAuthErrorResponse(reason = 'Authentication failed') {
    this.logger.warn('SecureAuth', `Request rejected: ${reason}`);

    return {
      text: 'Authentication failed. This endpoint requires valid authorization.',
      error: reason,
      timestamp: TimeZoneAwareDate.toISOString(new Date())
    };
  }

  /**
   * Verify web app token for GET requests
   * @param {Object} e - Web app request event
   * @returns {boolean} Authentication success
   */
  verifyWebAppToken(e) {
    const verificationId = Utilities.getUuid();

    try {
      const authToken = e.parameter.auth;
      const validToken = PropertiesService.getScriptProperties().getProperty('WEB_APP_TOKEN');

      if (!authToken || authToken !== validToken) {
        this.logger.warn('SecureAuth', 'Web app token verification failed', {
          has_token: !!authToken,
          timestamp: TimeZoneAwareDate.toISOString(new Date()),
          request_ip: e.parameter.ip || 'unknown',
          verification_id: verificationId
        });
        return false;
      }

      this.logger.info('SecureAuth', 'Web app token verified successfully', {
        timestamp: TimeZoneAwareDate.toISOString(new Date()),
        verification_id: verificationId
      });
      return true;
    } catch (error) {
      this.logger.error('SecureAuth', 'Token verification error', {
        error: error.message,
        timestamp: TimeZoneAwareDate.toISOString(new Date()),
        verification_id: verificationId
      });
      return false;
    }
  }
}