"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCronMatcher = exports.createCronMatcherFromRanges = exports.parseCronRangeString = void 0;
const cronConstants_1 = require("./cronConstants");
/**
 * Returns true if the cronItem should fire for the given timestamp digest,
 * false otherwise.
 *
 * @internal
 */
function cronItemMatches(cronItem, digest) {
    const { min, hour, date, month, dow } = digest;
    if (
    // If minute, hour and month match
    cronItem.minutes.includes(min) &&
        cronItem.hours.includes(hour) &&
        cronItem.months.includes(month)) {
        const dateIsExclusionary = cronItem.dates.length !== 31;
        const dowIsExclusionary = cronItem.dows.length !== 7;
        if (dateIsExclusionary && dowIsExclusionary) {
            // Cron has a special behaviour: if both date and day of week are
            // exclusionary (i.e. not "*") then a match for *either* passes.
            return cronItem.dates.includes(date) || cronItem.dows.includes(dow);
        }
        else if (dateIsExclusionary) {
            return cronItem.dates.includes(date);
        }
        else if (dowIsExclusionary) {
            return cronItem.dows.includes(dow);
        }
        else {
            return true;
        }
    }
    return false;
}
/**
 * Parses a range from a crontab line; a comma separated list of:
 *
 * - exact number
 * - wildcard `*` optionally with `/n` divisor
 * - range `a-b`
 *
 * Returns an ordered list of unique numbers in the range `min` to `max` that match the given range.
 *
 * If `wrap` is true, then the number `max + 1` will be replaced by the number
 * `min`; this is specifically to handle the value `7` being used to represent
 * Sunday (as opposed to `0` which is correct).
 */
const parseCrontabRange = (locationForError, range, min, max, wrap = false) => {
    const parts = range.split(",");
    const numbers = [];
    /**
     * Adds a number to our numbers array after wrapping it (if necessary) and
     * checking it's in the valid range.
     */
    function add(number) {
        const wrappedNumber = wrap && number === max + 1 ? min : number;
        if (wrappedNumber > max) {
            throw new Error(`Too large value '${number}' in ${locationForError}: expected values in the range ${min}-${max}.`);
        }
        else if (wrappedNumber < min) {
            throw new Error(`Too small value '${number}' in ${locationForError}: expected values in the range ${min}-${max}.`);
        }
        else {
            numbers.push(wrappedNumber);
        }
    }
    for (const part of parts) {
        {
            const matches = cronConstants_1.CRONTAB_NUMBER.exec(part);
            if (matches) {
                add(parseInt(matches[1], 10));
                continue;
            }
        }
        {
            const matches = cronConstants_1.CRONTAB_RANGE.exec(part);
            if (matches) {
                const a = parseInt(matches[1], 10);
                const b = parseInt(matches[2], 10);
                if (b <= a) {
                    throw new Error(`Invalid range '${part}' in ${locationForError}: destination is not larger than source`);
                }
                for (let i = a; i <= b; i++) {
                    add(i);
                }
                continue;
            }
        }
        {
            const matches = cronConstants_1.CRONTAB_WILDCARD.exec(part);
            if (matches) {
                const divisor = matches[1] ? parseInt(matches[1], 10) : 1;
                if (divisor >= 1) {
                    for (let i = min; i <= max; i += divisor) {
                        // We know this is fine, so no need to call `add`
                        numbers.push(i);
                    }
                }
                else {
                    throw new Error(`Invalid wildcard expression '${part}' in ${locationForError}: divisor '${matches[1]}' expected to be greater than zero`);
                }
                continue;
            }
        }
        throw new Error(`Unsupported syntax '${part}' in ${locationForError}: this doesn't appear to be a number, range or wildcard`);
    }
    numbers.sort((a, b) => a - b);
    // Filter out numbers that are identical to the previous number
    const uniqueNumbers = numbers.filter((currentNumber, idx) => idx === 0 || numbers[idx - 1] !== currentNumber);
    return uniqueNumbers;
};
/**
 * Processes a list of matches from the CRONTAB_LINE_PARTS or
 * CRONTAB_TIME_PARTS regexps and returns the parsed matches.
 *
 * @internal
 */
function parseCrontabRanges(matches, source) {
    const minutes = parseCrontabRange(`minutes range in ${source}`, matches[1], 0, 59);
    const hours = parseCrontabRange(`hours range in ${source}`, matches[2], 0, 23);
    const dates = parseCrontabRange(`dates range in ${source}`, matches[3], 1, 31);
    const months = parseCrontabRange(`months range in ${source}`, matches[4], 1, 12);
    const dows = parseCrontabRange(`days of week range in ${source}`, matches[5], 0, 6, true);
    return { minutes, hours, dates, months, dows };
}
const parseCronRangeString = (pattern, source) => {
    const matches = cronConstants_1.CRONTAB_TIME_PARTS.exec(pattern);
    if (!matches) {
        throw new Error(`Invalid cron pattern '${pattern}' in ${source}`);
    }
    return parseCrontabRanges(matches, source);
};
exports.parseCronRangeString = parseCronRangeString;
/**
 * Takes a list of matches from the CRONTAB_LINE_PARTS or CRONTAB_TIME_PARTS
 * regexps a CronMatcher function.
 *
 * @internal
 */
const createCronMatcherFromRanges = (matches, source) => {
    const parsedCronMatch = parseCrontabRanges(matches, source);
    const matcher = (digest) => cronItemMatches(parsedCronMatch, digest);
    Object.assign(matcher, { parsedCronMatch });
    return matcher;
};
exports.createCronMatcherFromRanges = createCronMatcherFromRanges;
/**
 * Creates a CronMatcher function from the given cron pattern.
 */
const createCronMatcher = (pattern, source) => {
    const matches = cronConstants_1.CRONTAB_TIME_PARTS.exec(pattern);
    if (!matches) {
        throw new Error(`Invalid cron pattern '${pattern}' in ${source}`);
    }
    return (0, exports.createCronMatcherFromRanges)(matches, source);
};
exports.createCronMatcher = createCronMatcher;
//# sourceMappingURL=cronMatcher.js.map