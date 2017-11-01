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
        const submission = Object.assign({}, s, { events });
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
