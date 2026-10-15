import crypto from "crypto";
import { performance } from "perf_hooks";


// ============================================================
// Configuration
// ============================================================

const BASE_URL = "http://localhost:3000";

const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhYmJlY2IzODZkZTEyNGI3MGRmNjFjYyIsInJvbGUiOiJDVVNUT01FUiIsInNlc3Npb25JZCI6IjZhY2M4MTZkNGRjYmU5ZmFjYjE4ZjA5ZiIsImlhdCI6MTc5MTc4NzM3MywiZXhwIjoxNzkxNzg4MjczfQ.wshTpDR5kKtN-wLU0264EkRYwUnhXzbKS2MCaLkEmlk"; // Replace with a valid access token from your authentication system

const SERVICE_ID = "6aba9a62580e7fb99ac84c99"; // Replace with a valid service ID from your database

const AVAILABILITY_ID = "6acbd709ef607685d99794eb"; // Replace with a valid availability ID from your database

// Change this for different concurrency tests
const TOTAL_REQUESTS = 20;


// ============================================================
// Book Appointment
// ============================================================

const bookAppointment = async (index) => {

    const idempotencyKey = crypto.randomUUID();

    const startTime = performance.now();

    try {

        const response = await fetch(
            `${BASE_URL}/api/v1/appointments/${SERVICE_ID}/${AVAILABILITY_ID}`,
            {
                method: "POST",

                headers: {
                    "Authorization": `Bearer ${ACCESS_TOKEN}`,
                    "Idempotency-Key": idempotencyKey
                }
            }
        );


        const data = await response.json();

        const duration =
            performance.now() - startTime;


        return {
            index,
            status: response.status,
            duration,
            data
        };

    } catch (error) {

        const duration =
            performance.now() - startTime;


        return {
            index,
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


    const sorted =
        [...durations].sort(
            (a, b) => a - b
        );


    const total =
        sorted.reduce(
            (sum, duration) => sum + duration,
            0
        );


    const average =
        total / sorted.length;


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
// Run test
// ============================================================

const runTest = async () => {

    console.log(
        "\n========== APPOINTMENT CONCURRENCY TEST ==========\n"
    );


    console.log(
        "Target URL:",
        `${BASE_URL}/api/v1/appointments/${SERVICE_ID}/${AVAILABILITY_ID}`
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
    // Send all requests concurrently
    // --------------------------------------------------------

    const results = await Promise.all(
        Array.from(
            {
                length: TOTAL_REQUESTS
            },
            (_, index) =>
                bookAppointment(index)
        )
    );


    const testDuration =
        performance.now() - testStart;


    // ========================================================
    // Categorize responses
    // ========================================================

    const successful =
        results.filter(
            result => result.status === 201
        );


    const conflicts =
        results.filter(
            result => result.status === 409
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
                    201,
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
    // Extract latency
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


    const rateLimitedDurations =
        rateLimited.map(
            result => result.duration
        );


    const serverErrorDurations =
        serverErrors.map(
            result => result.duration
        );


    // ========================================================
    // Calculate statistics
    // ========================================================

    const overallLatency =
        calculateLatency(
            allDurations
        );


    const successLatency =
        calculateLatency(
            successfulDurations
        );


    const conflictLatency =
        calculateLatency(
            conflictDurations
        );


    const rateLimitLatency =
        calculateLatency(
            rateLimitedDurations
        );


    const serverErrorLatency =
        calculateLatency(
            serverErrorDurations
        );


    // ========================================================
    // Main result
    // ========================================================

    console.log(
        "\n================ RESULTS ================\n"
    );


    console.log(
        "Total requests       :",
        TOTAL_REQUESTS
    );


    console.log(
        "Successful bookings  :",
        successful.length
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
        "Other responses      :",
        other.length
    );


    console.log(
        "Network errors       :",
        networkErrors.length
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
    // Successful booking latency
    // ========================================================

    console.log(
        "\n--------- SUCCESSFUL BOOKING LATENCY ---------\n"
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


    // ========================================================
    // Conflict latency
    // ========================================================

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


    console.log(
        "Minimum              :",
        formatMs(conflictLatency.min)
    );


    console.log(
        "Maximum              :",
        formatMs(conflictLatency.max)
    );


    // ========================================================
    // Server error latency
    // ========================================================

    if (serverErrors.length > 0) {

        console.log(
            "\n----------- SERVER ERROR LATENCY -----------\n"
        );


        console.log(
            "Server errors        :",
            serverErrors.length
        );


        console.log(
            "Average              :",
            formatMs(serverErrorLatency.average)
        );


        console.log(
            "P95                  :",
            formatMs(serverErrorLatency.p95)
        );


        console.log(
            "P99                  :",
            formatMs(serverErrorLatency.p99)
        );
    }


    // ========================================================
    // Rate limit latency
    // ========================================================

    if (rateLimited.length > 0) {

        console.log(
            "\n----------- RATE LIMIT LATENCY -----------\n"
        );


        console.log(
            "Rate limited         :",
            rateLimited.length
        );


        console.log(
            "Average              :",
            formatMs(rateLimitLatency.average)
        );


        console.log(
            "P95                  :",
            formatMs(rateLimitLatency.p95)
        );


        console.log(
            "P99                  :",
            formatMs(rateLimitLatency.p99)
        );
    }


    // ========================================================
    // Total test duration
    // ========================================================

    console.log(
        "\n------------- TEST DURATION -------------\n"
    );


    console.log(
        "Total test time      :",
        formatMs(testDuration)
    );


    // ========================================================
    // Atomicity result
    // ========================================================

    console.log(
        "\n------------- ATOMICITY CHECK -------------\n"
    );


    if (
        serverErrors.length === 0 &&
        networkErrors.length === 0
    ) {

        console.log(
            "✓ No server/network errors detected"
        );

    } else {

        console.log(
            "✗ Server/network errors detected"
        );
    }


    console.log(
        "\n============================================\n"
    );


    // ========================================================
    // Print server errors
    // ========================================================

    if (serverErrors.length > 0) {

        console.log(
            "First 10 server errors:\n"
        );


        serverErrors
            .slice(0, 10)
            .forEach(result => {

                console.log({
                    index: result.index,
                    status: result.status,
                    duration:
                        `${result.duration.toFixed(2)} ms`,
                    data: result.data
                });

            });
    }
};


runTest();