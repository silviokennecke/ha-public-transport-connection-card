function delayToMinutes(delay) {
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

function timeToStr(time) {
    const parse = Date.parse(time);
    return parse ? (new Date(parse)).toLocaleTimeString([], {'timeStyle': 'short'}) : time;
}

function parseBool(value) {
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
