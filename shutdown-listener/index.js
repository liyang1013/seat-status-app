const path = require('path');

let native = null;

try {
  native = require('./build/Release/shutdownlistener');
} catch (error) {
  console.error('Native module load failed:', error.message);
  native = {
    start: (callback) => {
      console.log('Native module not available - using fallback');
      return false;
    },
    stop: () => {
      console.log('Native module not available - using fallback');
      return false;
    }
  };
}

module.exports = native;