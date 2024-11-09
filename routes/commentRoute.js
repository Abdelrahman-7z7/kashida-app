const express = require('express')
//controller
const commentController = require('../controller/commentController')

//init the app
const router = express.Router();

router.route('/')
    .get(commentController.getAllComments)
    .post(commentController.createComment);

router.route('/:id')
    .get(commentController.getCommentById)
    .patch(commentController.updateComment)
    .delete(commentController.deleteComment);

router.route('/:id/like').patch(commentController.likeComment);
router.route('/:id/unlike').patch(commentController.unlikeComment);

module.exports = router;