// jest.config.js - Criar
export const testEnvironment = 'jsdom';
export const setupFilesAfterEnv = ['<rootDir>/src/setupTests.js'];
export const moduleNameMapping = {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
};
export const transform = {
    '^.+\\.(js|jsx)$': 'babel-jest'
};
export const collectCoverageFrom = [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js'
];