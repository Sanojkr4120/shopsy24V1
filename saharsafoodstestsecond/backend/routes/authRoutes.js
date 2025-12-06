import express from 'express';
import { 
    registerUser, 
    loginUser, 
    getMe, 
    forgotPassword, 
    resetPassword, 
    updatePassword,
    updateProfile
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.put('/updatepassword', protect, updatePassword);
router.put('/profile', protect, upload.single('profileImage'), updateProfile);

export default router;
