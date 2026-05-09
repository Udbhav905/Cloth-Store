import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'd:/MCA/SEM-2/Cloth_Store/Backend/.env' });

const orderSchema = new mongoose.Schema({
    orderNumber: String,
    orderStatus: String,
    deliveryPartnerId: mongoose.Schema.Types.ObjectId,
    courierName: String,
    liveLocation: {
        lat: Number,
        lng: Number,
        lastUpdated: Date
    }
}, { strict: false });

const Order = mongoose.model('Order', orderSchema);

async function checkOrder() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const order = await Order.findOne({ orderNumber: 'ORD2605090069' });
        if (order) {
            console.log('Order found:');
            console.log(JSON.stringify(order, null, 2));
        } else {
            console.log('Order not found');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkOrder();
