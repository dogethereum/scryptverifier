import React from 'react';
import {
  Grid,
  Header,
  Loader,
} from 'semantic-ui-react';
import _ from 'lodash';
import {
  getSubmission,
  getSubmissions,
  getSubmissionEvents,
} from '../lib/Api';
import SubmissionsComponent from '../components/Submissions';
import Notifications from '../lib/Notifications';
import SubmissionDetails from '../components/SubmissionDetails';

const NUM_SUBMISSIONS = 50;

const STATUS_NEW = 0;
const STATUS_CHALLENGE = 1;
const STATUS_DATA = 2;
const STATUS_REQUEST = 3;
const STATUS_VERIFIED = 4;
const STATUS_INVALID = -1;

function processSubmissions(submissions) {
  const sortedSubmissions = _.uniqBy(_.sortBy(submissions, ['timestamp']), s => s.hash)
    .reverse()
    .slice(0, NUM_SUBMISSIONS);
  return {
    submissions: sortedSubmissions,
  };
}


class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      error: false,
      selectedSubmission: undefined,
      data: {},
    };
    this.notifications = new Notifications();
    this.notifications.on('newSubmission', (hash) => {
      this.updateData(hash);
    });
    this.notifications.on('newChallenge', (hash) => {
      this.updateData(hash);
    });
    this.notifications.on('newDataHashes', (hash) => {
      this.updateData(hash);
    });
    this.notifications.on('newRequest', (hash) => {
      this.updateData(hash);
    });
    this.notifications.on('roundVerified', (hash) => {
      this.updateData(hash);
    });
    this.handleRowClick = this.handleRowClick.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
  }

  componentDidMount() {
    this.loadData();
    this.notifications.subscribe();
  }

  componentWillUnmount() {
    this.notifications.unsubscribe();
  }

  loadEvents() {
    const { submissions } = this.state.data;
    submissions.reduce(
      (curr, s) => curr.then(async () => {
        const { events } = await getSubmissionEvents(s.hash);
        let status = events.reduce((st, event) => {
          if (st < STATUS_CHALLENGE && event.name === 'NewChallenge') {
            return STATUS_CHALLENGE;
          } else if (st < STATUS_DATA && event.name === 'NewDataHashes') {
            return STATUS_DATA;
          } else if (st < STATUS_REQUEST && event.name === 'NewRequest') {
            return STATUS_REQUEST;
          } else if (st < STATUS_VERIFIED && event.name === 'RoundVerified') {
            return STATUS_VERIFIED;
          }
          return st;
        }, STATUS_NEW);
        if (Date.now() - (new Date(parseInt(s.timestamp, 10) * 1000)) >= 10 * 60 * 10000) {
          if (status === STATUS_NEW || status === STATUS_DATA) {
            status = STATUS_VERIFIED;
          } else {
            status = STATUS_INVALID;
          }
        }
        const submission = Object.assign({}, s, { events, status });
        const data = processSubmissions([submission, ...this.state.data.submissions]);
        this.setState({ data });
      }),
      Promise.resolve(),
    );
  }

  async loadData() {
    try {
      this.setState({ loading: true, error: false });
      const { submissions } = await getSubmissions();
      const data = processSubmissions(submissions);
      this.setState({ loading: false, error: false, data });
      this.loadEvents();
    } catch (ex) {
      console.error(`${ex.stack}`);
      this.setState({ loading: false, error: true });
    }
  }

  async updateData(hash) {
    try {
      const { submission } = await getSubmission(hash);
      const { events } = await getSubmissionEvents(submission.hash);
      submission.events = events;
      const newData = processSubmissions([submission, ...this.state.data.submissions]);
      const data = Object.assign({}, this.state.data, newData);
      this.setState({ data });
    } catch (ex) {
      // !
    }
  }

  handleRowClick(hash) {
    const submission = _.find(
      this.state.data.submissions,
      s => s.hash === hash,
    );
    const selectedEvents = submission ? submission.events : [];
    this.setState({ selectedSubmission: hash, selectedEvents });
  }

  handleModalClose() {
    this.setState({ selectedSubmission: undefined, selectedEvents: [] });
  }

  render() {
    const {
      loading,
      error,
      selectedSubmission,
      selectedEvents,
      data: {
        submissions = [],
      },
    } = this.state;
    return (
      <Grid>
        <Grid.Row>
          <Grid.Column>
            <Header as="h1">Home</Header>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <SubmissionDetails
              hash={selectedSubmission}
              events={selectedEvents}
              onClose={() => this.handleModalClose()}
            />
            <Loader active={loading} inline="centered" />
            <SubmissionsComponent submissions={submissions} onRowClick={this.handleRowClick} />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}

export default Home;
