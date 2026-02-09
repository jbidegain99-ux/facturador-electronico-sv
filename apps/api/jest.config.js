"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: '.',
    roots: ['<rootDir>/src'],
    testRegex: '.*\\.spec\\.ts$',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transform: {
        '^.+\\.ts$': ['ts-jest', {
                tsconfig: (0, path_1.join)(__dirname, 'tsconfig.json'),
            }],
    },
    collectCoverageFrom: [
        'src/modules/**/*.service.ts',
        'src/modules/**/*.controller.ts',
        'src/modules/**/processors/*.ts',
        'src/modules/**/schedulers/*.ts',
        '!src/**/*.module.ts',
        '!src/**/*.dto.ts',
        '!src/**/index.ts',
    ],
    coverageDirectory: './coverage',
    setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
};
exports.default = config;
