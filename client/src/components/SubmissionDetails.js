import React from 'react';
import {
  Modal,
} from 'semantic-ui-react';
import _ from 'lodash';
import SubmitEvents from './SubmissionEvents';

const SubmissionDetails = ({ onClose, hash, events }) => {
  const sortedEvents = _.orderBy(events, ['timestamp'], ['desc']);
  return (
    <Modal open={!!hash} onClose={onClose} >
      <Modal.Header>{hash}</Modal.Header>
      <Modal.Content>
        <Modal.Description>
          <SubmitEvents events={sortedEvents} />
        </Modal.Description>
      </Modal.Content>
    </Modal>
  );
};

export default SubmissionDetails;
