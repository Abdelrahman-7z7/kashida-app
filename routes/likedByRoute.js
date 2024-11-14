const express = require('express');

const likedByController = require('../controller/likedByController')
const authController = require('../controller/authController')

const router = express.Router({mergeParams: true});

router.use(authController.protect)

router.post('/likePost', likedByController.likePost)
router.delete('/unlikePost', likedByController.unlikePost)

router.post('/likeComment', likedByController.likeComment)
router.delete('/unlikeComment', likedByController.unlikeComment)

router.post('/likeReply', likedByController.likeReply)
router.delete('/unlikeReply', likedByController.unlikeReply)

router.get('/postLikes', likedByController.getAllPostLikes)
router.get('/commentLikes', likedByController.getAllCommentLikes)
router.get('/replyLikes', likedByController.getAllReplyLikes)


module.exports = router;