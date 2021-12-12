import preferPromiseRejection from "./rules/prefer-promise-rejection";

export default {
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