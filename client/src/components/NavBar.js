// components/NavBar.js
import React, { Component, Fragment } from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import Logout from "./Logout";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import logo from "../assets/wsb_logo.png";
import { Link } from "react-router-dom";
import { refreshUserData } from "../actions/userActions";
import { slide as Menu } from "react-burger-menu";

class NavBar extends Component {
  static propTypes = {
    auth: PropTypes.object.isRequired,
    error: PropTypes.object,
    register: PropTypes.func,
    clearErrors: PropTypes.func,
    stock: PropTypes.object.isRequired,
    refreshUserData: PropTypes.func
  };

  componentDidMount() {
    const { auth, refreshUserData } = this.props;
    if (auth?.user) {
      refreshUserData(auth.user);
    }
  }

  render() {
    const { isAuthenticated, user } = this.props.auth;

    const userLinks = (
      <Fragment>
        <Nav>
          <Nav.Link as={Link} to="/">
            <span className="mainSiteNavBarLink navbar-text mr-3">Home</span>
          </Nav.Link>
        </Nav>
        <Nav>
          <Nav.Link as={Link} to="/buy">
            <span className="mainSiteNavBarLink navbar-text mr-3">Trade</span>
          </Nav.Link>
        </Nav>
        <Nav>
          <Nav.Link as={Link} to="/account">
            <span className="mainSiteNavBarLink navbar-text mr-3">Account</span>
          </Nav.Link>
        </Nav>
        <Nav>
          <Nav.Link as={Link} to="/addmoney">
            <span className="mainSiteNavBarLink navbar-text mr-3 text-success font-weight-bold">
              + Add Money
            </span>
          </Nav.Link>
        </Nav>
        <Nav>
          <Logout />
        </Nav>
      </Fragment>
    );

    const guestLinks = (
      <Fragment>
        <Nav>
          <Nav.Link as={Link} to="/register">Register</Nav.Link>
        </Nav>
        <Nav>
          <Nav.Link as={Link} to="/login">Login</Nav.Link>
        </Nav>
      </Fragment>
    );

    return (
      <div>
        {/* Mobile burger menu */}
        <Menu right outerContainerId={"App"}>
          {isAuthenticated ? userLinks : guestLinks}
        </Menu>

        {/* Main navbar */}
        <Navbar expand="lg" variant="light" className=" mbnav paper-shadow-class mainSiteNavBar px-3 py-2 d-flex justify-content-between align-items-center">

          {/* Left: Logo */}
          <Link to="/">
            <img src={logo} alt="wsb logo" className="wsbNavLogo" style={{ height: "40px" }} />
          </Link>

          {/* Center: trading.live */}
          <div className="flex-grow-1 text-center">
            <span className="navbar-brand mb-0 h4 font-weight-bold text-primary">
              TG.Live
            </span>
          </div>

          {/* Right: Balance + Links */}
          <div className="d-flex align-items-center">
            <Nav className="hide-on-mobile mr-4">
              <span className="bold-text text-primary">
                {isAuthenticated && user?.balance !== undefined
                  ? `Balance: ${Number(user.balance).toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD"
                    })}`
                  : ""}
              </span>
            </Nav>

            <Nav className="navbar-desktop-links hide-on-mobile">
              {isAuthenticated ? userLinks : guestLinks}
            </Nav>
          </div>
        </Navbar>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth,
  error: state.error,
  stock: state.stock
});

export default connect(mapStateToProps, { refreshUserData })(NavBar);
