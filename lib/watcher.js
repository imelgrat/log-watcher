const fs = require('fs');
const reduce = require('lodash/reduce');

class LogWatcher {
    /**
     *Creates an instance of LogWatcher.
     * @param {String} logFilename The logfile's path
     * @param {Number} emailThreshold The maximum number of errors allowed in a minute before sending a notification.
     * @memberof LogWatcher
     */
    constructor(logFilename, emailThreshold = 10) {
        this.logFilename = logFilename;
        this.lastEmail = null;
        this.logEntries = [];
        this.emailThreshold = emailThreshold; 
    }

    /**
     * Clean log entries (keep only the ones generated less than one minute ago)
     *
     * @memberof LogWatcher
     */
    processEntries() {
        let previousMinute = new Date();
        // One minute ago.
        previousMinute = previousMinute.setMinutes(previousMinute.getMinutes() - 1);

        // Keep only "new" log entries (less than 1 minute)
        this.logEntries = reduce(this.logEntries, (list, entry) => {
            if (entry >= previousMinute) {
                list.push(entry);
            }
            return list;
        }
        , {});
    }

    /**
     * Watch logfile writes. Uses fs.watch to receive events on file writes.
     *
     * @param {String} logFilename
     * @memberof LogWatcher
     * @returns An instance of fs.FSWatcher. It can be used to end the watcher once it's no longer needed
     */
    watchLog() {
        let fsWait = false;

        // Using fs.watch instead of fs.watchFile to minimize system resources consumption (no file polling)
        const watcher = fs.watch(this.logFilename, (eventType, filename) => {
            // Only handle file content changes (not renames) 
            if (filename && eventType === 'change') {
                if (fsWait) return;

                // Debounce response to avoid multiple events during a single write (especially on Linux/MacOS systems)
                fsWait = setTimeout(() => {
                    fsWait = false;
                }, 100);

                // Add log write entry. Optionally, store log entry data as well.
                this.logEntries.push(new Date());

                // Clean-up old entries
                this.processEntries();

                // If, after cleanup, there are more entries than allowed by threshold, check whether to send notification
                if(this.logEntries.length > this.emailThreshold)
                {
                    let previousMinute = new Date();
                    // One minute ago.
                    previousMinute = previousMinute.setMinutes(previousMinute.getMinutes() - 1);

                    // If last notification was sent more than minute ago (or one has never been sent), send it and clean up values.
                    if(this.lastEmail === null || this.lastEmail < previousMinute)
                    {
                        this.sendNotification();
                        this.lastEmail = new Date();
                        this.logEntries = [];
                    }
                }
            }
        });

        return watcher;
    }

    /**
     * Send notification. In a real application, this would send an email
     *
     * @memberof LogWatcher
     */
    sendNotification()
    {
        console.log('There have been ' + this.logEntries.length + ' errors thrown during the last minute');
    }
}

module.exports = LogWatcher;
