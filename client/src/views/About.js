import React from 'react';
import {
  Grid,
  Header,
} from 'semantic-ui-react';

const Home = () => {
  return (
    <Grid>
      <Grid.Row>
        <Grid.Column>
          <Header as="h1">About</Header>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
};

export default Home;
