const express = require('express')

//likedBy route 
const likedByRoute = require('./likedByRoute')

//controllers
const replyController = require('../controller/replyController')

const router = express.Router()

//Middleware for handling a nested likedBy route
router.use('/:id/', likedByRoute)

router.route('/')
    .get(replyController.getAllReplies)
    .post(replyController.createReply)

router.route('/:id')
    .get(replyController.getReplyById)
    .patch(replyController.updateReply)
    .delete(replyController.deleteReply)
    
router.patch('/:id/like', replyController.likeReply)
router.patch('/:id/unlike', replyController.unlikeReply)


module.exports = router;