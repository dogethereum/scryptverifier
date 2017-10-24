const ethereum = require('./ethereum');

const NUM_SUBMISSIONS = 50;

async function listSubmissions() {
  const scryptVerifier = await ethereum.getScryptVerifier();
  const numSubmissions = await scryptVerifier.getNumSubmissions()
    .then(result => parseInt(result, 10));

  const start = numSubmissions > NUM_SUBMISSIONS ? numSubmissions - NUM_SUBMISSIONS : 0;
  const count = numSubmissions > NUM_SUBMISSIONS ? NUM_SUBMISSIONS : numSubmissions;
  const hashes = await scryptVerifier.getSubmissionsHashes(start, count);

  const submissions = await Promise.all(
    hashes.map(hash => scryptVerifier.getSubmission(hash).then(result => ({
      hash: result[0],
      input: result[1],
      submitter: result[2],
      timestamp: result[3],
    }))),
  );

  return { submissions };
}

module.exports = {
  listSubmissions,
};
