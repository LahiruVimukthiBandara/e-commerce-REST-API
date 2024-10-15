const express = require('express');
const router = express.Router();
const connection = require('../db-connection');
const bcrypt = require('bcryptjs');

// register users
router.post('/', (req, res) => {
    const { first_name, last_name, email, phone } = req.body;
    
    // hashing password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);

    const createUserQuery = `INSERT INTO users ( first_name, last_name, email, password, phone ) VALUES (?,?,?,?,?)`;

    connection.query(createUserQuery, [first_name, last_name, email, hashedPassword, phone], (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error creating user',
                error: err
            });
        } else {
            res.json({
                message: 'User created successfully',
                user_id: result.insertId
            });
        }
    });
});

// get all users
router.get('/', (req, res) => {
    const getAllUsersQuery = 'SELECT * FROM users';

    connection.query(getAllUsersQuery, (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error getting users',
                error: err
            });
        }
        if (result.length > 0){
            res.status(201).json({
                message: 'all users',
                category: result
            });
        }
         else {
            res.status(404).json({
                message: 'No users found'
            });
        }
    });
});

// get single user with reviews / address
router.get('/:user_id', (req, res) => {
    const user_id = req.params.user_id;
    const getUserQuery =`SELECT * FROM users WHERE user_id = ?`;

    connection.query(getUserQuery, [user_id], (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error getting user',
                error: err
            });
        }
        // get address
        const getAddressQuery = `SELECT * FROM address WHERE user_id = ?`;
        connection.query(getAddressQuery, [user_id], (err, address) => {
            if (err) {
                res.status(500).json({
                    message: 'Error getting address',
                    error: err
                });
            }
            // get reviews
            const getReviewsQuery = `SELECT * FROM reviews WHERE user_id =?`;
            connection.query(getReviewsQuery, [user_id], (err, reviews) => {

                // count reviews
                let totalReviews = reviews.length;

                if (err) {
                    res.status(500).json({
                        message: 'Error getting reviews',
                        error: err
                    });
                } 
                if (result.length > 0 || address.length > 0 || reviews.length > 0) {
                    res.status(201).json({
                        message: 'user details',
                        totalReviews: totalReviews,
                        user: result[0],
                        address: address,
                        reviews: reviews
                    });
                } else {
                    res.status(404).json({
                        message: 'User not found'
                    });
                }
            });
        });
    });
});

// update user
router.put('/:user_id', (req, res) => {
    const user_id = req.params.user_id;
    const { first_name, last_name, email, password, phone } = req.body;
    const updateUserQuery = 'UPDATE users SET first_name = ?, last_name = ?, email = ?, password = ?, phone = ? WHERE user_id = ?';

    connection.query(updateUserQuery, [first_name, last_name, email, password, phone, user_id], (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error updating user',
                error: err
            });
        } else {
            res.status(201).json({
                message: 'User updated successfully',
                data: result
            });
        }
    });
});

// delete user
router.delete('/:user_id', (req, res) => {
    const user_id = req.params.user_id;
    const deleteUserQuery = 'DELETE FROM users WHERE user_id =?';

    connection.query(deleteUserQuery, [user_id], (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error deleting user',
                error: err
            });
        } else {
            res.status(201).json({
                message: 'User deleted successfully',
                data: result
            });
        }
    });
});

module.exports = router;