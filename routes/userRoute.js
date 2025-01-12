const express = require('express')

const authController = require('../controller/authController')
const userController = require('../controller/userController')
const {configureMulter} = require('../utils/multer')

const router = express.Router()



router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.post('/forgotPassword', authController.forgotPassword) //resend code or sending for the first time
router.post('/verifyCode', authController.verifyPasswordResetCode)
router.post('/resetPassword', authController.resetPassword)

router.use(authController.protect)

router.patch('/updateMyPassword', authController.updatePassword);
router.patch('/updateMyEmail', authController.updateEmail)


router.get('/me', userController.getMe, userController.getUserById)
router.patch('/updateMe', configureMulter('photo', 1),userController.updateMe)
router.delete('/deleteMe', userController.deleteMe)
router.get('/search/:searchTerm', userController.searchForUser)
router.get('/mySpaces', userController.getAllJoinedSpaces)
router.post('/joinSpace', userController.joinSpace)
router.delete('/unjoinSpace', userController.unjoinSpace)
router.get('/:id', userController.getUserById)

router.use(authController.restrictTo('admin')) 

router.route('/')
    .get(userController.getAllUser)
    .post(userController.createNewUser)

router.route('/:id')
    .patch(userController.updateUser)
    .delete(userController.deleteUser)

router.post('/cleanUpJoinedSpaces', userController.cleanUpJoinedSpaces)



module.exports = router;