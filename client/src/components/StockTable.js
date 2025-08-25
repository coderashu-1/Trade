import React, { Component } from "react";
import { connect } from "react-redux";
import { getStocks, deleteStock } from "../actions/stockActions";
import { refreshUserData } from "../actions/userActions";
import { startLoading, endLoading } from "../actions/loadingActions";
import { Row, Button, Table, Alert, Container } from "react-bootstrap";
import PropTypes from "prop-types";
import ReactModal from "react-modal";
import NumberFormat from "react-number-format";
import TestChart from "./TestChart";
import { Link } from "react-router-dom";

ReactModal.setAppElement("#root");

const customStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.25)"
  },
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)"
  }
};

class StockTable extends Component {
  constructor() {
    super();
    this.state = {
      confirmSell: false,
      showModal: false,
      activeItem: ""
    };

    this.handleCloseModal = this.handleCloseModal.bind(this);
  }

  static propTypes = {
    getStocks: PropTypes.func.isRequired,
    deleteStock: PropTypes.func.isRequired,
    stock: PropTypes.object.isRequired,
    isAuthenticated: PropTypes.bool,
    auth: PropTypes.object.isRequired,
    error: PropTypes.object.isRequired,
    success: PropTypes.object,
    user: PropTypes.object,
    isLoading: PropTypes.bool
  };

  componentDidMount() {
    if (this.props.auth) {
      this.props.getStocks(this.props.auth.user);
      this.props.refreshUserData(this.props.auth.user);
    }
  }

  toggle = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  onDeleteClick = async stock => {
    this.handleCloseModal();
    this.props.startLoading();
    let price = 0;

    try {
      const searchStock = await fetch(
        `https://cloud.iexapis.com/v1/stock/${stock.ticker}/quote/2?token=pk_764a7652cfde425785b349da624c23ac`,
        { mode: "cors" }
      );
      const response = await searchStock.json();
      price = response.latestPrice;
    } catch (error) {
      this.props.endLoading();
      alert("Couldn't sell stock");
      return;
    }

    const stockDelete = {
      user: this.props.auth.user,
      id: stock._id,
      price,
      quantity: stock.quantity,
      ticker: stock.ticker
    };

    await this.props.deleteStock(stockDelete);
    await this.props.refreshUserData(this.props.auth.user);
    this.props.endLoading();
  };

  handleOpenModal = item => {
    this.setState({ showModal: true, activeItem: item });
  };

  handleCloseModal() {
    this.setState({ showModal: false, activeItem: "" });
  }

  render() {
    const { stocks } = this.props.stock;

    return (
      <Container style={{ opacity: this.props.isLoading ? 0.5 : 1 }}>
        <Row className="mt-4 mb-2 justify-content-center">
          <h1>Portfolio</h1>
        </Row>
        <Row className="mb-2 justify-content-center">
          <TestChart />
        </Row>

        {this.state.msg && (
          <Alert variant="danger">{this.state.msg}</Alert>
        )}

        {stocks.length ? (
          <Container>
            <Table
              variant="dark"
              className="paper-shadow-class stock-table-background"
              aria-label="simple table"
            >
              <thead className="stock-table-header">
                <tr>
                  <th className="hide-on-mobile">Stock</th>
                  <th>Symbol</th>
                  <th>Buy Price</th>
                  <th>Quantity</th>
                  <th className="hide-on-mobile">Total</th>
                  <th className="hide-on-mobile">Outcome</th>
                  <th>Sell</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map(item => (
                  <tr className="stock-table-row" key={item._id}>
                    <td className="hide-on-mobile">{item.stock}</td>
                    <td>{item.ticker}</td>
                    <td>
                      {Number(item.price).toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD"
                      })}
                    </td>
                    <td>
                      <NumberFormat
                        value={item.quantity}
                        displayType={"text"}
                        thousandSeparator={true}
                      />
                    </td>
                    <td className="hide-on-mobile">
                      {Number(item.value).toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD"
                      })}
                    </td>
                    <td className="hide-on-mobile">
                      {item.data ? (
                        <>
                          <div>
                            <strong>Dir:</strong> {item.data.direction ?? "-"}
                          </div>
                          <div>
                            <strong>Outcome:</strong> {item.data.outcome ?? "-"}
                          </div>
                          <div>
                            <strong>Price:</strong>{" "}
                            {item.data.resultPrice != null
                              ? `$${item.data.resultPrice.toFixed(2)}`
                              : "-"}
                          </div>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => this.handleOpenModal(item)}
                      >
                        Sell
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Container>
        ) : (
          <Container>
            <Row className="justify-content-center">
              <p>You don't currently own any stocks!</p>
            </Row>
            <Row className="justify-content-center">
              <Link to="/buy">
                <Button className="splash-form-button" type="button">
                  Buy Stocks
                </Button>
              </Link>
            </Row>
          </Container>
        )}

        <ReactModal
          isOpen={this.state.showModal}
          contentLabel="onRequestClose Example"
          onRequestClose={this.handleCloseModal}
          style={customStyles}
        >
          <p>
            Are you sure you want to sell {this.state.activeItem.quantity}{" "}
            share(s) of {this.state.activeItem.ticker} at the current market
            price?
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => this.onDeleteClick(this.state.activeItem)}
          >
            Confirm sale
          </Button>
        </ReactModal>
      </Container>
    );
  }
}

const mapStateToProps = state => ({
  stock: state.stock,
  isAuthenticated: state.auth.isAuthenticated,
  auth: state.auth,
  error: state.error,
  success: state.success,
  user: state.user,
  isLoading: state.loading.isLoading
});

export default connect(mapStateToProps, {
  getStocks,
  deleteStock,
  refreshUserData,
  startLoading,
  endLoading
})(StockTable);
