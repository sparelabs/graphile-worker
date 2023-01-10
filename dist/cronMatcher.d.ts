import { CronMatcher, ParsedCronMatch } from "./interfaces";
export declare const parseCronRangeString: (pattern: string, source: string) => ParsedCronMatch;
/**
 * Takes a list of matches from the CRONTAB_LINE_PARTS or CRONTAB_TIME_PARTS
 * regexps a CronMatcher function.
 *
 * @internal
 */
export declare const createCronMatcherFromRanges: (matches: string[], source: string) => CronMatcher;
/**
 * Creates a CronMatcher function from the given cron pattern.
 */
export declare const createCronMatcher: (pattern: string, source: string) => CronMatcher;
