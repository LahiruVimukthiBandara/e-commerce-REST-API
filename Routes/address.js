const express = require('express');
const router = express.Router();
const connection = require('../db-connection');

// create address
router.post('/:user_id', (req, res) => {
    const user_id = req.params.user_id;
    const { address_line1, address_line2, country, state, city, postal_code, phone_no } = req.body;

    const insertAddressQuery = `INSERT INTO address (user_id, address_line1, address_line2, country, state, city, postal_code, phone_no) VALUES (?,?,?,?,?,?,?,?)`;

    connection.query(insertAddressQuery, [user_id, address_line1, address_line2, country, state, city, postal_code, phone_no], (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error creating address',
                error: err
            });
        } else {
            res.status(2001).json({
                message: 'Address created successfully',
                address_id: result.insertId
            });
        }
    });
});

// get address
router.get('/:user_id', (req, res) => {
    const user_id = req.params.user_id;
    const getAddressQuery = `SELECT * FROM address WHERE user_id =?`;

    connection.query(getAddressQuery, [user_id], (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error getting address',
                error: err
            });
        } if (result.length > 0) {
            res.status(200).json({
                message: 'Addresses retrieved successfully',
                addresses: result
            });
        } else {
            res.status(404).json({
                message: 'Addresses not found'
            });
        }
    });
});

// edit address
router.put('/:user_id', (req, res) => {
    const user_id = req.params.user_id;
    const { address_line1, address_line2, country, state, city, postal_code, phone_no } = req.body;

    const updateAddressQuery = 'UPDATE address SET address_line1 = ?, address_line2 = ?, country = ?, state = ?, city = ?, postal_code = ?, phone_no = ? WHERE user_id = ? AND address_'

    connection.query(updateAddressQuery, [address_line1, address_line2, country, state, city, postal_code, phone_no, user_id], (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error updating address',
                error: err
            });
        } else if (result.affectedRows === 0) {
            res.status(404).json({
                message: 'Address not found'
            });
        } else {
            res.status(200).json({
                message: 'Address updated successfully'
            });
        }
    });
});

// delete address
router.delete('/:user_id', (req, res) => {
    const user_id = req.params.user_id;
    const deleteAddressQuery = 'DELETE FROM address WHERE user_id =?';

    connection.query(deleteAddressQuery, [user_id], (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error deleting address',
                error: err
            });
        } else if (result.affectedRows === 0) {
            res.status(404).json({
                message: 'Address not found'
            });
        } else {
            res.status(200).json({
                message: 'Address deleted successfully'
            });
        }
    });
});

module.exports = router;