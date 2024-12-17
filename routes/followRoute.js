const express = require('express')
const followController = require('../controller/followController')
const authController = require('../controller/authController')

const router = express.Router()

// Protect routes with authentication middleware
router.use(authController.protect)

//follow and unfollow routes
router.post('/:userId/follow', followController.follow)
router.delete('/:userId/unfollow', followController.unfollow)

//fetching followers and followings routes
router.get('/:userId/followers', followController.getFollowers)
router.get('/:userId/followings', followController.getFollowings)
router.get('/myFollowers', followController.getMyFollowers)
router.get('/myFollowings', followController.getMyFollowings)


module.exports = router;