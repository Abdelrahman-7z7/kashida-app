const express = require('express')

//likedBy route 
const likedByRoute = require('./likedByRoute')

//controller
const commentController = require('../controller/commentController')
const authController = require('../controller/authController')

//init the app
const router = express.Router();

router.use(authController.protect)
//Middleware for handling a nested likedBy route
router.use('/:id/', likedByRoute)

router.route('/')
    .get(commentController.getAllComments)
    .post(commentController.createComment);

router.route('/:id')
    .get(commentController.getCommentById)
    .patch(commentController.updateComment)
    .delete(commentController.deleteComment);


module.exports = router;