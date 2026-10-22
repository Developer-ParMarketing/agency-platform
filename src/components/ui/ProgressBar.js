export default function ProgressBar({ percent = 0 }) {
    const value = Math.min(100, Math.max(0, percent));
    const color = value === 100 ? "bg-green-500" : "bg-indigo-500";
    return (
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${value}%` }} />
        </div>
    );
}