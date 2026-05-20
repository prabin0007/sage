import express, { Router, Express } from 'express';
import { UserController } from '../controllers/userController';

const router: Router = express.Router();
const userController = new UserController();

export function setUserRoutes(app: Express): void {
  app.post('/api/users/register', (req, res) => userController.registerUser(req, res));
  app.post('/api/users/login', (req, res) => userController.loginUser(req, res));
  app.get('/api/users/:userId', (req, res) => userController.getUserDetails(req, res));
}

export default router;