import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch,
} from 'react-router-dom';
import {
  Container,
} from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import Home from './views/Home';
import About from './views/About';

const App = () => (
  <Router>
    <Container>
      <Container style={{ marginTop: '1em' }}>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/about" component={About} />
        </Switch>
      </Container>
    </Container>
  </Router>
);

export default App;
