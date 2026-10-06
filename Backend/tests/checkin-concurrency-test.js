// checkin-concurrency-test.js

import { performance } from "perf_hooks";

// ============================================================
// Configuration
// ============================================================

const BASE_URL = "http://localhost:3000";

const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhYmJlY2IzODZkZTEyNGI3MGRmNjFjYyIsInJvbGUiOiJDVVNUT01FUiIsInNlc3Npb25JZCI6IjZhYzU0YWJmYzJjYTgwZmEzMGJkZTJiOSIsImlhdCI6MTc5MTMxNzIwOCwiZXhwIjoxNzkxMzE4MTA4fQ.b_YkiK6CDqdBV-UhW07Ey3p_9MkVGohBTERCj9mTNMs";

// Maximum 100 appointments
const APPOINTMENT_IDS = [
    "QL-20261007-5BFE57",
        "QL-20261007-4023A9",
        "QL-20261007-1F785C",
        "QL-20261007-3126A8",
        "QL-20261007-099693",
        "QL-20261007-C82E7D",
        "QL-20261007-639828",
        "QL-20261007-D28CB4",
        "QL-20261007-338600",
        "QL-20261007-528BD0",
        "QL-20261007-FFE0EF",
        "QL-20261007-51D9AF",
        "QL-20261007-0BBA0C",
        "QL-20261007-F85A65",
        "QL-20261007-04FD21",
        "QL-20261007-0555CA",
        "QL-20261007-0E0779",
        "QL-20261007-624EC9",
        "QL-20261007-284408",
        "QL-20261007-8ED6EA"
];

const TOTAL_REQUESTS = APPOINTMENT_IDS.length;

// ============================================================
// Check-in Appointment
// ============================================================

