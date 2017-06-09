import {EventEmitter} from "events";

type command = (done: () => void) => void;
enum statuses {
    STOPPED = 0,
    STARTED
}

export interface CommandItem {
    commandFn: command;
    timeout?: number;
    successEvent?: string;
    errorEvent?: string;
    uniq?: number;
}

let uniq_ = 0;

export class CommandQueue extends EventEmitter {
    private status_ = statuses.STOPPED;
    private commands_: Array<CommandItem>;

    constructor(commands: Array<CommandItem> = []) {
        super();
        this.commands_ = commands;
    }

    push(command: CommandItem) {
        let itm: CommandItem = {
            commandFn: (done) => {done();},
            timeout: -1,
            successEvent: "success",
            errorEvent: "error",
            uniq: ++uniq_
        };
        Object.assign(itm, command);
        this.commands_.push(itm);
        setTimeout(this.start.bind(this),0);
        return itm;
    }

    async start() {
        if (this.status_ === statuses.STARTED) {
            return;
        }
        this.status_ = statuses.STARTED;

        while (this.commands_.length > 0) {
            let item = this.commands_.shift();
            let {commandFn, timeout, successEvent, errorEvent, uniq} = item;
            try {
                await new Promise<any>((resolve, reject) => {
                    if (timeout >= 0) {
                        setTimeout(reject,timeout);
                    }
                    commandFn(resolve);
                });
                this.emit(successEvent, uniq);
                this.emit(`${successEvent}${uniq}`);
            } catch (ex) {
                this.emit(errorEvent, uniq, ex);
                this.emit(`${errorEvent}${uniq}`,ex);
            }
        }
        this.status_ = statuses.STOPPED;
    }
}
