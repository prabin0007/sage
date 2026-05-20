"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
class UserController {
    registerUser(req, res) {
        const { name, email } = req.body;
        if (!name || !email) {
            res.status(400).json({ success: false, message: 'Missing required fields' });
            return;
        }
        res.json({ success: true, message: 'User registered' });
    }
    loginUser(req, res) {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Missing credentials' });
            return;
        }
        res.json({ success: true, message: 'Login successful' });
    }
    getUserDetails(req, res) {
        const { userId } = req.params;
        res.json({ success: true, userId, name: 'User Name' });
    }
}
exports.UserController = UserController;
