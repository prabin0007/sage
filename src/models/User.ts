export class User {
    username: string;
    password: string;

    constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
    }

    validateCredentials(inputUsername: string, inputPassword: string): boolean {
        return this.username === inputUsername && this.password === inputPassword;
    }
}