import express from "express"
import * as appointmentFunction from "../controllers/appointment.controller.js"
import * as appointmentLimiter from "../middlewares/rateLimiting/appointmentLimit.js"

import authenticate from "../middlewares/auth.middleware.js"
import { authorizeRoles } from "../middlewares/role.middleware.js"
import {validate} from "../middlewares/validate.middleware.js"
import { createAppointmentSchema, appointmentParamsSchema } from "../validations/appointment.validation.js"



const router = express.Router()

//POST /api/v1/appointments/:appointmentId/check-in
router.post(
    "/:appointmentId/check-in",
    authenticate,
    authorizeRoles("CUSTOMER"),
    appointmentLimiter.checkInLimiter,
    validate(appointmentParamsSchema, "params"),
    appointmentFunction.checkInAppointment
)

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
router.get(
    "/",
    authenticate,
    authorizeRoles("CUSTOMER"),
    appointmentLimiter.getAppointmentsLimiter,
    appointmentFunction.getAppointments
)


//GET /api/v1/appointments/:appointmentId
router.get(
    "/:appointmentId",
    authenticate,
    authorizeRoles("CUSTOMER"),
    appointmentLimiter.getAppointmentsLimiter,
    validate(appointmentParamsSchema, "params"),
    appointmentFunction.getAppointmentById
)


//PATCH /api/v1/appointments/:appointmentId/cancel
router.patch(
    "/:appointmentId/cancel",
    authenticate,
    authorizeRoles("CUSTOMER"),
    appointmentLimiter.cancelAppointmentLimiter,
    validate(appointmentParamsSchema, "params"),
    appointmentFunction.cancelAppointment
)



export default router