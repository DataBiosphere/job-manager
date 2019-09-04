const { spawnSync } = require('child_process');

module.exports = {
  /**
   * Runs minnie-kenny.sh logging the output to the console and returning the exit code.
   *
   * @param {...string} args Arguments to pass to minnie-kenny.sh
   * @returns {number} The exit status of minnie-kenny.sh
   */
  runMinnieKenny: function (...args) {
    const minnieKennyProcess = spawnSync(`${__dirname}/../minnie-kenny.sh`, args, {stdio: 'inherit'});
    return minnieKennyProcess.status;
  },
  /**
   * Runs minnie-kenny.sh logging the output to the console and exiting if the result is non-zero.
   *
   * @param {...string} args Arguments to pass to minnie-kenny.sh
   */
  exitIfFailMinnieKenny: function (...args) {
    const minnieKennyStatus = module.exports.runMinnieKenny(...args);
    if (minnieKennyStatus) process.exit(minnieKennyStatus);
  },
};
