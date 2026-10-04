const getAppointmentConfirmationText = ({
    name,
    email,
    phone,
    serviceName,
    appointmentDate,
    appointmentId,
    joinQueueUrl
}) => {
    return `
QueueLess - Appointment Confirmation

Hello ${name},

Your appointment has been successfully booked.

Appointment Details
-------------------
Appointment ID: ${appointmentId}
Service: ${serviceName}
Appointment Date: ${appointmentDate}
Status: BOOKED

Customer Details
----------------
Name: ${name}
Email: ${email}
Phone: ${phone}

Join Queue:
${joinQueueUrl}

Important:
Your queue token will be generated only when you join the virtual queue
on the appointment date.

Please keep your Appointment ID safe for check-in.

Thank you for using QueueLess.
    `.trim();
};

export default getAppointmentConfirmationText;