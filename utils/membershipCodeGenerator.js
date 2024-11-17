const crypto = require('crypto');

function generateMembershipCode(length = 16) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
    .toUpperCase();
}

module.exports = { generateMembershipCode }; 