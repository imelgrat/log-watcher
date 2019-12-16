const watcher = require('./lib/watcher');

const watcherObject = new watcher('./errors.log', 10);
const fsWatch = watcherObject.watchLog();

// End watching log after 5 minutes
setTimeout(function(){ fsWatch.close(); }, 5 * 60 * 1000);