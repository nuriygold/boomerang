/**
 * Token Vault Client
 *
 * Wrapper around Auth0's Token Vault API for secure credential management
 *
 * Auth0 Token Vault handles:
 * - OAuth flow orchestration
 * - Token storage and encryption
 * - Token refresh and rotation
 * - Scope-based access control
 * - Audit logging
 *
 * For hackathon: Use free trial at https://auth0.com/product/ai-agents
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class TokenVaultClient {
  constructor() {
    this.vaultUrl = process.env.TOKEN_VAULT_URL;
    this.apiKey = process.env.TOKEN_VAULT_API_KEY;
    this.domain = process.env.AUTH0_DOMAIN;

    if (!this.vaultUrl || !this.apiKey) {
      console.warn('⚠️  Token Vault not configured. Using mock mode for demo.');
      this.mockMode = true;
    }
  }

  /**
   * Request a token for a specific service and scope
   *
   * @param {string} userId - Auth0 user ID
   * @param {string} service - Service name (e.g., 'tableau', 'slack')
   * @param {string} scope - Requested scope (e.g., 'write:boomerang-data')
   * @param {string} reason - Why the agent needs this scope (logged for audit)
   * @returns {Promise<{token, expiresIn, service, scope}>}
   */
  async requestToken(userId, service, scope, reason = '') {
    if (this.mockMode) {
      return this.mockRequestToken(userId, service, scope);
    }

    try {
      const response = await axios.post(
        `${this.vaultUrl}/request`,
        {
          user_id: userId,
          service,
          scope,
          reason,
          client_id: process.env.AUTH0_CLIENT_ID,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        token: response.data.access_token,
        expiresIn: response.data.expires_in || 3600,
        service,
        scope,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error(
          `PERMISSION_DENIED: User ${userId} hasn't granted '${scope}' for ${service}. Consent required.`
        );
      }
      throw new Error(`Token Vault error: ${error.message}`);
    }
  }

  /**
   * Check what scopes a user has granted for a service
   *
   * @param {string} userId - Auth0 user ID
   * @param {string} service - Service name
   * @returns {Promise<string[]>} Array of granted scopes
   */
  async getGrantedScopes(userId, service) {
    if (this.mockMode) {
      return ['read:data', 'write:data']; // mock scopes
    }

    try {
      const response = await axios.get(
        `${this.vaultUrl}/user/${userId}/scopes/${service}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.scopes || [];
    } catch (error) {
      console.error('Error fetching scopes:', error.message);
      return [];
    }
  }

  /**
   * Revoke a specific scope for a user
   * Used when user wants to restrict agent access
   *
   * @param {string} userId - Auth0 user ID
   * @param {string} service - Service name
   * @param {string} scope - Scope to revoke
   */
  async revokeScope(userId, service, scope) {
    if (this.mockMode) {
      console.log(`[MOCK] Revoked ${scope} for ${service}`);
      return true;
    }

    try {
      await axios.delete(
        `${this.vaultUrl}/user/${userId}/scopes/${service}/${scope}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return true;
    } catch (error) {
      console.error('Error revoking scope:', error.message);
      throw error;
    }
  }

  /**
   * Get audit log of all token requests for a user
   * Shows transparency: what scopes were used, when, for what reason
   *
   * @param {string} userId - Auth0 user ID
   * @param {number} limit - Number of entries to return
   */
  async getAuditLog(userId, limit = 50) {
    if (this.mockMode) {
      return this.mockAuditLog(userId, limit);
    }

    try {
      const response = await axios.get(
        `${this.vaultUrl}/user/${userId}/audit?limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.entries || [];
    } catch (error) {
      console.error('Error fetching audit log:', error.message);
      return [];
    }
  }

  // ============================================
  // MOCK IMPLEMENTATIONS FOR DEMO/TESTING
  // ============================================

  mockRequestToken(userId, service, scope) {
    const mockTokens = {
      tableau: 'tableau_token_abc123_' + Date.now(),
      slack: 'xoxb-slack-bot-token-' + Date.now(),
      google: 'ya29.a0AfH6SMBx..._' + Date.now(),
    };

    return {
      token: mockTokens[service] || `mock_token_${service}_${Date.now()}`,
      expiresIn: 3600,
      service,
      scope,
      timestamp: new Date().toISOString(),
    };
  }

  mockAuditLog(userId, limit) {
    return [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        action: 'token_requested',
        service: 'tableau',
        scope: 'write:boomerang-data',
        reason: 'Agent uploading validated Q1 data',
        status: 'granted',
      },
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        action: 'scope_granted',
        service: 'slack',
        scope: 'chat:write',
        status: 'user_approved',
      },
    ];
  }
}

export default new TokenVaultClient();
