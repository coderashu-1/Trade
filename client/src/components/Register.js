import React, { Component } from "react";
import logo from "../assets/wsb_logo.png";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { register } from "../actions/authActions";
import { clearErrors } from "../actions/errorActions";
import {
  Alert,
  Form,
  Container,
  Button,
  Nav,
  Row,
  Navbar
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faGithub } from "@fortawesome/free-brands-svg-icons";
import { Redirect } from "react-router-dom";

const validEmailRegex = RegExp(
  /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
);

class Register extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formValid: false,
      errorCount: null,
      msg: null,
      alertOpen: false,
      name: "",
      email: "",
      phone: "",
      password: "",
      errors: {
        name: "",
        email: "",
        phone: "",
        password: ""
      }
    };
  }

  static propTypes = {
    isAuthenticated: PropTypes.bool,
    error: PropTypes.object.isRequired,
    register: PropTypes.func.isRequired,
    clearErrors: PropTypes.func.isRequired
  };

  handleChange = event => {
    event.preventDefault();
    const { name, value } = event.target;
    let errors = this.state.errors;

    switch (name) {
      case "name":
        errors.name = value.length < 2 ? "Name must be at least 2 characters long" : "";
        break;
      case "email":
        errors.email = validEmailRegex.test(value) ? "" : "Please enter a valid email address";
        break;
      case "phone":
        errors.phone = /^\d{10}$/.test(value) ? "" : "Phone number must be 10 digits";
        break;
      case "password":
        errors.password = value.length < 6 ? "Password must be at least 6 characters long" : "";
        break;
      default:
        break;
    }

    this.setState({ errors, [name]: value });
  };

  componentDidUpdate(prevProps) {
    const { error } = this.props;
    if (error !== prevProps.error) {
      if (error.id === "REGISTER_FAIL") {
        this.setState({ msg: error.msg.msg });
      } else {
        this.setState({ msg: null });
      }
    }
  }

  canBeSubmitted = () => {
    const { name, email, phone, password, errors } = this.state;
    return (
      name &&
      email &&
      phone &&
      password &&
      errors.name === "" &&
      errors.email === "" &&
      errors.phone === "" &&
      errors.password === ""
    );
  };

  onSubmit = e => {
    if (!this.canBeSubmitted()) {
      e.preventDefault();
      return;
    }

    this.props.clearErrors();
    e.preventDefault();

    const { name, email, phone, password } = this.state;

    const newUser = {
      name,
      email,
      phone,
      password
    };

    this.props.register(newUser);
  };

  render() {
    if (this.props.isAuthenticated === true) {
      return <Redirect to="/" />;
    }

    const isEnabled = this.canBeSubmitted();
    const { errors } = this.state;

    return (
      <Container>
        <Row className="mt-4 justify-content-center">
          <img
            src={logo}
            alt="wsb logo"
            className="paper-shadow-class splashImageFace"
          />
        </Row>

        <Row className="justify-content-center mt-4">
          <h1>Sign Up</h1>
        </Row>

        {this.state.msg && <Alert variant="danger">{this.state.msg}</Alert>}

        <Row className="justify-content-center mt-3">
          <form onSubmit={this.onSubmit}>
            <Form.Group>
              <Form.Label className="mb-0">Name</Form.Label>
              <Form.Control
                className="mt-0"
                name="name"
                onChange={this.handleChange}
              />
              {errors.name && <span className="error">{errors.name}</span>}
            </Form.Group>

            <Form.Group>
              <Form.Label className="mb-0">Email</Form.Label>
              <Form.Control
                className="mt-0"
                name="email"
                type="email"
                onChange={this.handleChange}
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </Form.Group>

            <Form.Group>
              <Form.Label className="mb-0">Phone Number</Form.Label>
              <Form.Control
                className="mt-0"
                name="phone"
                type="tel"
                onChange={this.handleChange}
              />
              {errors.phone && <span className="error">{errors.phone}</span>}
            </Form.Group>

            <Form.Group>
              <Form.Label className="mb-0">Password</Form.Label>
              <Form.Control
                className="mt-0"
                name="password"
                type="password"
                onChange={this.handleChange}
              />
              {errors.password && (
                <span className="error">{errors.password}</span>
              )}
            </Form.Group>

            <Row className="justify-content-center">
              <Button
                disabled={!isEnabled}
                className="splash-form-button"
                type="submit"
              >
                Register
              </Button>
            </Row>
          </form>
        </Row>

        <Row className="mt-4 justify-content-center">
          <Nav.Link className="green-theme-text" href="login">
            Already have an account? Log In
          </Nav.Link>
        </Row>

        <Navbar
          className="paper-shadow-class footer-bg justify-content-center"
          fixed="bottom"
        >
          <Nav className="justify-content-around">
            <Nav.Link
              className="green-theme-text"
              style={{ fontSize: "0.8rem" }}
              href="#"
            >
              TradeGo.Live by TradeGO Developers
            </Nav.Link>
          </Nav>
          {/* <Nav>
            <Nav.Link
              className="green-theme-text"
              href="#"
            >
              <FontAwesomeIcon icon={faLinkedin} />
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link
              className="green-theme-text"
              href="#"
            >
              <FontAwesomeIcon className="fa-1.5x" icon={faGithub} />
            </Nav.Link>
          </Nav> */}
        </Navbar>
      </Container>
    );
  }
}

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  error: state.error
});

export default connect(mapStateToProps, { register, clearErrors })(Register);
