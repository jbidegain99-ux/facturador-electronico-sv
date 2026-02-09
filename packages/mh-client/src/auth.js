"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MHAuthError = void 0;
exports.authenticate = authenticate;
const config_1 = require("./config");
const types_1 = require("./types");
class MHAuthError extends Error {
    statusCode;
    responseBody;
    constructor(message, statusCode, responseBody) {
        super(message);
        this.statusCode = statusCode;
        this.responseBody = responseBody;
        this.name = 'MHAuthError';
    }
}
exports.MHAuthError = MHAuthError;
async function authenticate(nit, password, options = {}) {
    const { env = 'test' } = options;
    const baseUrl = (0, config_1.getBaseUrl)(env);
    const url = `${baseUrl}/seguridad/auth`;
    const nitSinGuiones = nit.replace(/-/g, '');
    const body = {
        user: nitSinGuiones,
        pwd: password,
    };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw new MHAuthError(`HTTP error from MH API: ${response.status} ${response.statusText}`, response.status);
        }
        const data = await response.json();
        if (!(0, types_1.isAuthSuccess)(data)) {
            const errorBody = data.body;
            throw new MHAuthError(errorBody.message || 'Authentication failed', response.status, data);
        }
        return data;
    }
    catch (error) {
        if (error instanceof MHAuthError) {
            throw error;
        }
        throw new MHAuthError(`Failed to connect to MH API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
