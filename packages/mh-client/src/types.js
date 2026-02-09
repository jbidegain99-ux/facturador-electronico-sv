"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthSuccess = isAuthSuccess;
function isAuthSuccess(response) {
    return response.status === 'OK';
}
