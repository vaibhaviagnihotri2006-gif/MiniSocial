/**
 * Recursively strips keys containing Mongo operator characters ($ or .)
 * and escapes strings that could be interpreted as regex-injection when
 * used in a $regex search, to prevent NoSQL injection / ReDoS.
 */
const stripOperators = (input) => {
  if (Array.isArray(input)) {
    return input.map(stripOperators);
  }
  if (input && typeof input === 'object') {
    return Object.keys(input).reduce((acc, key) => {
      if (key.startsWith('$') || key.includes('.')) {
        return acc;
      }
      acc[key] = stripOperators(input[key]);
      return acc;
    }, {});
  }
  return input;
};

const escapeRegex = (str = '') => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { stripOperators, escapeRegex };
