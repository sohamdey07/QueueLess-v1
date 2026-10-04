const getAppointmentConfirmationHtml = ({
    name,
    email,
    phone,
    serviceName,
    appointmentDate,
    appointmentId
}) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Confirmation</title>
    </head>

    <body style="
        margin: 0;
        padding: 0;
        background-color: #f5f7fa;
        font-family: Arial, Helvetica, sans-serif;
        color: #333333;
    ">

        <div style="
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        ">

            <!-- Header -->
            <div style="
                background-color: #007bff;
                padding: 25px;
                text-align: center;
                color: #ffffff;
            ">
                <h1 style="
                    margin: 0;
                    font-size: 28px;
                ">
                    QueueLess
                </h1>

                <p style="
                    margin: 8px 0 0;
                    font-size: 15px;
                ">
                    Book your queue. Get served effortlessly.
                </p>
            </div>

            <!-- Content -->
            <div style="padding: 30px;">

                <h2 style="
                    margin-top: 0;
                    color: #222222;
                    font-size: 22px;
                ">
                    Appointment Confirmed 🎉
                </h2>

                <p style="
                    font-size: 16px;
                    line-height: 1.6;
                    color: #555555;
                ">
                    Hello <strong>${name}</strong>,
                </p>

                <p style="
                    font-size: 15px;
                    line-height: 1.6;
                    color: #555555;
                ">
                    Your appointment has been successfully booked.
                    Please keep the appointment details below for your reference.
                </p>

                <!-- Appointment Details -->
                <div style="
                    margin: 25px 0;
                    padding: 20px;
                    background-color: #f8f9fa;
                    border-radius: 10px;
                    border: 1px solid #e5e7eb;
                ">

                    <h3 style="
                        margin-top: 0;
                        margin-bottom: 18px;
                        color: #222222;
                        font-size: 18px;
                    ">
                        Appointment Details
                    </h3>

                    <p style="margin: 10px 0;">
                        <strong>Appointment ID:</strong><br>
                        <span style="color: #007bff;">
                            ${appointmentId}
                        </span>
                    </p>

                    <p style="margin: 10px 0;">
                        <strong>Service:</strong><br>
                        ${serviceName}
                    </p>

                    <p style="margin: 10px 0;">
                        <strong>Appointment Date:</strong><br>
                        ${appointmentDate}
                    </p>

                    <p style="margin: 10px 0;">
                        <strong>Status:</strong><br>
                        <span style="color: #198754;">
                            BOOKED
                        </span>
                    </p>

                </div>

                <!-- Customer Details -->
                <div style="
                    margin: 25px 0;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 10px;
                    border: 1px solid #e5e7eb;
                ">

                    <h3 style="
                        margin-top: 0;
                        margin-bottom: 18px;
                        color: #222222;
                        font-size: 18px;
                    ">
                        Customer Details
                    </h3>

                    <p style="margin: 10px 0;">
                        <strong>Name:</strong> ${name}
                    </p>

                    <p style="margin: 10px 0;">
                        <strong>Email:</strong> ${email}
                    </p>

                    <p style="margin: 10px 0;">
                        <strong>Phone:</strong> ${phone}
                    </p>

                </div>


                <!-- Important Note -->
                <div style="
                    margin-top: 25px;
                    padding: 15px;
                    background-color: #fff8e1;
                    border-left: 4px solid #ffc107;
                    border-radius: 5px;
                ">

                    <p style="
                        margin: 0;
                        font-size: 14px;
                        line-height: 1.6;
                        color: #665c3b;
                    ">
                        <strong>Important:</strong>
                        Your queue token will be generated only when
                        you join the virtual queue on the appointment date.
                    </p>

                </div>

                <p style="
                    margin-top: 30px;
                    font-size: 14px;
                    line-height: 1.6;
                    color: #777777;
                    text-align: center;
                ">
                    Please keep your Appointment ID safe for check-in.
                </p>

            </div>

            <!-- Footer -->
            <div style="
                padding: 20px;
                background-color: #f8f9fa;
                text-align: center;
                border-top: 1px solid #eeeeee;
            ">

                <p style="
                    margin: 0;
                    font-size: 13px;
                    color: #888888;
                ">
                    This is an automated email from QueueLess.
                    Please do not reply to this email.
                </p>

                <p style="
                    margin: 8px 0 0;
                    font-size: 13px;
                    color: #888888;
                ">
                    © ${new Date().getFullYear()} QueueLess
                </p>

            </div>

        </div>

    </body>
    </html>
    `;
};

export default getAppointmentConfirmationHtml;