"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
exports.default = (0, test_1.defineConfig)({
    testDir: './tests',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [
        ['html'],
        ['list'],
        ['json', { outputFile: 'test-results/results.json' }]
    ],
    use: {
        baseURL: process.env.TEST_URL || 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'setup',
            testDir: './tests/fixtures',
            testMatch: /auth\.fixture\.ts/,
        },
        {
            name: 'chromium',
            use: {
                ...test_1.devices['Desktop Chrome'],
                storageState: './tests/.auth/user.json',
            },
            dependencies: ['setup'],
            testDir: './tests/e2e',
        },
        {
            name: 'qa-report',
            use: { ...test_1.devices['Desktop Chrome'] },
            testDir: './tests/qa-report',
        },
    ],
});
