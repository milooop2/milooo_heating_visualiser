export const FORMATTERS = {
    temperature: (val) => val.toFixed(1),
    power: (val) => val.toFixed(1),
    energy: (val) => val.toFixed(1),
    pressure: (val) => val.toFixed(2),
    humidity: (val) => val.toFixed(1),
    current: (val) => val.toFixed(1),
    voltage: (val) => val.toFixed(1),
    volume_flow_rate: (val) => val.toFixed(1),
    wind_speed: (val) => val.toFixed(1),
    precipitation: (val) => val.toFixed(1),
    frequency: (val) => val.toFixed(1),

    timestamp: (val) => {
        const d = new Date(val);
        if (isNaN(d)) return val;
        return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
    },

    default: (val) => val,
};

export function formatValue(raw, deviceClass) {
    const formatter = FORMATTERS[deviceClass] || FORMATTERS.default;

    // timestamp: przekaż surowy string (formaters obsłuży new Date)
    if (deviceClass === "timestamp") {
        return formatter(raw);
    }

    const num = parseFloat(raw);
    if (isNaN(num)) return raw;
    return formatter(num);
}