'use strict';

require('dotenv').config();

/**
 * Runtime configuration loaded from environment variables.
 * Keep secrets in .env and never commit them to git.
 */
module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
};
