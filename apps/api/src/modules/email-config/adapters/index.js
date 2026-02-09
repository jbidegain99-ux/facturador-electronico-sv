"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./email-adapter.interface"), exports);
__exportStar(require("./adapter.factory"), exports);
__exportStar(require("./sendgrid.adapter"), exports);
__exportStar(require("./mailgun.adapter"), exports);
__exportStar(require("./amazon-ses.adapter"), exports);
__exportStar(require("./microsoft365.adapter"), exports);
__exportStar(require("./google-workspace.adapter"), exports);
__exportStar(require("./postmark.adapter"), exports);
__exportStar(require("./brevo.adapter"), exports);
__exportStar(require("./mailtrap.adapter"), exports);
__exportStar(require("./smtp-generic.adapter"), exports);