const checkInAppointment = async (appointmentId, index) => {
    const startTime = performance.now();

    try {
        const response = await fetch(
            `${BASE_URL}/api/v1/appointments/${appointmentId}/check-in`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${ACCESS_TOKEN}`
                }
            }
        );

        const data = await response.json();

        const duration =
            performance.now() - startTime;

        return {
            index,
            appointmentId,
            status: response.status,
            duration,
            data
        };

    } catch (error) {
        const duration =
            performance.now() - startTime;

        return {
            index,
            appointmentId,
            status: "NETWORK_ERROR",
            duration,
            error: error.message
        };
    }
};

// ============================================================
// Calculate latency statistics
// ============================================================

const calculateLatency = (durations) => {
    if (durations.length === 0) {
        return {
            average: 0,
            p95: 0,
            p99: 0,
            min: 0,
            max: 0
        };
    }

    const sorted = [...durations].sort(
        (a, b) => a - b
    );

    const total = sorted.reduce(
        (sum, duration) => sum + duration,
        0
    );

    const average = total / sorted.length;

    const p95Index =
        Math.ceil(sorted.length * 0.95) - 1;

    const p99Index =
        Math.ceil(sorted.length * 0.99) - 1;

    return {
        average,
        p95: sorted[p95Index],
        p99: sorted[p99Index],
        min: sorted[0],
        max: sorted[sorted.length - 1]
    };
};

// ============================================================
// Format latency
// ============================================================

const formatMs = (value) => {
    return `${value.toFixed(2)} ms`;
};

// ============================================================
// Validate token generation
// ============================================================

const validateTokens = (successfulResults) => {
    const tokens = successfulResults
        .map(result => result.data?.data?.tokenNumber)
        .filter(token => typeof token === "number");

    console.log(
        "\n------------- TOKEN VALIDATION -------------\n"
    );

    console.log(
        "Successful check-ins :", successfulResults.length
    );

    console.log(
        "Tokens received      :", tokens.length
    );

    if (tokens.length === 0) {
        console.log("✗ No tokens received");
        return;
    }

    const uniqueTokens = new Set(tokens);

    console.log(
        "Unique tokens        :", uniqueTokens.size
    );

    const sortedTokens = [...uniqueTokens].sort(
        (a, b) => a - b
    );

    console.log(
        "Minimum token        :", sortedTokens[0]
    );

    console.log(
        "Maximum token        :",
        sortedTokens[sortedTokens.length - 1]
    );

    // Check duplicates
    if (uniqueTokens.size !== tokens.length) {
        console.log("✗ Duplicate tokens detected");
    } else {
        console.log("✓ No duplicate tokens");
    }

    // Check sequence
    const expectedTokens = Array.from(
        { length: tokens.length },
        (_, index) => index + 1
    );

    const isSequential =
        sortedTokens.length === expectedTokens.length &&
        sortedTokens.every(
            (token, index) =>
                token === expectedTokens[index]
        );

    if (isSequential) {
        console.log(
            "✓ Tokens are sequential: 1 →",
            tokens.length
        );
    } else {
        console.log("✗ Token sequence is incorrect");

        console.log(
            "Received tokens:",
            sortedTokens
        );

        const missingTokens =
            expectedTokens.filter(
                token => !uniqueTokens.has(token)
            );

        if (missingTokens.length > 0) {
            console.log(
                "Missing tokens:",
                missingTokens
            );
        }
    }

    console.log(
        "\nTokens:",
        sortedTokens.join(", ")
    );
};

// ============================================================
// Run Test
// ============================================================

const runTest = async () => {

    if (TOTAL_REQUESTS === 0) {
        console.log(
            "No appointment IDs provided."
        );
        return;
    }

    if (TOTAL_REQUESTS > 100) {
        console.log(
            "Maximum 100 check-in requests are allowed."
        );
        return;
    }

    console.log(
        "\n========== CHECK-IN CONCURRENCY TEST ==========\n"
    );

    console.log(
        "Target:",
        `${BASE_URL}/api/v1/appointments/:appointmentId/check-in`
    );

    console.log(
        "Total requests:",
        TOTAL_REQUESTS
    );

    console.log(
        "Requests will be sent concurrently...\n"
    );

    const testStart =
        performance.now();

    // --------------------------------------------------------
    // Send all check-in requests concurrently
    // --------------------------------------------------------

    const results = await Promise.all(
        APPOINTMENT_IDS.map(
            (appointmentId, index) =>
                checkInAppointment(
                    appointmentId,
                    index
                )
        )
    );

    const testDuration =
        performance.now() - testStart;

    // ========================================================
    // Categorize responses
    // ========================================================

    const successful =
        results.filter(
            result => result.status === 200
        );

    const conflicts =
        results.filter(
            result => result.status === 409
        );

    const badRequests =
        results.filter(
            result => result.status === 400
        );

    const unauthorized =
        results.filter(
            result => result.status === 401
        );

    const rateLimited =
        results.filter(
            result => result.status === 429
        );

    const serverErrors =
        results.filter(
            result =>
                typeof result.status === "number" &&
                result.status >= 500
        );

    const networkErrors =
        results.filter(
            result =>
                result.status === "NETWORK_ERROR"
        );

    const other =
        results.filter(
            result =>
                ![
                    200,
                    400,
                    401,
                    409,
                    429
                ].includes(result.status) &&
                result.status !== "NETWORK_ERROR" &&
                !(
                    typeof result.status === "number" &&
                    result.status >= 500
                )
        );

    // ========================================================
    // Latency
    // ========================================================

    const allDurations =
        results.map(
            result => result.duration
        );

    const successfulDurations =
        successful.map(
            result => result.duration
        );

    const conflictDurations =
        conflicts.map(
            result => result.duration
        );

    const serverErrorDurations =
        serverErrors.map(
            result => result.duration
        );

    const overallLatency =
        calculateLatency(allDurations);

    const successLatency =
        calculateLatency(successfulDurations);

    const conflictLatency =
        calculateLatency(conflictDurations);

    const serverErrorLatency =
        calculateLatency(serverErrorDurations);

    // ========================================================
    // Results
    // ========================================================

    console.log(
        "\n================ RESULTS ================\n"
    );

    console.log(
        "Total requests       :",
        TOTAL_REQUESTS
    );

    console.log(
        "Successful check-ins :",
        successful.length
    );

    console.log(
        "Bad requests         :",
        badRequests.length
    );

    console.log(
        "Unauthorized         :",
        unauthorized.length
    );

    console.log(
        "Conflict responses   :",
        conflicts.length
    );

    console.log(
        "Rate limited         :",
        rateLimited.length
    );

    console.log(
        "Server errors        :",
        serverErrors.length
    );

    console.log(
        "Network errors       :",
        networkErrors.length
    );

    console.log(
        "Other responses      :",
        other.length
    );

    // ========================================================
    // Overall latency
    // ========================================================

    console.log(
        "\n------------- OVERALL LATENCY -------------\n"
    );

    console.log(
        "Average              :",
        formatMs(overallLatency.average)
    );

    console.log(
        "P95                  :",
        formatMs(overallLatency.p95)
    );

    console.log(
        "P99                  :",
        formatMs(overallLatency.p99)
    );

    console.log(
        "Minimum              :",
        formatMs(overallLatency.min)
    );

    console.log(
        "Maximum              :",
        formatMs(overallLatency.max)
    );

    // ========================================================
    // Successful check-in latency
    // ========================================================

    if (successful.length > 0) {

        console.log(
            "\n--------- SUCCESSFUL CHECK-IN LATENCY ---------\n"
        );

        console.log(
            "Successful requests  :",
            successful.length
        );

        console.log(
            "Average              :",
            formatMs(successLatency.average)
        );

        console.log(
            "P95                  :",
            formatMs(successLatency.p95)
        );

        console.log(
            "P99                  :",
            formatMs(successLatency.p99)
        );

        console.log(
            "Minimum              :",
            formatMs(successLatency.min)
        );

        console.log(
            "Maximum              :",
            formatMs(successLatency.max)
        );
    }

    // ========================================================
    // Conflict latency
    // ========================================================

    if (conflicts.length > 0) {

        console.log(
            "\n----------- CONFLICT LATENCY -----------\n"
        );

        console.log(
            "Conflict requests    :",
            conflicts.length
        );

        console.log(
            "Average              :",
            formatMs(conflictLatency.average)
        );

        console.log(
            "P95                  :",
            formatMs(conflictLatency.p95)
        );

        console.log(
            "P99                  :",
            formatMs(conflictLatency.p99)
        );
    }

    // ========================================================
    // Token validation
    // ========================================================

    validateTokens(successful);

    // ========================================================
    // Test duration
    // ========================================================

    console.log(
        "\n------------- TEST DURATION -------------\n"
    );

    console.log(
        "Total test time      :",
        formatMs(testDuration)
    );

    // ========================================================
    // Atomicity check
    // ========================================================

    console.log(
        "\n------------- ATOMICITY CHECK -------------\n"
    );

    if (
        serverErrors.length === 0 &&
        networkErrors.length === 0 &&
        successful.length === TOTAL_REQUESTS
    ) {
        console.log(
            "✓ All check-in requests completed successfully"
        );

        console.log(
            "✓ No server/network errors detected"
        );

        console.log(
            "✓ All appointments received a token"
        );

    } else {

        console.log(
            "✗ Check-in concurrency test failed"
        );

        if (serverErrors.length > 0) {
            console.log(
                `✗ ${serverErrors.length} server errors detected`
            );
        }

        if (networkErrors.length > 0) {
            console.log(
                `✗ ${networkErrors.length} network errors detected`
            );
        }

        if (successful.length !== TOTAL_REQUESTS) {
            console.log(
                `✗ Expected ${TOTAL_REQUESTS} successful check-ins but received ${successful.length}`
            );
        }
    }

    // ========================================================
    // Print server errors
    // ========================================================

    if (serverErrors.length > 0) {

        console.log(
            "\n----------- SERVER ERRORS -----------\n"
        );

        serverErrors
            .slice(0, 10)
            .forEach(result => {

                console.log({
                    index: result.index,
                    appointmentId: result.appointmentId,
                    status: result.status,
                    duration:
                        `${result.duration.toFixed(2)} ms`,
                    data: result.data
                });

            });
    }

    // ========================================================
    // Print non-success responses
    // ========================================================

    if (
        badRequests.length > 0 ||
        conflicts.length > 0 ||
        unauthorized.length > 0 ||
        rateLimited.length > 0 ||
        other.length > 0
    ) {

        console.log(
            "\n----------- NON-SUCCESS RESPONSES -----------\n"
        );

        results
            .filter(
                result => result.status !== 200
            )
            .slice(0, 20)
            .forEach(result => {

                console.log({
                    index: result.index,
                    appointmentId: result.appointmentId,
                    status: result.status,
                    data: result.data
                });

            });
    }

    console.log(
        "\n============================================\n"
    );
};

runTest();