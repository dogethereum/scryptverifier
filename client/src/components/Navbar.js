import React from 'react';
import {
  Link,
} from 'react-router-dom';
import {
  Container,
  Menu,
} from 'semantic-ui-react';

const Navbar = () => {
  return (
    <Container>
      <Menu>
        <Menu.Item to="/" as={Link}>Home</Menu.Item>
        <Menu.Item to="/about" as={Link}>About</Menu.Item>
      </Menu>
    </Container>
  );
};

export default Navbar;
