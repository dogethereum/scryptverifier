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
} from '../lib/Api';
import SubmissionsComponent from '../components/Submissions';
import Notifications from '../lib/Notifications';
import SubmissionDetails from '../components/SubmissionDetails';

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

  async loadData() {
    try {
      this.setState({ loading: true, error: false });
      const { submissions } = await getSubmissions();
      const data = {
        submissions: _.uniqBy(_.orderBy(submissions, ['timestamp'], ['desc']), row => row.hash),
      };
      this.setState({ loading: false, error: false, data });
    } catch (ex) {
      console.log(`${ex.stack}`);
      this.setState({ loading: false, error: true });
    }
  }

  async updateData(hash) {
    try {
      const { submission } = await getSubmission(hash);
      const submissions = _.uniqBy(_.orderBy([...this.state.data.submissions, submission], ['timestamp'], ['desc']), row => row.hash);
      const data = Object.assign({}, this.state.data, { submissions });
      this.setState({ data });
    } catch (ex) {
      // !
    }
  }

  handleRowClick(hash) {
    this.setState({ selectedSubmission: hash });
  }

  handleModalClose() {
    this.setState({ selectedSubmission: undefined });
  }

  render() {
    const {
      loading,
      error,
      selectedSubmission,
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
