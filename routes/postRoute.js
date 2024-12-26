const express = require('express')

//Routes
const likedByRoute = require('./likedByRoute')
const commentRoute = require('./commentRoute')

//controller
const postController = require('../controller/postController')
const authController = require('../controller/authController')
const configureMulter = require('../utils/multer')

const router = express.Router();

//Middleware for handling a nested likedBy route
router.use('/:postId/', likedByRoute)
router.use('/:postId/comments', commentRoute)

//Middleware => protecting the following route
router.use(authController.protect)

router.route('/')
    .get(postController.getAllPost)
    .post(postController.setUserId, configureMulter('photos', 10), postController.createPost);

router.route('/:id')
    .get(postController.getPostById)
    .patch(postController.checkUser ,postController.updatePost)
    .delete(postController.setUserId, postController.checkUser, postController.deletePost);

router.get('/search/:searchTerm', postController.searchPost)

module.exports = router;