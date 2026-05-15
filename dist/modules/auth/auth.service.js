import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
export class AuthService {
    static async register(data) {
        const existingUser = await prisma.userAuth.findFirst({
            where: {
                OR: [
                    { login: data.login },
                    { email: data.email }
                ]
            }
        });
        if (existingUser) {
            throw new Error('User already exists');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await prisma.userAuth.create({
            data: {
                login: data.login,
                email: data.email,
                password: hashedPassword
            }
        });
        return user;
    }
    static async login(data) {
        const user = await prisma.userAuth.findUnique({
            where: { login: data.login }
        });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        const isValid = await bcrypt.compare(data.password, user.password);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }
        const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '7d' });
        return { token };
    }
}
