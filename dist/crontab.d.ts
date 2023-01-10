import { CronItem, ParsedCronItem } from "./interfaces";
/**
 * Parses a line from a crontab file, such as `* * * * * my_task`
 */
export declare const parseCrontabLine: (crontabLine: string, lineNumber: number) => ParsedCronItem;
export declare const parseCrontab: (crontab: string) => Array<ParsedCronItem>;
/**
 * Parses a list of `CronItem`s into a list of `ParsedCronItem`s, ensuring the
 * results comply with all the expectations of the `ParsedCronItem` type
 * (including those that cannot be encoded in TypeScript).
 */
export declare const parseCronItems: (items: CronItem[]) => ParsedCronItem[];
/**
 * Parses an individual `CronItem` into a `ParsedCronItem`, ensuring the
 * results comply with all the expectations of the `ParsedCronItem` type
 * (including those that cannot be encoded in TypeScript).
 */
export declare const parseCronItem: (cronItem: CronItem, source?: string) => ParsedCronItem;
