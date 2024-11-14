const express = require('express')

//Routes
const likedByRoute = require('./likedByRoute')

//controller
const postController = require('../controller/postController')
const authController = require('../controller/authController')

const router = express.Router();

//Middleware for handling a nested likedBy route
router.use('/:id/', likedByRoute)

//Middleware => protecting the following route
router.use(authController.protect)

router.route('/')
    .get(postController.getAllPost)
    .post(postController.createPost);

router.route('/:id')
    .get(postController.getPostById)
    .patch(postController.updatePost)
    .delete(postController.deletePost);

router.patch('/:id/like', postController.likePost);
router.patch('/:id/unlike', postController.unlikePost);


module.exports = router;