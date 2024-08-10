import { jwtVerify } from 'jose';

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ status: 401, message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
       req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ status: 401, message: 'Unauthorized' });
    }
};

export default authMiddleware;
