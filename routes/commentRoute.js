const express = require('express')

//likedBy route 
const likedByRoute = require('./likedByRoute')

//controller
const commentController = require('../controller/commentController')

//init the app
const router = express.Router();

//Middleware for handling a nested likedBy route
router.use('/:id/', likedByRoute)

router.route('/')
    .get(commentController.getAllComments)
    .post(commentController.createComment);

router.route('/:id')
    .get(commentController.getCommentById)
    .patch(commentController.updateComment)
    .delete(commentController.deleteComment);

router.patch('/:id/like', commentController.likeComment);
router.patch('/:id/unlike', commentController.unlikeComment);

module.exports = router;