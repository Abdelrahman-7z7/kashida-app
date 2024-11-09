const express = require('express')

//controller
const postController = require('../controller/postController')

const router = express.Router();


router.route('/')
    .get(postController.getAllPost)
    .post(postController.createPost);

router.route('/:id')
    .get(postController.getPostById)
    .patch(postController.updatePost)
    .delete(postController.deletePost)


module.exports = router;