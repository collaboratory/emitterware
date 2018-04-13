module.exports = {
  verbose: true,
  transform: {
    "^.+\\.jsx?$": "babel-jest"
  },
  setupFiles: ["./jest.setup.js"]
};
