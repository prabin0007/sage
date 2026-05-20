import { Request, Response } from 'express';

export class UserController {
  registerUser(req: Request, res: Response): void {
    const { name, email } = req.body;
    if (!name || !email) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }
    res.json({ success: true, message: 'User registered' });
  }

  loginUser(req: Request, res: Response): void {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Missing credentials' });
      return;
    }
    res.json({ success: true, message: 'Login successful' });
  }

  getUserDetails(req: Request, res: Response): void {
    const { userId } = req.params;
    res.json({ success: true, userId, name: 'User Name' });
  }
}