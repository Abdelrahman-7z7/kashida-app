const express = require('express')

//likedBy route 
const likedByRoute = require('./likedByRoute')

//controller
const commentController = require('../controller/commentController')
const authController = require('../controller/authController')
const configureMulter = require('../utils/multer')

//init the app
const router = express.Router({mergeParams: true});

router.use(authController.protect)
//Middleware for handling a nested likedBy route
router.use('/:commentId/', likedByRoute)

router.route('/')
    .get(commentController.getAllComments)
    .post(configureMulter('photo', 1), commentController.createComment)

    
router.route('/:id')
    .get(commentController.getCommentById)
    .patch(commentController.updateComment)
    .delete(commentController.deleteComment);


module.exports = router;