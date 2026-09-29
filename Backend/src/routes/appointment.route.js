import express from "express"
import * as appointmentFunction from "../controllers/appointment.controller.js"
import * as appointmentLimiter from "../middlewares/rateLimiting/appointmentLimit.js"

import authenticate from "../middlewares/auth.middleware.js"
import { authorizeRoles } from "../middlewares/role.middleware.js"
import {validate} from "../middlewares/validate.middleware.js"
import { createAppointmentSchema, appointmentParamsSchema } from "../validations/appointment.validation.js"



const router = express.Router()

//POST /api/v1/appointments/:serviceId/:availabilityId
router.post(
    "/:serviceId/:availabilityId",
    authenticate,
    authorizeRoles("CUSTOMER"),
    appointmentLimiter.bookAppointmentLimiter,
    validate(createAppointmentSchema, "params"),
    appointmentFunction.createAppointment
)


//GET /api/v1/appointments/


//GET /api/v1/appointments/:appointmentId


//PATCH /api/v1/appointments/:appointmentId/cancel


export default router