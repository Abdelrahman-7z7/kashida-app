const express = require('express')

//Routes
const likedByRoute = require('./likedByRoute')
const commentRoute = require('./commentRoute')

//controller
const postController = require('../controller/postController')
const authController = require('../controller/authController')
const upload = require('../utils/multer')

const router = express.Router();

//Middleware for handling a nested likedBy route
router.use('/:postId/', likedByRoute)
router.use('/:postId/comments', commentRoute)

//Middleware => protecting the following route
router.use(authController.protect)

router.route('/')
    .get(postController.getAllPost)
    .post(postController.setUserId, upload, postController.createPost);

router.route('/:id')
    .get(postController.getPostById)
    .patch(postController.updatePost)
    .delete(postController.setUserId, postController.deletePost);

router.get('/search/:searchTerm', postController.searchPost)

module.exports = router;