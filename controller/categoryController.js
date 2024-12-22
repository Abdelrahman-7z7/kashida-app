const AppError = require('../utils/appError')
const factory = require('./handlerFactory')
const Category = require('../models/categoryModel')

exports.getAllCategories = factory.getAll(Category)
exports.createCategory = factory.createOne(Category)
exports.updateCategory = factory.updateOne(Category)
exports.deleteCategory = factory.deleteOne(Category)
