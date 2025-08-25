import React, { Component } from "react";
import { connect } from "react-redux";
import {
  Row,
  Alert,
  Col,
  Container,
  Tabs,
  Tab
} from "react-bootstrap";
import PropTypes from "prop-types";
import { refreshUserData } from "../actions/userActions";

class StockHistory extends Component {
  state = {
    activeTab: "account",
    msg: null
  };

  static propTypes = {
    stock: PropTypes.object.isRequired,
    isAuthenticated: PropTypes.bool,
    auth: PropTypes.object.isRequired,
    error: PropTypes.object.isRequired,
    success: PropTypes.object,
    user: PropTypes.object.isRequired,
    refreshUserData: PropTypes.func
  };

  formatCustomDate = (dateStr) => {
    return dateStr ? dateStr : "Not available";
  };

  render() {
    const { user } = this.props;
    const { activeTab } = this.state;

    const tabStyle = (key) => ({
      color: activeTab === key ? "grey" : "rgb(33, 206, 153)",
      fontWeight: activeTab === key ? "bold" : "normal"
    });

    return (
      <Container className="mt-4">
        <Tabs
          id="account-betting-tabs"
          activeKey={activeTab}
          onSelect={(key) => this.setState({ activeTab: key })}
          className="mb-4"
        >
          <Tab
            eventKey="account"
            title={<span style={tabStyle("account")}>Account Info</span>}
          >
            {user ? (
              <>
                <Row className="justify-content-center mt-3">
                  <h3 style={{ color: "rgb(33, 206, 153)" }}>Account Information</h3>
                </Row>
                <Row className="mt-3 justify-content-center">
                  <p style={{ color: "rgb(33, 206, 153)" }}>
                    <strong>Name:</strong> {user.name}
                  </p>
                </Row>
                <Row className="mt-2 justify-content-center">
                  <p style={{ color: "rgb(33, 206, 153)" }}>
                    <strong>Email:</strong> {user.email}
                  </p>
                </Row>
                <Row className="mt-2 justify-content-center">
                  <p style={{ color: "rgb(33, 206, 153)" }}>
                    <strong>Current Balance:</strong>{" "}
                    {user.balance?.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD"
                    })}
                  </p>
                </Row>
                <Row className="mt-2 mb-3 justify-content-center">
                  <p style={{ color: "rgb(33, 206, 153)" }}>
                    <strong>Account created on:</strong> {this.formatCustomDate(user.date)}
                  </p>
                </Row>
              </>
            ) : (
              <Row className="justify-content-center">
                <p>Loading user information...</p>
              </Row>
            )}
          </Tab>

          <Tab
            eventKey="betting"
            title={<span style={tabStyle("betting")}> History</span>}
          >
            <Row className="justify-content-center mt-3">
              <h3 style={{ color: "rgb(33, 206, 153)" }}>Betting History</h3>
            </Row>
            {this.state.msg && (
              <Alert variant="danger">{this.state.msg}</Alert>
            )}
            {user && user.history && user.history.length > 0 ? (
              user.history.map((item, index) => (
                <Row key={index} className="mt-2 mb-2 justify-content-center">
                  <Col xs={11} lg={12}>
                    <p
                      style={{
                        color: "rgb(33, 206, 153)",
                        textAlign: "center",
                        border: "1px solid rgba(33, 206, 153, 0.5)",
                        borderRadius: "8px",
                        padding: "10px"
                      }}
                    >
                      {item}
                    </p>
                  </Col>
                </Row>
              ))
            ) : (
              <Row className="justify-content-center mt-3">
                <p>No betting history found.</p>
              </Row>
            )}
          </Tab>
        </Tabs>
      </Container>
    );
  }
}

const mapStateToProps = (state) => ({
  stock: state.stock,
  isAuthenticated: state.auth.isAuthenticated,
  auth: state.auth,
  error: state.error,
  success: state.success,
  user: state.auth.user
});

export default connect(mapStateToProps, { refreshUserData })(StockHistory);
