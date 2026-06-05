import momentTZ from 'moment-timezone';
import { messageNotification } from '../models/store-data.message';

const format_date = "YYYYMMDD";
const timeZone = "Asia/Bangkok";

export default class Util {
    static getDateNow(): string {
        const dateFormat = momentTZ.tz(timeZone).format(format_date);
        return dateFormat;
    }

    static getDateNowByFormat(format: string): string {
        const today = momentTZ().tz(timeZone);
        const dateFormat = today.format(format);
        return dateFormat;
    }

    static dateFormat(date: string, formatFrom: string, formatTo: string): string {
        const formattedDate = momentTZ.tz(date, formatFrom, timeZone).format(formatTo);
        return formattedDate;
    }

    static calculateTimeDifference(date1: string, date2: string): string {
        const dateObj1 = new Date(date1);
        const dateObj2 = new Date(date2);

        let diffInMilliseconds = Math.abs(dateObj2.getTime() - dateObj1.getTime());
        const hours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
        diffInMilliseconds -= hours * (1000 * 60 * 60);
        const mins = Math.floor(diffInMilliseconds / (1000 * 60));
        diffInMilliseconds -= mins * (1000 * 60);
        const secs = Math.floor(diffInMilliseconds / 1000);

        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} ชม.`;
    }

    static replaceEnd(text: string): string {
        text += 'end';
        text = text.replace(',end', ';');
        return text;
    }

    static encode(input: string): string {
        // const encodedData = Buffer.from(input).toString("base64");
        return input;
    }

    static isMessageNotification(obj: any): obj is messageNotification {
        return (
            typeof obj === "object" &&
            obj !== null &&

            typeof obj.Type === "string" &&
            typeof obj.MessageId === "string" &&
            typeof obj.TopicArn === "string" &&
            typeof obj.Subject === "string" &&
            typeof obj.Message === "string" &&
            typeof obj.Timestamp === "string" &&
            typeof obj.SignatureVersion === "string" &&
            typeof obj.Signature === "string" &&
            typeof obj.SigningCertURL === "string" &&
            typeof obj.UnsubscribeURL === "string"
        );
    }

    static isValidJson(str: string): boolean {
        try {
            JSON.parse(str);
            return true;
        } catch (error: any) {
            return false;
        }
    }

    static decodeBase64(base64: string): string {
        return Buffer.from(base64, 'base64').toString('utf-8');
    }
}
