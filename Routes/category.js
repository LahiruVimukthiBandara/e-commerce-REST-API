const express = require('express');
const router = express.Router();
const connection = require('../db-connection');

// create category
router.post('/', (req, res) => {
    const { category_name, category_description } = req.body;
    const insertCategoryQuery = `INSERT INTO categories (category_name, category_description) VALUES (?,?)`;

    connection.query(insertCategoryQuery, [category_name, category_description], (err, result) => {
            if (err) {
                res.status(500).json({
                    message: 'Error creating category',
                    error: err
                });
            } else {
                res.status(201).json({
                    message: 'Category created successfully',
                    category: result
                });
            }
        }
    );
});

// get all categories
router.get('/', (req, res) => {
    const getAllCategoriesQuery = `SELECT * FROM categories`;

    connection.query(getAllCategoriesQuery, (err, result) => {
            if (err) {
                res.status(500).json({
                    message: 'Error fetching categories',
                    error: err
                });
            } if (result.length > 0) {
                res.json(result);
            } else {
                res.status(404).json({
                    message: 'No categories found'
                });
            }
        }
    );
});

// get single category
router.get('/:category_id', (req, res) => {
    const category_id = req.params.category_id;
    const getSingleCategoryQuery = `SELECT * FROM categories WHERE category_id = ?`;

    connection.query(getSingleCategoryQuery, [category_id], (err, result) => {
            if (err) {
                res.status(500).json({
                    message: 'Error fetching category',
                    error: err
                });
            } if (result.length > 0) {
                res.json(result[0]);
            } else {
                res.status(404).json({
                    message: 'Category not found'
                });
            }
        }
    );
});

// edit category
router.put('/:category_id', (req, res) => {
    const category_id = req.params.category_id;
    const { category_name, category_description } = req.body;
    const updateCategoryQuery = `UPDATE categories SET category_name = ?, category_description = ? WHERE category_id = ?`;

    connection.query(updateCategoryQuery, [category_name, category_description, category_id], (err, result) => {
            if (err) {
                res.status(500).json({
                    message: 'Error updating category',
                    error: err
                });
            } else if (result.affectedRows > 0) {
                res.json({
                    message: 'Category updated successfully'
                });
            } else {
                res.status(404).json({
                    message: 'Category not found'
                });
            }
        }
    );
});

// delete category
router.delete('/:category_id', (req, res) => {
    const category_id = req.params.category_id;
    const deleteCategoryQuery = `DELETE FROM categories WHERE category_id =?`;

    connection.query(deleteCategoryQuery, category_id, (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error deleting category',
                error: err
            });
        } else if (result.affectedRows > 0) {
            res.json({
                message: 'Category deleted successfully'
            });
        } else {
            res.status(404).json({
                message: 'Category not found'
            });
        }
    });
});

module.exports = router;
