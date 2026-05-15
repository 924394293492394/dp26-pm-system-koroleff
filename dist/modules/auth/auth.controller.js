import { AuthService } from './auth.service.js';
import { registerSchema, loginSchema } from './auth.schema.js';
export class AuthController {
    static async register(req, res) {
        try {
            const data = registerSchema.parse(req.body);
            const user = await AuthService.register(data);
            res.status(201).json({
                id: user.id,
                login: user.login,
                email: user.email
            });
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    static async login(req, res) {
        try {
            const data = loginSchema.parse(req.body);
            const result = await AuthService.login(data);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}
