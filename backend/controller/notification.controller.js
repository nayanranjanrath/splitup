import notificationmodel from "../models/notification.model";

export const getnotification = async (req, res) => {

    try {

        const userid = req.userId;

        const notifications = await notificationmodel.find({

            user: userid,

            seen: false

        }).sort({ createdAt: -1 });


        if (notifications.length === 0) {

            return res.status(200).json({

                success: true,

                notifications: []

            });

        }


        await notificationmodel.updateMany(

            {

                user: userid,

                seen: false

            },

            {

                $set: {

                    seen: true

                }

            }

        );


        return res.status(200).json({

            success: true,

            notifications

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });

    }

}


export const getnotificationcount = async (req, res) => {

    try {

        const userid = req.userId;

        const notifications = await notificationmodel.find({

            user: userid,

            seen: false

        }).select("_id");


        return res.status(200).json({

            success: true,

            notifications: notifications.length

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });

    }

}