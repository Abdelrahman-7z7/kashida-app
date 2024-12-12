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
    .post(postController.setUserId, postController.createPost);

router.route('/:id')
    .get(postController.getPostById)
    .patch(postController.updatePost)
    .delete(postController.setUserId, postController.deletePost);



module.exports = router;