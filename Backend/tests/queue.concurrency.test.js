import { jest } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";

import app from "../src/app.js";
import { connectDB } from "../src/config/db.js";

import Queue from "../src/models/queue.model.js";
import QueueEntry from "../src/models/queueEntry.model.js";
import Counter from "../src/models/counter.model.js";
import User from "../src/models/user.model.js";

import config from "../src/config/env.js";
import { generateAccessToken } from "../src/utils/jwt.js";

jest.setTimeout(30000);

beforeAll(async () => {
    await connectDB();
});

describe("Staff queue concurrency", () => {
    const queueId = config.testQueueId;
    let staff1Token;
    let staff2Token;

    beforeAll(async () => {
        if (!queueId) {
            throw new Error("TEST_QUEUE_ID is not defined");
        }

        const counters = await Counter.find({
            isActive: true,
            assignedStaffId: { $ne: null }
        })
            .sort({ _id: 1 })
            .limit(2)
            .select("assignedStaffId");

        if (counters.length < 2) {
            throw new Error(
                "At least two active counters with assigned staff are required"
            );
        }

        const staff = await User.find({
            _id: { $in: counters.map((counter) => counter.assignedStaffId) },
            role: { $in: ["STAFF", "ADMIN"] },
            isActive: true
        }).select("_id role email");

        if (staff.length < 2) {
            throw new Error(
                "At least two active staff users assigned to counters are required"
            );
        }

        const createToken = (user) =>
            generateAccessToken({
                id: user._id.toString(),
                role: user.role,
                email: user.email
            });

        staff1Token = createToken(staff[0]);
        staff2Token = createToken(staff[1]);
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    test(
        "two different counters calling next simultaneously should receive different tokens",
        async () => {
            /*
             * --------------------------------------------------
             * 1. Verify queue exists
             * --------------------------------------------------
             */

            const queue = await Queue.findOne({
                _id: queueId,
                status: "ACTIVE"
            });

            expect(queue).not.toBeNull();

            await QueueEntry.updateMany(
                {
                    queueId,
                    status: { $in: ["CALLED", "SERVING"] }
                },
                {
                    $set: {
                        status: "WAITING",
                        counterId: null,
                        calledAt: null,
                        servingAt: null
                    }
                }
            );

            /*
             * --------------------------------------------------
             * 2. Get waiting entries before concurrency test
             * --------------------------------------------------
             */

            const waitingEntriesBefore = await QueueEntry.find({
                queueId,
                status: "WAITING"
            })
                .sort({ tokenNumber: 1 })
                .limit(2)
                .select("_id tokenNumber counterId status");

            expect(waitingEntriesBefore.length).toBeGreaterThanOrEqual(2);

            /*
             * --------------------------------------------------
             * 3. Make sure these tokens are actually waiting
             * --------------------------------------------------
             */

            console.log(
                "\nWaiting entries before test:",
                waitingEntriesBefore.map((entry) => ({
                    id: entry._id.toString(),
                    tokenNumber: entry.tokenNumber,
                    status: entry.status,
                    counterId: entry.counterId
                }))
            );

            /*
             * --------------------------------------------------
             * 4. Send both requests simultaneously
             * --------------------------------------------------
             */

            // const [response1, response2] = await Promise.all([
            //     request(app)
            //         .post(`/api/v1/queue/${queueId}/call-next`)
            //         .set(
            //             "Authorization",
            //             `Bearer ${staff1Token}`
            //         ),

            //     request(app)
            //         .post(`/api/v1/queue/${queueId}/call-next`)
            //         .set(
            //             "Authorization",
            //             `Bearer ${staff2Token}`
            //         )
            // ]);


            console.log("Starting concurrent requests...");

            const request1 = request(app)
                .post(`/api/v1/queue/${queueId}/call-next`)
                .set("Authorization", `Bearer ${staff1Token}`)
                .then((response) => {
                    console.log("Counter 1 request completed");
                    return response;
                });

            const request2 = request(app)
                .post(`/api/v1/queue/${queueId}/call-next`)
                .set("Authorization", `Bearer ${staff2Token}`)
                .then((response) => {
                    console.log("Counter 2 request completed");
                    return response;
                });

            console.log("Both requests dispatched");

            const [response1, response2] = await Promise.all([
                request1,
                request2
            ]);

            console.log("Both requests completed");

            /*
             * --------------------------------------------------
             * 5. Print responses for debugging
             * --------------------------------------------------
             */

            console.log("\nCounter 1 response:");
            console.log(response1.body);

            console.log("\nCounter 2 response:");
            console.log(response2.body);

            /*
             * --------------------------------------------------
             * 6. Both operations should succeed
             * --------------------------------------------------
             */

            expect(response1.statusCode).toBe(200);
            expect(response2.statusCode).toBe(200);

            /*
             * --------------------------------------------------
             * 7. Extract token/counter information
             * --------------------------------------------------
             */

            const result1 = response1.body.data;
            const result2 = response2.body.data;

            expect(result1).toBeDefined();
            expect(result2).toBeDefined();

            const token1 = result1.tokenNumber;
            const token2 = result2.tokenNumber;

            const counterId1 = result1.counterId;
            const counterId2 = result2.counterId;

            /*
             * --------------------------------------------------
             * 8. Tokens must be different
             * --------------------------------------------------
             */

            expect(token1).not.toBe(token2);

            /*
             * --------------------------------------------------
             * 9. Counters must be different
             * --------------------------------------------------
             */

            expect(counterId1).not.toBe(counterId2);

            /*
             * --------------------------------------------------
             * 10. Token numbers should be numeric
             * --------------------------------------------------
             */

            expect(typeof token1).toBe("number");
            expect(typeof token2).toBe("number");

            /*
             * --------------------------------------------------
             * 11. Verify database state
             * --------------------------------------------------
             */

            const calledEntries = await QueueEntry.find({
                queueId,
                status: "CALLED",
                tokenNumber: {
                    $in: [token1, token2]
                }
            }).select(
                "_id queueId tokenNumber status counterId appointmentId"
            );

            expect(calledEntries).toHaveLength(2);

            /*
             * --------------------------------------------------
             * 12. Verify token uniqueness in database
             * --------------------------------------------------
             */

            const databaseTokens = calledEntries.map(
                (entry) => entry.tokenNumber
            );

            expect(new Set(databaseTokens).size).toBe(2);

            /*
             * --------------------------------------------------
             * 13. Verify counter uniqueness in database
             * --------------------------------------------------
             */

            const databaseCounters = calledEntries.map(
                (entry) => entry.counterId.toString()
            );

            expect(new Set(databaseCounters).size).toBe(2);

            /*
             * --------------------------------------------------
             * 14. Verify every active entry has a counter
             * --------------------------------------------------
             */

            for (const entry of calledEntries) {
                expect(entry.counterId).not.toBeNull();
                expect(entry.status).toBe("CALLED");
            }

            /*
             * --------------------------------------------------
             * 15. Print final result
             * --------------------------------------------------
             */

            console.log("\n================================");
            console.log("QUEUE CONCURRENCY TEST RESULT");
            console.log("================================");

            console.log(
                `Counter 1 → Token ${token1} → ${counterId1}`
            );

            console.log(
                `Counter 2 → Token ${token2} → ${counterId2}`
            );

            console.log("================================\n");
        }
    );
});