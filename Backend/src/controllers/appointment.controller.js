import {createAppointment as createAppointmentService} from "../services/appointment.service.js";
import {successResponse} from "../utils/apiResponse.js";





//function to create appointment

export async function createAppointment(req, res, next) {
    try {
        const { serviceId, availabilityId } = req.params;

        const result = await createAppointmentService({
            userId: req.user.id,
            serviceId,
            availabilityId,
            idempotencyKey: req.headers["idempotency-key"]
        });

        return successResponse(res, {
            statusCode: result.statusCode,
            message: result.idempotent
                ? "Appointment already booked"
                : "Appointment booked successfully",
            data: result.data
        });

    } catch (error) {
        next(error);
    }
}