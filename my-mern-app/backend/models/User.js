import mongoose from 'mongoose';
const { Schema } = mongoose;

const userSchema = new Schema({
    email: {
        type: String,
        required: true, 
        unique: true,    
        lowercase: true, //always saves emails in lowercase
      },
    
    password: {
        type: String,
        //not required due to GoogleoAuth users
    },

    googleId: {
        type: String,
    },

    profilePicture: {
        type: String, //Stores URL of picture
    },

    major: {
        type: String,
    },

    grade: {
        type: String, //Either freshman, sophomore etc, or mastesrs, pHD etc
    }
});

module.exports = mongoose.model("User", userSchema);
