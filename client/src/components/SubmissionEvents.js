import React from 'react';
import {
  Container,
  Table,
} from 'semantic-ui-react';
import moment from 'moment';

function formatTimestamp(timestamp) {
  return moment(new Date(parseInt(timestamp, 10) * 1000)).fromNow();
}

class SubmissionEvents extends React.Component {
  constructor(props) {
    super(props);
    this.refreshDates = this.refreshDates.bind(this);
    const { events } = props;
    this.state = {
      events,
    };
  }

  componentDidMount() {
    this.timer = setInterval(this.refreshDates, 3000);
  }

  componentWillReceiveProps(nextProps) {
    const { events } = nextProps;
    this.setState({
      events,
    });
  }

  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  refreshDates() {
    this.forceUpdate();
  }

  render() {
    const { events } = this.state;
    return (
      <Container>
        <Table striped celled fixed singleLine selectable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Event</Table.HeaderCell>
              <Table.HeaderCell>Sender</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Result</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {events.map(event => (
              <Table.Row key={event.hash}>
                <Table.Cell>{event.name}</Table.Cell>
                <Table.Cell>{event.submitter}</Table.Cell>
                <Table.Cell>{formatTimestamp(event.timestamp)}</Table.Cell>
                <Table.Cell>{event.result}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Container>
    );
  }
}

export default SubmissionEvents;
