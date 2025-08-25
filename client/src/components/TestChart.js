import React, { Component } from "react";
import { PieChart, Pie, Sector } from "recharts";
import { connect } from "react-redux";
import PropTypes from "prop-types";

// Helper to generate a random color
function randomColor() {
  const x = Math.floor(Math.random() * 256);
  const y = Math.floor(Math.random() * 256);
  const z = Math.floor(Math.random() * 256);
  return `rgb(${x},${y},${z})`;
}

class TwoLevelPieChart extends Component {
  state = {
    activeIndex: 0
  };

  static propTypes = {
    stock: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired
  };

  // Custom rendering for the active pie sector
  renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload
    } = props;

    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={randomColor()}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <text x={ex} y={ey} textAnchor="middle" fill="rgb(33, 206, 153)">
          {`${payload.name}: ${payload.value.toLocaleString("en-US", {
            style: "currency",
            currency: "USD"
          })}`}
        </text>
      </g>
    );
  };

  onPieEnter = (_, index) => {
    this.setState({ activeIndex: index });
  };

  render() {
    const { stocks } = this.props.stock;
    const { user } = this.props.user;

    const chartData = stocks.map((stock) => ({
      name: stock.ticker,
      value: Number(stock.value)
    }));

    if (user && user.balance) {
      chartData.push({ name: "Cash", value: user.balance });
    }

    return (
      <div>
        <PieChart width={600} height={300}>
          <Pie
            activeIndex={this.state.activeIndex}
            activeShape={this.renderActiveShape}
            data={chartData}
            innerRadius={50}
            outerRadius={80}
            fill="rgb(33, 206, 153)"
            onMouseEnter={this.onPieEnter}
          />
        </PieChart>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  stock: state.stock,
  user: state.user
});

export default connect(mapStateToProps)(TwoLevelPieChart);
