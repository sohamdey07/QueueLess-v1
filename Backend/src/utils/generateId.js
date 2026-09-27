import crypto from "crypto";

const generateRandomString = (length = 6) => {
    return crypto
        .randomBytes(Math.ceil(length / 2))
        .toString("hex")
        .slice(0, length)
        .toUpperCase();
};

const generateAppointmentId = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const randomPart = generateRandomString(6);

    return `QL-${year}${month}${day}-${randomPart}`;
};

export {
    generateRandomString,
    generateAppointmentId
};