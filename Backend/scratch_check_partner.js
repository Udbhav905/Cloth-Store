import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const partnerSchema = new mongoose.Schema({
    name: String,
    status: String,
    availability: {
        isAvailable: Boolean,
        currentLocation: {
            lat: Number,
            lng: Number
        },
        lastUpdated: Date
    }
}, { strict: false });

const DeliveryPartner = mongoose.model('DeliveryPartner', partnerSchema);

async function checkPartner() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const partner = await DeliveryPartner.findById('69d12c97579ca4146d46d575');
        if (partner) {
            console.log('Partner found:');
            console.log(JSON.stringify(partner, null, 2));
        } else {
            console.log('Partner not found');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkPartner();
