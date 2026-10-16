module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    '^ws$': require.resolve('ws'),
  },
};
