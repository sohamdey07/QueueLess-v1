import { io } from "socket.io-client";

const ACCESS_TOKEN = "your_access_token_here"; // Replace with a valid access token from your authentication system

const QUEUE_ID = "your_queue_id_here"; // Replace with a valid queue ID from your database

const socket = io("http://localhost:3000", {
    auth: {
        token: ACCESS_TOKEN
    }
});


// ========================================
// 1. SOCKET CONNECTED
// ========================================

socket.on("connect", () => {
    console.log("\n========================================");
    console.log("SOCKET CONNECTED");
    console.log("========================================");

    console.log("Socket ID:", socket.id);

    console.log("\nJoining queue...");
    
    socket.emit("queue:join", {
        queueId: QUEUE_ID
    });
});


// ========================================
// 2. QUEUE JOINED
// ========================================

socket.on("queue:joined", (data) => {
    console.log("\n========================================");
    console.log("QUEUE JOINED SUCCESSFULLY");
    console.log("========================================");

    console.log("Queue ID:", data.queueId);
    console.log("Queue Entry ID:", data.queueEntryId);
    console.log("Token Number:", data.tokenNumber);
    console.log("Status:", data.status);

    console.log("\nWaiting for queue updates...");
});


// ========================================
// 3. QUEUE UPDATED
// ========================================

socket.on("queue:updated", (data) => {
    console.log("\n========================================");
    console.log("QUEUE UPDATED");
    console.log("========================================");

    console.log("Queue ID:", data.queueId);
    console.log("Event Type:", data.type);

    if (data.tokenNumber !== undefined) {
        console.log("Token Number:", data.tokenNumber);
    }

    if (data.counterId !== undefined) {
        console.log("Counter ID:", data.counterId);
    }

    console.log("\nComplete event:");
    console.log(data);
});


// ========================================
// 4. QUEUE ERROR
// ========================================

socket.on("queue:error", (error) => {
    console.log("\n========================================");
    console.log("QUEUE ERROR");
    console.log("========================================");

    console.log("Message:", error.message);
});


// ========================================
// 5. CONNECTION ERROR
// ========================================

socket.on("connect_error", (error) => {
    console.log("\n========================================");
    console.log("SOCKET CONNECTION ERROR");
    console.log("========================================");

    console.log("Message:", error.message);
});


// ========================================
// 6. DISCONNECTED
// ========================================

socket.on("disconnect", (reason) => {
    console.log("\n========================================");
    console.log("SOCKET DISCONNECTED");
    console.log("========================================");

    console.log("Reason:", reason);
});