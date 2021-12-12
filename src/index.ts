import preferPromiseRejection from "./rules/prefer-promise-rejection";

module.exports = {
  rules: {
      'prefer-promise-rejection': preferPromiseRejection
  },
  configs: {
      recommended: {
          plugins: ['chamion-typescript'],
          rules: {
              'chamion-typescript/prefer-promise-rejection': 'error'
          }
      }
  }
};
