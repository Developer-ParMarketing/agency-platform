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