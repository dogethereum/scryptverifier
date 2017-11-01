const Verifier = require('./verifier');
const logger = require('./logger');

const NUM_SUBMISSIONS = 50;

class SubmissionsController {
  constructor() {
    this.verifier = new Verifier();
  }

  async getSubmission(hash) {
    try {
      const submission = await this.verifier.getSubmission(hash);
      return { submission };
    } catch (ex) {
      logger.error(`${ex.stack}`);
      return {};
    }
  }

  async listSubmissions() {
    try {
      const numSubmissions = await this.verifier.getNumSubmissions();

      const start = numSubmissions > NUM_SUBMISSIONS ? numSubmissions - NUM_SUBMISSIONS : 0;
      const count = numSubmissions > NUM_SUBMISSIONS ? NUM_SUBMISSIONS : numSubmissions;
      const hashes = await this.verifier.getSubmissionsHashes(start, count);

      const submissions = await Promise.all(
        hashes.map(hash => this.verifier.getSubmission(hash)),
      );

      return { submissions };
    } catch (ex) {
      logger.error(`${ex.stack}`);
      return {};
    }
  }

  async getSubmissionEvents(hash) {
    try {
      const events = await this.verifier.getSubmissionEvents(hash);
      return { events };
    } catch (ex) {
      logger.error(`${ex.stack}`);
      return {};
    }
  }
}

module.exports = new SubmissionsController();
