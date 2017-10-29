const Verifier = require('./verifier');

const NUM_SUBMISSIONS = 50;

class SubmissionsController {
  constructor() {
    this.verifier = new Verifier();
  }

  async getSubmission(hash) {
    const submission = await this.verifier.getSubmission(hash);
    return { submission };
  }

  async listSubmissions() {
    const numSubmissions = await this.verifier.getNumSubmissions();

    const start = numSubmissions > NUM_SUBMISSIONS ? numSubmissions - NUM_SUBMISSIONS : 0;
    const count = numSubmissions > NUM_SUBMISSIONS ? NUM_SUBMISSIONS : numSubmissions;
    const hashes = await this.verifier.getSubmissionsHashes(start, count);

    const submissions = await Promise.all(
      hashes.map(hash => this.verifier.getSubmission(hash)),
    );

    return { submissions };
  }
}

module.exports = new SubmissionsController();
