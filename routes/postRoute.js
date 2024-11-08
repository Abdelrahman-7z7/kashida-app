const express = require('express')

//controller
const postController = require('../controller/postController')

const router = express.Router();


router.route('/')
    .get(postController.getAllPost)
    .post(postController.createPost);


module.exports = router;