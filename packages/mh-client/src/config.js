"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MH_BASE_URL_PROD = exports.MH_BASE_URL_TEST = void 0;
exports.getBaseUrl = getBaseUrl;
exports.MH_BASE_URL_TEST = 'https://apitest.dtes.mh.gob.sv';
exports.MH_BASE_URL_PROD = 'https://api.dtes.mh.gob.sv';
function getBaseUrl(env) {
    return env === 'prod' ? exports.MH_BASE_URL_PROD : exports.MH_BASE_URL_TEST;
}
