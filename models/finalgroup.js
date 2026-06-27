const groupSchema = new Schema({
    leader: {
        type: Schema.Types.ObjectId,
        ref: "usermodel"
    },

    members: [{
        type: Schema.Types.ObjectId,
        ref: "usermodel"
    }],

    platform: {
        type: Schema.Types.ObjectId,
        ref: "platform"
    },

    startDate: {
        type: Date,
        required: true
    },

    expiryDate: {
        type: Date,
        required: true
    },
     createdAt:{
        type:Date,
        default:Date.now
    },

    
    
});