import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faGithub } from "@fortawesome/free-brands-svg-icons";
import { Nav, Row, Col, Navbar } from "react-bootstrap";

export default class Footerv2 extends Component {
  render() {
    return (
      <div>
        <footer className="main-app-footer hide-on-mobile">
          <Navbar className="footer-bg justify-content-center">
            <Nav className="justify-content-around">
              <Nav.Link
                className="green-theme-text"
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
            </Nav> */}
            {/* <Nav>
              <Nav.Link
                className="green-theme-text"
                href="#"
              >
                <FontAwesomeIcon className="fa-1.5x" icon={faGithub} />
              </Nav.Link>
            </Nav> */}

            {/* <Nav.Link
              className="green-theme-text"
              style={{ fontStyle: "italic" }}
              href="https://iexcloud.io"
            >
              Data provided by IEX Cloud
            </Nav.Link> */}
          </Navbar>
        </footer>
        <footer className="main-app-footer hide-on-desktop">
          <Row className="justify-content-center">
            <Nav.Link
              className="green-theme-text"
              style={{ fontSize: "1rem" }}
              href="#"
            >
              TradeGo.Live by TradeGO Developers
            </Nav.Link>

            {/* <Nav.Link
              className="green-theme-text"
              href="#"
            >
              <FontAwesomeIcon icon={faLinkedin} />
            </Nav.Link>

            <Nav.Link
              className="green-theme-text"
              href="#"
            >
              <FontAwesomeIcon className="fa-1.5x" icon={faGithub} />
            </Nav.Link> */}
          </Row>
          <Row className="justify-content-center">
            <Col xs={12}>
              <Nav className="justify-content-around">
                <Nav.Link
                  className="green-theme-text"
                  style={{
                    fontStyle: "italic",
                    fontSize: "0.8rem",
                    paddingTop: "0px"
                  }}
                  href="https://iexcloud.io"
                >
                  Data provided by IEX Cloud
                </Nav.Link>
              </Nav>
            </Col>
          </Row>
        </footer>
      </div>
    );
  }
}
