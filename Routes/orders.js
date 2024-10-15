const express = require('express');
const router = express.Router();
const connection = require('../db-connection');

// create order (client)
router.post('/:user_id', (req, res) => {
    const user_id = req.params.user_id;
    const { amount, status, products} = req.body;
    const insertOrderQuery = `INSERT INTO orders (user_id, amount, status) VALUES(?,?,?)`;

    //add to order table
    connection.query(insertOrderQuery, [user_id, amount, status], (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error creating order',
                error: err
            });
        }
        // insert products to orderitems table
        const order_id = result.insertId;

        const insertOrderItemsQuery = `INSERT INTO orderitems (order_id, product_id, quantity, price) VALUES ?`;
        const orderItems = products.map(item => [order_id, item.product_id, item.quantity, item.price]);
        connection.query(insertOrderItemsQuery, [orderItems], (err, result) => {
            if (err) {
                res.status(500).json({
                    message: 'Error inserting order items',
                    error: err
                });
            }
            // update item stock_quantity in product table
            const updateStockQuantity = products.map( item => {
                return new Promise((resolve, reject) => {
                    const updateQuantityQuery = 'UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?';
                    connection.query(updateQuantityQuery, [item.quantity,item.product_id], (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            });

            // update stock quantity
            Promise.all(updateStockQuantity).then(() => {
                res.status(201).json({
                    message: 'Order created successfully and stock updated successfully',
                    order_id: order_id
                });
            }).catch((err) => {
                res.status(500).send({
                    message: 'Error updating stock quantity',
                    error: err
                });
            })
        });
    });
});

// get all orders with order items (admin)
router.get('/', (req, res) => {
    const getAllOrdersQuery = `SELECT 
                                orders.order_id,
                                orders.user_id,
                                orders.amount,
                                orders.status,
                                orderitems.product_id,
                                products.name,
                                products.price,
                                products.stock_quantity,
                                products.main_image_url,
                                orderitems.quantity,
                                orderitems.price AS order_item_price
                            FROM orders
                            JOIN orderitems ON orders.order_id = orderitems.order_id
                            JOIN products ON orderitems.product_id = products.product_id`;
    
    connection.query(getAllOrdersQuery, (err, result) => {
        if (err) {
            return res.status(500).json({
                message: 'Error getting orders',
                error: err
            });
        }

        // Create a structure where each order has an array of items
        const ordersMap = {};
        
        result.forEach(row => {
            // Check if the order already exists in the ordersMap
            if (!ordersMap[row.order_id]) {
                ordersMap[row.order_id] = {
                    order_id: row.order_id,
                    user_id: row.user_id,
                    amount: row.amount,
                    status: row.status,
                    items: [] 
                };
            }

            // Push each item related to this order into the items array
            ordersMap[row.order_id].items.push({
                product_id: row.product_id,
                product_name: row.name,
                product_price: row.price,
                stock_quantity: row.stock_quantity,
                main_image_url: row.main_image_url,
                order_quantity: row.quantity,
                order_item_price: row.order_item_price
            });
        });

        // Convert the ordersMap back into an array
        const ordersArray = Object.values(ordersMap);

        // Get the total number of orders
        const totalOrders = ordersArray.length;

        // Send the response
        res.status(200).json({
            message: 'All orders',
            totalOrders: totalOrders,
            orders: ordersArray
        });
    });
});

// get orders based on user id (client)
router.get('/:user_id', (req, res) => {
    const user_id = req.params.user_id;
    const getOrderQuery = `SELECT 
                                orders.order_id,
                                orders.user_id,
                                orders.amount,
                                orders.status,
                                orderitems.product_id,
                                products.name,
                                products.price,
                                products.stock_quantity,
                                products.main_image_url,
                                orderitems.quantity,
                                orderitems.price AS order_item_price
                            FROM orders
                            JOIN orderitems ON orders.order_id = orderitems.order_id
                            JOIN products ON orderitems.product_id = products.product_id
                            WHERE user_id = ?`;
    connection.query(getOrderQuery, [user_id], (err, result) => {
        // Create a structure where each order has an array of items
        const ordersMap = {};
        
        result.forEach(row => {
            // Check if the order already exists in the ordersMap
            if (!ordersMap[row.order_id]) {
                ordersMap[row.order_id] = {
                    order_id: row.order_id,
                    user_id: row.user_id,
                    amount: row.amount,
                    status: row.status,
                    items: [] 
                };
            }

            // Push each item related to this order into the items array
            ordersMap[row.order_id].items.push({
                product_id: row.product_id,
                product_name: row.name,
                product_price: row.price,
                stock_quantity: row.stock_quantity,
                main_image_url: row.main_image_url,
                order_quantity: row.quantity,
                order_item_price: row.order_item_price
            });
        });

        // Convert the ordersMap back into an array
        const ordersArray = Object.values(ordersMap);

        // Get the total number of orders
        const totalOrders = ordersArray.length;

        // Send the response
        res.status(200).json({
            message: 'All orders',
            totalOrders: totalOrders,
            orders: ordersArray
        });
    });
});

// cancel order (client)
router.put('/user/:order_id', (req, res) => {
    const order_id = req.params.order_id;
    const status = 'canceled';
    const updateStatusQuery = `UPDATE orders SET status = ? WHERE order_id = ?`;

    connection.query(updateStatusQuery, [status, order_id], (err, result) => {
        if (err) {
            res.status(500).send({
                message: 'Error changing status',
                err
            });
        } if (result.affectedRows > 0) {
            res.status(201).json({
                message: 'Status updated successfully',
                result
            });
        } else {
            res.status(404).send({
                message: 'No order found'
            });
        }
    });    
});

// change order status (admin)
router.put('/:order_id', (req, res) => {
    const order_id = req.params.order_id;
    const status = req.body;
    const updateStatusQuery = `UPDATE orders SET status = ? WHERE order_id = ?`;

    connection.query(updateStatusQuery, [status, order_id], (err, result) => {
        if (err) {
            res.status(500).send({
                message: 'Error changing status',
                err
            });
        } if (result.affectedRows > 0) {
            res.status(201).json({
                message: 'Status updated successfully',
                result
            });
        } else {
            res.status(404).send({
                message: 'No order found'
            });
        }
    });
});

// delete order permanently (admin)
router.delete('/:order_id', (req, res) => {
    const order_id = req.params.order_id;

    // delete order items
    const deleteOrderItemsQuery = `DELETE FROM orderitems WHERE order_id = ?`;
    connection.query(deleteOrderItemsQuery, [order_id], (err, result) => {
        if (err) {
            res.status(500).send({
                message: 'Error deleting order items',
                err
            });
        }

        // delete order
        const deleteOrderQuery = `DELETE FROM orders WHERE order_id = ?`;
        connection.query(deleteOrderQuery, [order_id], (err, result) => {
            if (err) {
                res.status(500).send({
                    message: 'Error deleting order',
                    err
                });
            } if (result.affectedRows > 0) {
                res.status(201).send({
                    message: 'Order and it items deleted successfully'
                });
            } else {
                res.status(404).send({
                    message: 'No order found'
                });
            }
        });
    });
});

module.exports = router;