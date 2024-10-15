const express = require('express');
const router = express.Router();
const connection = require('../db-connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// login
router.post('/', (req, res) => {
    const getUserQuery = `SELECT * FROM users WHERE email = ?`;

    connection.query(getUserQuery, req.body.email, (err, result) => {
        if (err) {
            res.status(500).send({
                message: 'Error getting User'
            });
        }
        const checkPassword = bcrypt.compareSync(req.body.password, result[0].password);
        console.log(result, req.body.password);
        if (!checkPassword) {
           return res.status(400).json({
                message: 'Wrong email or  password'
            });
        } else {
            res.status(200).send({
                message: 'login success'
            });
        }

        const token = jwt.sign({id:result[0].user_id}, "secretKey");
        const {password, ...others} = result[0]
        res.cookie("accessToken", token, {
            httpOnly : true
        }).status(200).json(others);
    });
});

module.exports = router;