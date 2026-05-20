"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }
    validateCredentials(inputUsername, inputPassword) {
        return this.username === inputUsername && this.password === inputPassword;
    }
}
exports.User = User;
