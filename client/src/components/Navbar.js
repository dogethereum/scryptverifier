import React from 'react';
import {
  Container,
  Menu,
} from 'semantic-ui-react';

const Navbar = () => {
  return (
    <Container>
      <Menu>
        <Menu.Item to="/" >Home</Menu.Item>
        <Menu.Item to="/about" >About</Menu.Item>
      </Menu>
    </Container>
  );
};

export default Navbar;
