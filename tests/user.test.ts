import { UserController } from '../src/controllers/userController';
import { User } from '../src/models/User';

describe('UserController', () => {
    let userController: UserController;

    beforeEach(() => {
        userController = new UserController();
    });

    it('should register a new user', async () => {
        const userData = { username: 'testUser', password: 'testPass' };
        const result = await userController.registerUser(userData);
        expect(result).toHaveProperty('username', userData.username);
    });

    it('should log in an existing user', async () => {
        const userData = { username: 'testUser', password: 'testPass' };
        await userController.registerUser(userData);
        const result = await userController.loginUser(userData);
        expect(result).toHaveProperty('username', userData.username);
    });

    it('should return user details', async () => {
        const userData = { username: 'testUser', password: 'testPass' };
        await userController.registerUser(userData);
        const result = await userController.getUserDetails(userData.username);
        expect(result).toHaveProperty('username', userData.username);
    });
});