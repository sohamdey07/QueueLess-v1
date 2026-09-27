const generateQueueToken = (sequenceNumber, prefix = "A") => {
    return `${prefix}-${String(sequenceNumber).padStart(3, "0")}`;
};

export {
    generateQueueToken
};

// if no prefix is provided, the default prefix "A" will be used. The sequence number will be padded with leading zeros to ensure it is at least three digits long.

// for example : generateQueueToken(5) will return "A-005"
//               generateQueueToken(5, "B") will return "B-005"