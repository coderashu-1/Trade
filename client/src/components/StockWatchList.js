import React, { Component } from "react";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";

// Stock symbols mapped to names
const stockList = [
  { name: "Facebook", symbol: "META" },
  { name: "Amazon", symbol: "AMZN" },
  { name: "Apple", symbol: "AAPL" },
  { name: "Netflix", symbol: "NFLX" },
  { name: "Google", symbol: "GOOGL" }
];

export default class StockWatchList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stocks: []
    };
  }

  componentDidMount() {
    this.fetchStockPrices();
  }

  fetchStockPrices = async () => {
    const apiKey = process.env.REACT_APP_alphaVantageKey;

    const results = await Promise.all(
      stockList.map(async ({ name, symbol }) => {
        try {
          const res = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
          );
          const data = await res.json();
          const price = parseFloat(data["Global Quote"]["05. price"]);
          return { name, symbol, price: price.toFixed(2) };
        } catch (err) {
          console.error(`Failed to fetch price for ${name}:`, err);
          return { name, symbol, price: "N/A" };
        }
      })
    );

    this.setState({ stocks: results });
  };

  handleRemove = (symbol) => {
    this.setState((prev) => ({
      stocks: prev.stocks.filter((stock) => stock.symbol !== symbol)
    }));
  };

  render() {
    const { stocks } = this.state;
    return (
      <div className="stockWatchListContainer">
        <TableContainer component={Paper}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell align="right">Stock</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stocks.map(({ name, symbol, price }) => (
                <TableRow key={symbol}>
                  <TableCell align="right">{name}</TableCell>
                  <TableCell align="right">${price}</TableCell>
                  <TableCell align="right">
                    <Button
                      onClick={() => this.handleRemove(symbol)}
                      color="secondary"
                    >
                      X
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  }
}
