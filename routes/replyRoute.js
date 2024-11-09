const express = require('express')
const replyController = require('../controller/replyController')

const router = express.Router()

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