import React from 'react';
import {
  Container,
  Table,
} from 'semantic-ui-react';

const Submissions = (props) => {
  const { submissions } = props;
  return (
    <Container>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Hash</Table.HeaderCell>
            <Table.HeaderCell>Input</Table.HeaderCell>
            <Table.HeaderCell>Date</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {submissions.map(submission => (
            <Table.Row key={submission.hash}>
              <Table.Cell>{submission.hash}</Table.Cell>
              <Table.Cell>{submission.input}</Table.Cell>
              <Table.Cell>{submission.timestamp}</Table.Cell>
              <Table.Cell>Pending</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
  );
};

export default Submissions;
