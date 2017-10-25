import React from 'react';
import {
  Grid,
  Header,
  Loader,
} from 'semantic-ui-react';
import {
  getSubmission,
  getSubmissions,
} from '../lib/Api';
import SubmissionsComponent from '../components/Submissions';
import { subscribeNotifications } from '../lib/Notifications';

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      error: false,
      data: {},
    };
  }

  componentDidMount() {
    this.loadData();
    if (!this.socket) {
      this.socket = subscribeNotifications();
      this.socket.on('newSubmission', (hash) => {
        this.updateData(hash);
      });
    }
  }

  componentWillUnmount() {
    if (this.socket) {
      this.socket.emit('unregister');
      this.socket.close();
      this.socket = null;
    }
  }

  async loadData() {
    try {
      this.setState({ loading: true, error: false });
      const { submissions } = await getSubmissions();
      const data = {
        submissions,
      };
      this.setState({ loading: false, error: false, data });
    } catch (ex) {
      this.setState({ loading: false, error: true });
    }
  }

  async updateData(hash) {
    try {
      const { submission } = await getSubmission(hash);
      const submissions = [...this.state.data.submissions, submission];
      const data = Object.assign({}, this.state.data, { submissions });
      this.setState({ data });
    } catch (ex) {
      // !
    }
  }

  render() {
    const {
      loading,
      error,
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
            <Loader active={loading} inline="centered" />
            <SubmissionsComponent submissions={submissions} />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}

export default Home;
