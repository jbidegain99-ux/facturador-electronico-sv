"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MhClient = void 0;
const MH_ENDPOINTS = {
    AUTH: '/seguridad/auth',
    RECEPCION_DTE: '/fesv/recepciondte',
    CONSULTA_DTE: '/fesv/consultadte',
};
class MhClient {
    config;
    token = null;
    constructor(config) {
        this.config = config;
    }
    async authenticate(credentials) {
        const url = `${this.config.baseUrl}${MH_ENDPOINTS.AUTH}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                user: credentials.user,
                pwd: credentials.pwd,
            }),
        });
        if (!response.ok) {
            throw new Error(`Auth failed: ${response.status}`);
        }
        const data = await response.json();
        if (data.status !== 'OK' || !('token' in data.body)) {
            throw new Error('Authentication failed');
        }
        this.token = data.body.token;
        return this.token;
    }
    async sendDte(request) {
        if (!this.token) {
            throw new Error('Not authenticated');
        }
        const url = `${this.config.baseUrl}${MH_ENDPOINTS.RECEPCION_DTE}`;
        const fullRequest = {
            ...request,
            ambiente: this.config.ambiente,
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: this.token,
            },
            body: JSON.stringify(fullRequest),
        });
        const data = await response.json();
        return data;
    }
    async consultaDte(nitEmisor, tipoDte, codigoGeneracion) {
        if (!this.token) {
            throw new Error('Not authenticated');
        }
        const url = `${this.config.baseUrl}${MH_ENDPOINTS.CONSULTA_DTE}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: this.token,
            },
            body: JSON.stringify({
                nitEmisor,
                tdte: tipoDte,
                codigoGeneracion,
            }),
        });
        return response.json();
    }
    setToken(token) {
        this.token = token;
    }
    getToken() {
        return this.token;
    }
}
exports.MhClient = MhClient;
