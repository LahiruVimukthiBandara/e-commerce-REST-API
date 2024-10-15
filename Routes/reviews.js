const express = require('express');
const router = express.Router();
const connection = require('../db-connection');

// create review
router.post('/:product_id', (req, res) => {
    const product_id = req.params.product_id;
    const {user_id, review, rating} = ewq.body;

    const insertReviewQuery = `INSERT INTO reviews(user_id, product_id, review, rating) VALUES (?,?,?,?)`;

    connection.query(insertReviewQuery, [user_id, product_id, review, rating], (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error creating review',
                error: err
            });
        }
        res.status(201).json({
            message: 'Review created successfully',
            category: result
        });
    });
});

// get review for product
router.get('/:product_id', (req, res) => {
    const product_id = req.params.product_id;

    const getReviewsQuery = `SELECT
                            reviews.review_id,
                            reviews.product_id,
                            reviews.user_id,
                            users.first_name,
                            users.email,
                            reviews.review,
                            reviews.rating,
                            reviews.created_at,
                            reviews.updated_at
                        FROM reviews 
                        JOIN users ON reviews.user_id = users.user_id
                        WHERE product_id =?`;
    connection.query(getReviewsQuery, [product_id], (err, result) => {

        // review count
        let totalReviews = result.length;

        if (err) {
            res.status(500).json({
                message: 'Error getting reviews',
                error: err
            });
        }
        res.status(200).json({
            message: 'Reviews retrieved successfully',
            totalReviews: totalReviews,
            reviews: result
        });
    });
});

// edit review
router.put('/:review_id', (req, res) => {
    const review_id = req.params.review_id;
    const {review, rating} = req.body;
    
    const updateReviewQuery = `UPDATE reviews SET review=?, rating=? WHERE review_id=?`;

    connection.query(updateReviewQuery, [review, rating, review_id], (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error updating review',
                error: err
            });
        }
        res.status(200).json({
            message: 'Review updated successfully',
            review: result
        });
    });
});

// delete review
router.delete('/:review_id', (req, res) => {
    const review_id = req.params.review_id;
    
    const deleteReviewQuery = `DELETE FROM reviews WHERE review_id=?`;
    connection.query(deleteReviewQuery, [review_id], (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error deleting review',
                error: err
            });
        }
        res.status(200).json({
            message: 'Review deleted successfully',
            review: result
        });
    })
});

module.exports = router;