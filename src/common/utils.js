function ptcDelayToMinutes(delay) {
    // delay as number
    if (typeof delay === 'number') {
        return delay;
    }

    // delay as HH:MM:SS
    if (typeof delay === 'string' && delay.includes(':')) {
        const delayParts = delay.split(':');
        const hours = parseInt(delayParts[0]) || 0;
        const minutes = parseInt(delayParts[1]) || 0;
        return (hours * 60) + minutes;
    }

    return parseInt(delay) || 0;
}

function ptcTimeToStr(time) {
    const parse = Date.parse(time);
    return parse ? (new Date(parse)).toLocaleTimeString([], {'timeStyle': 'short'}) : time;
}

function ptcTimeOffset(time, delay) {
    const [targetHours, targetMinutes] = time.split(":").map(Number);

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    const targetTotalMinutes = targetHours * 60 + targetMinutes;

    let offset = targetTotalMinutes - currentTotalMinutes;

    // assume target time is tomorrow if offset is more than 3 hours in the past
    if (offset < -3 * 60) {
        offset += 24 * 60;
    }

    return offset + delay;
}

function ptcParseBool(value) {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'number') {
        return value !== 0;
    }

    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }

    return false;
}
