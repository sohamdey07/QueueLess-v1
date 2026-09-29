const getTodayDate = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
        throw new Error("Invalid date");
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const isToday = (date) => {
    return formatDate(date) === getTodayDate();
};

const isValidDateString = (dateString) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return false;
    }

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    return formatDate(date) === dateString;
};

const isPastDate = (dateString) => {
    if (!isValidDateString(dateString)) {
        return false;
    }

    return dateString < getTodayDate();
};

export {
    getTodayDate,
    formatDate,
    isToday,
    isValidDateString,
    isPastDate
};