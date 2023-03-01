'use strict';

const localLog = require('npmlog');

localLog.level = process.env?.LOG_LEVEL || 'info';
localLog.heading = 'cc';
localLog.addLevel('success', 2000, { fg: 'green', bold: true });

module.exports = localLog;
