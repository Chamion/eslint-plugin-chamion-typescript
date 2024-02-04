"use strict";

module.exports = {
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "es2019",
          transform: {
            react: {
              runtime: "automatic",
            },
          },
        },
      },
    ],
  },
};
