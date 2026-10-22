export function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// For <input type="date"> which needs "YYYY-MM-DD"
export function toInputDate(d) {
    return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export function isOverdue(dueDate, status) {
    if (!dueDate || ["completed", "cancelled", "done"].includes(status)) return false;
    const endOfDue = new Date(dueDate);
    endOfDue.setHours(23, 59, 59, 999);
    return endOfDue < new Date();
}
export function formatDateTime(d) {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
    });
}

export function formatINR(amount) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);
}

// For <input type="datetime-local"> which needs local "YYYY-MM-DDTHH:mm"
export function toInputDateTime(d) {
    if (!d) return "";
    const dt = new Date(d);
    return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}