import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { Container, Row, Col, Card } from "react-bootstrap";

import NavBar from "./NavBar";
import Footerv2 from "./Footerv2";
import StockTable from "./StockTable";
import StockNews from "./StockNews";
import TradingChart from "./TradingChart";
import LiveQuotes from "./LiveQuotes";
import MarketOverview from "./MarketOverview"; // New: Live market indices summary
import TrendingAssets from "./TrendingAssets"; // New: Top movers

class Home extends Component {
  state = {
    isLoading: false
  };

  static propTypes = {
    auth: PropTypes.object.isRequired,
    error: PropTypes.object,
    isLoading: PropTypes.bool,
    user: PropTypes.object
  };

  render() {
    return (
      <div className="home-page">
        <NavBar />

        <Container fluid className="mt-4 mb-5">
          {/* Main Section: Chart Full Width */}
          <Row className="mb-4">
            <Col xs={12}>
              <TradingChart />
            </Col>
          </Row>
          {/* Market Overview */}
          <Row className="mb-4">
            <Col>
              <MarketOverview />
            </Col>
          </Row>
          {/* Trending Assets */}
          <Row className="mb-4">
            <Col>
              <TrendingAssets />
            </Col>
          </Row>

          {/* Live Quotes / Top Bar */}
          <Row className="mb-4">
            <Col>
              <LiveQuotes />
            </Col>
          </Row>
          {/* News Section */}
          <Row className="mb-4">
            <Col>
              <StockNews />
            </Col>
          </Row>


        </Container>

        <Footerv2 />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth,
  error: state.error,
  isLoading: state.auth.isLoading,
  user: state.user
});

export default connect(mapStateToProps)(Home);
