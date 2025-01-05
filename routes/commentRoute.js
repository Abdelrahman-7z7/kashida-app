const express = require('express')

//likedBy route 
const likedByRoute = require('./likedByRoute')
const replyRoute = require('./replyRoute')

//controller
const commentController = require('../controller/commentController')
const authController = require('../controller/authController')
const {configureMulter} = require('../utils/multer')

//init the app
const router = express.Router({mergeParams: true});

router.use(authController.protect)

//Middleware for handling a nested likedBy route
router.use('/:commentId/', likedByRoute)

//middleware for handling a nested reply route
router.use('/:commentId/replies/', replyRoute)

router.route('/')
    .get(commentController.getAllComments)
    .post(configureMulter('photo', 1), commentController.createComment)

    
router.route('/:id')
    .get(commentController.getCommentById)
    .patch(commentController.checkUser, commentController.updateComment)
    .delete(commentController.checkUser, commentController.deleteComment);

router.post('/report', commentController.sendReport)

module.exports = router;