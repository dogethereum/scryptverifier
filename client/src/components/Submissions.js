import React from 'react';
import {
  Container,
  Table,
} from 'semantic-ui-react';

function formatHash(hash, length = 24) {
  if (hash.length > length) {
    return `${hash.substring(0, length - 2)}..`;
  }
  return hash;
}


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
              <Table.Cell>{formatHash(submission.hash, 40)}</Table.Cell>
              <Table.Cell>{formatHash(submission.input, 40)}</Table.Cell>
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
