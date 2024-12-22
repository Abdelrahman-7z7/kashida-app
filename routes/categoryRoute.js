const express = require('express')

//controller
const categoryController = require('../controller/categoryController')
const authController = require('../controller/authController')

const router = express.Router()

//for accessing the fetching of categories to normal users to have the options to be chosen when posting 
router.use(authController.protect)

router.get('/', categoryController.getAllCategories)

//restricting the creation, updating and deletion of category to the admin only
router.use(authController.restrictTo('admin'))

router.post('/', categoryController.createCategory)
router.route('/:id')
    .patch(categoryController.updateCategory)
    .delete(categoryController.deleteCategory)


module.exports = router;