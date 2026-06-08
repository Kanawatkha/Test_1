import { randomUUID } from 'crypto';
import momentTZ from 'moment-timezone';
import Logger from './utils/logger';
import { MongoClient } from './utils/mongodb.client';
import { AutomationProcessorService } from './services/automation-processor.services';

export class AutomationApp {
    private className: string = "AutomationApp";
    private mongoClient = new MongoClient();
    private automationProcessorService = new AutomationProcessorService();
    private lastExecutedMinute: number = -1;

    private isCronMatch(cronExpression: string, currentMinute: number, currentHour: number): boolean {
        const tokens = cronExpression.split(' ');
        if (tokens.length < 5) {
            return false;
        }
        const matchMinute = tokens[0] === '*' || parseInt(tokens[0]) === currentMinute;
        const matchHour = tokens[1] === '*' || parseInt(tokens[1]) === currentHour;
        return matchMinute && matchHour;
    }

    public async initialize() {
        setInterval(async () => {
            const loopCorrelationId = randomUUID();
            const now = momentTZ().tz("Asia/Bangkok");
            const currentMinute = now.minute();
            const currentHour = now.hour();

            if (this.lastExecutedMinute === currentMinute) {
                return;
            }

            try {
                const activeTriggers = await this.mongoClient.getAutomationTriggers(loopCorrelationId, "-");
                if (!activeTriggers || activeTriggers.length === 0) {
                    return;
                }

                let executedInThisLoop = false;
                for (const trigger of activeTriggers) {
                    const cronExpression = trigger.matchCondition?.cronExpression;
                    const targetFlowName = trigger.targetFlowName;
                    const expectedShiftNo = trigger.matchCondition?.expectedShiftNo;

                    if (!cronExpression || !targetFlowName || expectedShiftNo === undefined) {
                        continue;
                    }

                    if (this.isCronMatch(cronExpression, currentMinute, currentHour)) {
                        Logger.info(this.className, "intervalJob", `Cron matched for flow: ${targetFlowName} | Shift: ${expectedShiftNo}`, loopCorrelationId, "-");
                        executedInThisLoop = true;
                        await this.automationProcessorService.processAutomation(targetFlowName, expectedShiftNo, loopCorrelationId);
                    }
                }

                if (executedInThisLoop) {
                    this.lastExecutedMinute = currentMinute;
                }
            } catch (error: any) {
                Logger.error(this.className, "intervalJob", `Interval calculation error: ${error.message}`, loopCorrelationId, "-");
            }
        }, 60000);
    }
}

const app = new AutomationApp();
app.initialize();