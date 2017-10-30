import React from 'react';
import {
  Modal,
} from 'semantic-ui-react';
import _ from 'lodash';
import SubmitEvents from './SubmissionEvents';
import {
  getSubmissionEvents,
} from '../lib/Api';

class SubmissionDetails extends React.Component {
  constructor(props) {
    super(props);
    const {
      hash,
    } = props;
    this.state = {
      hash,
    };
  }

  componentDidMount() {
    this.loadData();
  }

  componentWillReceiveProps(nextProps) {
    const { hash } = nextProps;
    if (this.state.hash !== hash) {
      this.loadData(hash);
    }
  }

  async loadData(hash) {
    try {
      this.setState({ hash, loading: true, error: false });
      const { events } = await hash ? getSubmissionEvents(hash) : [];
      const data = {
        events: _.uniqBy(_.orderBy(events, ['timestamp'], ['desc']), row => row.hash),
      };
      this.setState({ loading: false, error: false, data });
    } catch (ex) {
      console.log(`${ex.stack}`);
      this.setState({ loading: false, error: true });
    }
  }

  render() {
    const {
      onClose,
    } = this.props;
    const {
      loading,
      error,
      hash,
      data: {
        events = [],
      } = {},
    } = this.state;
    return (
      <Modal open={!!hash} onClose={onClose} >
        <Modal.Header>{hash}</Modal.Header>
        <Modal.Content>
          <Modal.Description>
            <SubmitEvents events={events} />
          </Modal.Description>
        </Modal.Content>
      </Modal>
    );
  }
}

export default SubmissionDetails;
