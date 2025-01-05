const express = require('express')

//controller
const categoryController = require('../controller/categoryController')
const authController = require('../controller/authController')
const {configureMulterForCategory} = require('../utils/multer')

const router = express.Router()

//for accessing the fetching of categories to normal users to have the options to be chosen when posting 
router.use(authController.protect)

router.get('/', categoryController.getAllCategories)

//restricting the creation, updating and deletion of category to the admin only
router.use(authController.restrictTo('admin'))

router.post('/', configureMulterForCategory([
    {
        name: 'followedImg',
        maxCount: 1
    },
    {
        name: 'unfollowedImg',
        maxCount: 1
    },
    {
        name: 'logo',
        maxCount: 1
    }
]),categoryController.createCategory)

router.route('/:id')
    .patch(
        configureMulterForCategory([
            {
                name: 'followedImg',
                maxCount: 1
            },
            {
                name: 'unfollowedImg',
                maxCount: 1
            },
            {
                name: 'logo',
                maxCount: 1
            }
        ])
        ,categoryController.updateCategory)
    .delete(categoryController.deleteCategory)


module.exports = router;