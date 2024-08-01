import {Router} from 'express'
import ProfileController from '../controllers/ProfileController.js'
import AuthController from '../controllers/AuthController.js'
import authMiddleware from '../middleware/Authenticate.js'

const router = Router() 

router.post('/auth/register',AuthController.register)
router.post('/auth/login',AuthController.login)
router.get('/profile',authMiddleware,ProfileController.index)

export default router