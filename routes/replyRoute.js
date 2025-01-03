const express = require('express')

//likedBy route 
const likedByRoute = require('./likedByRoute')

//controllers
const replyController = require('../controller/replyController')
const authController = require('../controller/authController')

const router = express.Router({mergeParams: true})

//Middleware for handling authentication
router.use(authController.protect)

//Middleware for handling a nested likedBy route
router.use('/:replyId/', likedByRoute)

router.route('/')
    .get(replyController.getAllReplies)
    .post(replyController.createReply)

router.route('/:id')
    .get(replyController.getReplyById)
    .patch(replyController.checkUser, replyController.updateReply)
    .delete(replyController.checkUser, replyController.deleteReply)

router.post('/report', replyController.sendReport)

module.exports = router;