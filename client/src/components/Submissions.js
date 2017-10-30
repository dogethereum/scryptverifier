import React from 'react';
import {
  Container,
  Table,
} from 'semantic-ui-react';
import moment from 'moment';

function formatTimestamp(timestamp) {
  return moment(new Date(parseInt(timestamp, 10) * 1000)).fromNow();
}

class Submissions extends React.Component {
  constructor(props) {
    super(props);
    this.refreshDates = this.refreshDates.bind(this);
    const { submissions } = props;
    this.state = {
      submissions,
    };
  }

  componentDidMount() {
    this.timer = setInterval(this.refreshDates, 3000);
  }

  componentWillReceiveProps(nextProps) {
    const { submissions } = nextProps;
    this.setState({
      submissions,
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
    const { submissions } = this.state;
    const { onRowClick } = this.props;
    return (
      <Container>
        <Table striped celled fixed singleLine selectable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Hash</Table.HeaderCell>
              <Table.HeaderCell>Input</Table.HeaderCell>
              <Table.HeaderCell>Submitter</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {submissions.map(submission => (
              <Table.Row key={submission.hash} onClick={() => onRowClick(submission.hash)}>
                <Table.Cell>{submission.hash}</Table.Cell>
                <Table.Cell>{submission.input}</Table.Cell>
                <Table.Cell>{submission.submitter}</Table.Cell>
                <Table.Cell>{formatTimestamp(submission.timestamp)}</Table.Cell>
                <Table.Cell>Pending</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Container>
    );
  }
}

export default Submissions;
