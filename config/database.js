const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb:
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

    } catch (error) {
        process.exit(1);
    }
};

module.exports = connectDB;
