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
    .delete(postController.deletePost);

router.patch('/:id/like', postController.likePost);
router.patch('/:id/unlike', postController.unlikePost);


module.exports = router;