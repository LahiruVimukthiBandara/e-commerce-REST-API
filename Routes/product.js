const express = require('express');
const router = express.Router();
const connection = require('../db-connection');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// get all product
router.get('/', (req, res) => {
    // paginate the products
    const page = (req.query.page && req.query.page > 0) ? parseInt(req.query.page) : 1;
    const limit  = (req.query.limit && req.query.limit > 0) ? parseInt(req.query.limit) : 10;

    let startValue;
    let endValue;

    if(page > 0){
        startValue = (page * limit) - limit;
        endValue = page * limit;
    }else{
        startValue = 0;
        endValue = 10;
    }

    // getting products
    const getProductsQuery = `SELECT
                                products.product_id,
                                products.name,
                                products.description,
                                products.price,
                                products.stock_quantity,
                                products.main_image_url,
                                products.category_id,
                                categories.category_name
                            FROM products
                            JOIN categories ON products.category_id = categories.category_id
                            LIMIT ?, ?`;
       
    connection.query(getProductsQuery, [startValue, endValue], (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error fetching categories',
                error: err
            });
        } if (result.length > 0) {
            res.json({
                currentPage: page,
                allPages: endValue,
                data: result
            });
        } else {
            res.status(404).json({
                message: 'No categories found'
            });
        }
    });
});

// get single product
router.get('/:product_id', (req, res) => {
    const product_id = req.params.product_id;
    const getSingleProductQuery = `SELECT
                                    products.product_id,
                                    products.name,
                                    products.description,
                                    products.price,
                                    products.stock_quantity,
                                    products.main_image_url,
                                    products.category_id,
                                    categories.category_name
                                    FROM products
                                JOIN categories ON products.category_id = categories.category_id
                                WHERE product_id = ?`;
    connection.query(getSingleProductQuery, [product_id], (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error fetching categories',
                error: err
            });
        }
        // get gallery images from productImages
        const getGalleryImagesQuery = `SELECT * FROM productImages WHERE product_id = ?`
        connection.query(getGalleryImagesQuery, [product_id], (err, galleryImages) => {
            if (err) {
                res.status(500).json({
                    message: 'Error fetching categories',
                    error: err
                });
            } if (result.length && galleryImages.length > 0) {
                res.json({
                    product: result,
                    images: galleryImages
                });
            } else {
                res.status(404).json({
                    message: 'No categories found'
                });
            }
        });
    });
});

// upload images using multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname( file.originalname));
    }
});

const upload = multer({ storage: storage });

// create product
router.post('/',upload.fields([{ name: 'main_image', maxCount: 1 }, { name: 'gallery_images', maxCount: 5 }]), (req, res) => {
    const {name, description, price, stock_quantity, category_id} = req.body;
    // images
    const main_image_file = req.files['main_image'] ? req.files['main_image'][0] : null;
    const gallery_image_files = req.files['gallery_images'] || [];

    // check image fields
    if (!main_image_file || gallery_image_files.length === 0) {
        return res.status(400).json({ message: 'Main image and at least one gallery image are required' });
    }
    // set main image url
    const main_image_url = `http://localhost:3000/uploads/${main_image_file.filename}`;

    const insertProductQuery = `INSERT INTO products (name, description, price, stock_quantity, category_id, main_image_url) VALUES (?,?,?,?,?,?)`;

    connection.query(insertProductQuery, [name, description, price, stock_quantity, category_id, main_image_url], (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error creating product',
                error: err
            });
        }
        const product_id = result.insertId;

        // set gallery images urls
        let galleryImageValues = gallery_image_files.map(file => [product_id, `http://localhost:3000/uploads/${file.filename}`]);

        // insert gallery images to productimages table
        const insertGalleryImagesQuery = `INSERT INTO productimages (product_id, image_url) VALUES ?`;
        connection.query(insertGalleryImagesQuery, [galleryImageValues], (err, result) => {
            if (err) {
                res.status(500).json({
                    message: 'Error inserting gallery images',
                    error: err
                });
            }
            res.status(201).json({
                message: 'Product created successfully', product_id
            });
        });
    });
});

// update product
router.put('/:product_id',upload.fields([{ name: 'main_image', maxCount: 1 }, { name: 'gallery_images', maxCount: 5 }]), (req, res) => {
    
    const product_id = req.params.product_id;
    const {name, description, price, stock_quantity, category_id} = req.body;
    // images
    const main_image_file = req.files['main_image'] ? req.files['main_image'][0] : null;
    const gallery_image_files = req.files['gallery_images'] || [];

    const updateProductQuery = `UPDATE products SET name =?, description =?, price =?, stock_quantity =?, category_id =? WHERE product_id =?`;

    connection.query(updateProductQuery, [name, description, price, stock_quantity, category_id, product_id], (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error updating product',
                error: err
            });
        }
        // if main image file provided
        if(main_image_file){
            // set main image url
            const main_image_url = `http://localhost:3000/uploads/${main_image_file.filename}`;

            const updateMainImageQuery = `UPDATE products SET main_image = ? WHERE product_id = ?`;
            connection.query(updateMainImageQuery, [main_image_url, product_id], (err, result) => {
                if (err) {
                    res.status(500).json({
                        message: 'Error updating product main image',
                        error: err
                    });
                }
            });
        }

        // set gallery images urls
        let galleryImageValues = gallery_image_files.map(file => [product_id, `http://localhost:3000/uploads/${file.filename}`]);

        if (galleryImageValues.length > 0) {
            const updateProductImagesQuery = `INSERT INTO productimages (product_id, image_url) VALUES ?`;
            connection.query(updateProductImagesQuery, [galleryImageValues], (err, result) => {
                if (err) {
                    res.status(500).json({
                        message: 'Error inserting gallery images',
                        error: err
                    });
                }res.status(200).json({
                    message: 'Product updated successfully',
                    product_id
                });
            });
        }
    });
});

// delete product
router.delete('/:product_id', (req, res) => {
    const product_id = req.params.product_id;
    const deleteProductQuery = `DELETE FROM products WHERE product_id = ?`;
    
    connection.query(deleteProductQuery, [product_id], (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error deleting product',
                error: err
            });
        }
        // delete product images
        const deleteProductImagesQuery = `DELETE FROM productimages WHERE product_id = ?`;

        connection.query(deleteProductImagesQuery, [product_id], (err, result) => {
            if (err) {
                 res.status(500).json({
                    message: 'Error deleting product images',
                    error: err
                });
            }
             res.status(200).json({
                message: 'Product deleted successfully'
            });
        });
    });
});

module.exports = router;
