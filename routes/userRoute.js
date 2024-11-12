const express = require('express')

const authController = require('../controller/authController')
const userController = require('../controller/userController')

const router = express.Router()



router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.post('/forgotPassword', authController.forgotPassword)
router.post('/resetPassword/:token', authController.resetPassword)

router.use(authController.protect)
router.patch('/updateMyPassword', authController.updatePassword);


router.get('/me', userController.getMe, userController.getUserById)
router.patch('/updateMe', userController.updateMe)
router.delete('/deleteMe', userController.deleteMe)

router.use(authController.restrictTo('admin')) 

router.route('/')
    .get(userController.getAllUser)
    .post(userController.createNewUser)

router.route('/:id')
    .get(userController.getUserById)
    .patch(userController.updateUser)
    .delete(userController.deleteUser)



module.exports = router;