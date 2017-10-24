import React from 'react';
import {
  Grid,
  Header,
  Loader,
} from 'semantic-ui-react';
import {
  getSubmissions,
} from '../lib/Api';
import SubmissionsComponent from '../components/Submissions';

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
