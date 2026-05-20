"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUserRoutes = setUserRoutes;
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const router = express_1.default.Router();
const userController = new userController_1.UserController();
function setUserRoutes(app) {
    app.post('/api/users/register', (req, res) => userController.registerUser(req, res));
    app.post('/api/users/login', (req, res) => userController.loginUser(req, res));
    app.get('/api/users/:userId', (req, res) => userController.getUserDetails(req, res));
}
exports.default = router;
