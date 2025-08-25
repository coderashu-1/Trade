import React, { Component } from "react";
import logo from "../assets/wsb_logo.png";
import splashImage from "../assets/splash-image.png";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { login } from "../actions/authActions";
import { clearErrors } from "../actions/errorActions";
import { Button, Nav, Row, Col, Navbar, Image } from "react-bootstrap";
import { Redirect, Link } from "react-router-dom";

class Splash extends Component {
  state = {
    name: "",
    email: "",
    password: "",
    msg: null,
    alertOpen: false
  };

  static propTypes = {
    isAuthenticated: PropTypes.bool,
    error: PropTypes.object.isRequired,
    login: PropTypes.func.isRequired,
    clearErrors: PropTypes.func.isRequired
  };

  componentDidUpdate(prevProps) {
    const { error } = this.props;
    if (error !== prevProps.error) {
      if (error.id === "LOGIN_FAIL") {
        this.setState({ msg: error.msg.msg });
      } else {
        this.setState({ msg: null });
      }
    }
  }

  handleAlert = () => {
    alert(this.state.msg);
    this.props.clearErrors();
  };

  onChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  };

  render() {
    if (this.props.isAuthenticated === true) {
      return <Redirect push to="/" />;
    }

    return (
      <div style={{ width: "100%", overflowX: "hidden" }}>
        <Row className="spacer-row" />

        {/* Responsive two-column layout */}
        <Row className="justify-content-center align-items-center" style={{ margin: 0 }}>
          <Col xs={12} md={6} className="mb-4 mb-md-0">
            <div className="splash-form-left-div" style={{ textAlign: "center", padding: "1rem" }}>
              <Row className="justify-content-center">
                <Image
                  src={logo}
                  alt="TradeGo logo"
                  className="paper-shadow-class splashImageFace"
                  style={{ maxWidth: "120px", height: "auto" }}
                  fluid
                />
              </Row>

              <Row className="mt-3 justify-content-center">
                <h1 style={{ fontSize: "2rem" }}>TradeGo.Live</h1>
              </Row>

              <Row className="justify-content-center">
                <h5 className="text-muted mt-2" style={{ fontStyle: "italic", fontSize: "1rem" }}>
                  Predict. Bet. Earn.
                </h5>
              </Row>

              <Row className="justify-content-center mt-3">
                <h3 style={{ fontSize: "1.2rem" }}>You could be earning in minutes.</h3>
              </Row>

              <Row className="mt-3 justify-content-center">
                <Link className="green-theme-text" to="/register">
                  <Button className="mr-2 splash-form-button" style={{ marginBottom: "0.5rem", width: "120px" }}>
                    Sign Up
                  </Button>
                </Link>
                <Link className="green-theme-text" to="/login">
                  <Button className="ml-2 splash-form-button" style={{ marginBottom: "0.5rem", width: "120px" }}>
                    Log In
                  </Button>
                </Link>
              </Row>

              {/* Description hidden on xs */}
              <Row className="mt-4 d-none d-md-flex justify-content-center">
                <Col xs={10}>
                  <p className="text-center" style={{ fontSize: "0.9rem", lineHeight: "1.4rem" }}>
                    TradeGo.Live gives you direct access to real markets — in a bold and simple way.
                    <br />
                    Choose an asset, decide the direction, and place your bet.
                    <br />
                    No complex charts. No brokers. Just pure price action.
                    <br />
                    <strong style={{ color: "#4caf50" }}>
                      Join thousands already earning. You can be next.
                    </strong>
                    <br />
                    <span style={{ fontStyle: "italic", color: "#ffc107" }}>
                      High risk. High reward. Trade responsibly.
                    </span>
                  </p>
                </Col>
              </Row>
            </div>
          </Col>

          {/* Right Image */}
          <Col xs={12} md={6} className="text-center">
            <Image
              className="splashImage"
              src={splashImage}
              alt="splash"
              style={{ maxWidth: "100%", height: "auto" }}
              fluid
            />
          </Col>
        </Row>

        {/* Footer stays responsive */}
        <Navbar
          className="paper-shadow-class footer-bg justify-content-center"
          fixed="bottom"
          style={{ fontSize: "0.8rem", textAlign: "center" }}
        >
          <Nav className="justify-content-center w-100">
            <Nav.Link className="green-theme-text" style={{ fontSize: "0.8rem" }} href="#">
              TradeGo.Live, a TradeGo Project
            </Nav.Link>
          </Nav>
        </Navbar>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  error: state.error
});

export default connect(mapStateToProps, { login, clearErrors })(Splash);
