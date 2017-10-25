const ethereum = require('./ethereum');

const NUM_SUBMISSIONS = 50;

class SubmissionsController {
  constructor() {
    this.init();
  }

  async init() {
    this.scryptVerifier = await ethereum.getScryptVerifier();
  }

  getSubmissionInternal(hash) {
    return this.scryptVerifier.getSubmission(hash).then(result => ({
      hash: result[0],
      input: result[1],
      submitter: result[2],
      timestamp: result[3],
    }));
  }

  async getSubmission(hash) {
    const submission = await this.getSubmissionInternal(hash);
    return { submission };
  }

  async listSubmissions() {
    const numSubmissions = await this.scryptVerifier.getNumSubmissions()
      .then(result => parseInt(result, 10));

    const start = numSubmissions > NUM_SUBMISSIONS ? numSubmissions - NUM_SUBMISSIONS : 0;
    const count = numSubmissions > NUM_SUBMISSIONS ? NUM_SUBMISSIONS : numSubmissions;
    const hashes = await this.scryptVerifier.getSubmissionsHashes(start, count);

    const submissions = await Promise.all(
      hashes.map(hash => this.getSubmissionInternal(hash)),
    );

    return { submissions };
  }
}

module.exports = new SubmissionsController();
