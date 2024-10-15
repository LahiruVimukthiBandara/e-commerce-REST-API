require('dotenv/config');
const express = require('express');
const cors = require('cors');
const connection = require('./db-connection');
const bodyParser = require('body-parser');

const cartRoutes = require('./Routes/cart');
const loginRoutes = require('./Routes/login');
const orderRoutes = require('./Routes/orders');
const userRoutes = require('./Routes/register');
const reviewRoutes = require('./Routes/reviews');
const productRoutes = require('./Routes/product');
const addressRoutes = require('./Routes/address');
const categoryRoutes = require('./Routes/category');

const PORT = process.env.APP_PORT || 3000;
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

app.use('/uploads', express.static('uploads'));

app.use('/cart', cartRoutes);
app.use('/user', userRoutes);
app.use('/order', orderRoutes);
app.use('/login', loginRoutes);
app.use('/review', reviewRoutes);
app.use('/address', addressRoutes);
app.use('/product', productRoutes);
app.use('/category', categoryRoutes);

app.listen(PORT, (err) => {
    if (err) {
        console.log('error connecting to database', err);
    } else {
        console.log(`Server is running on port ${PORT}`);
    }
});
