const express = require('express');
const router = express.Router();
const connection = require('../db-connection');

// add to cart
router.post('/', (req, res) => {
    const {user_id, items} = req.body;

    if (!user_id || !Array.isArray(items) || items.length === 0) {
        res.json('User id and items are required');
        return;
    }

    // check if user already have a cart
    const getCartQuery = `SELECT cart_id FROM cart WHERE user_id = ?`;

    connection.query(getCartQuery, [user_id], (err, result) => {
        if (err) {
            res.status(500).send({
                message: 'Error getting cart',
                err
            });
        }

        let cart_id;

        if (result.length > 0) {
            cart_id = result[0].cart_id;
        } else {
            // create cart
            const createCartQuery = `INSERT INTO cart (user_id) VALUES (?)`;
            connection.query(createCartQuery, [user_id], (err, result) => {
                if (err) {
                    res.status(500).send({
                        message: 'Error creating cart',
                        err
                    });
                    return;
                }
                cart_id = result.cart_id;
            });
        }
        // after create or get the cart add items to cart items table
        const addItemsQuery = `INSERT INTO cartitems (cart_id, product_id, quantity) VALUES ?`;
        const itemData = items.map(item => [cart_id, item.product_id, item.quantity]);

        connection.query(addItemsQuery, [itemData], (err, result) => {
            if (err) {
                res.status(500).send({
                    message: 'Error creating cart',
                    err
                });
            } if (result.affectedRows > 0) {
                res.status(201).json({
                    message: 'Items added to the cart'
                });
            } else {
                res.status(404).send({
                    message: 'Cart not found'
                });
            }
        });
    });
});

// get cart products
router.get('/:user_id', (req, res) => {
    const user_id = req.params.user_id;
    const getCrtProductsQuery = `SELECT
                                    cart.cart_id,
                                    cart.user_id,
                                    cartitems.cart_item_id,
                                    cartitems.product_id,
                                    cartitems.quantity,
                                    products.name,
                                    products.price,
                                    products.main_image_url
                                FROM cart
                                JOIN cartitems ON cart.cart_id = cartitems.cart_id
                                JOIN products ON cartitems.product_id = products.product_id
                                WHERE cart.user_id = ?`;

    connection.query(getCrtProductsQuery, [user_id], (err, result) => {
        if (err) {
            res.status(500).send({
                message: 'Error getting cart',
                err
            });
        } if (result.length > 0) {
            res.status(200).json({
                message: 'Cart items',
                data: result
            });
        } else {
            res.status(404).send({
                message: 'Cart not found'
            });
        }
    });
});

// delete from cart
router.delete('/:cart_item_id', (req, res) => {
    const cart_item_id = req.params.cart_item_id;
    const deleteCartItemQuery = `DELETE FROM cartitems WHERE cart_item_id = ?`;

    connection.query(deleteCartItemQuery, [cart_item_id], (err, result) => {
        if (err) {
            res.status(500).send({
                message: "Error deleting cart item",
                err
            });
        } if (result.affectedRows > 0) {
            res.status(201).json({
                message: 'Item deleted successfully'
            });
        } else {
            res.status(404).send({
                message: 'Item not found'
            });
        }
    });
});

module.exports = router;