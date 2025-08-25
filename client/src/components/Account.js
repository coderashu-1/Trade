import React, { Component } from "react";
import StockHistory from "./StockHistory";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import NavBar from "./NavBar";
import { refreshUserData } from "../actions/userActions";
import Footerv2 from "./Footerv2";

class Account extends Component {
  state = {
    msg: null,
    alertOpen: false,
    isLoading: false
  };

  static propTypes = {
    auth: PropTypes.object.isRequired,
    error: PropTypes.object,
    isLoading: PropTypes.bool,
    user: PropTypes.object,
    refreshUserData: PropTypes.func.isRequired
  };

  componentDidMount() {
    const { auth, refreshUserData } = this.props;
    if (auth?.user) {
      refreshUserData(auth.user);
    }
  }

  render() {
    return (
      <div>
        <NavBar />
        <StockHistory />
        <Footerv2 />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  auth: state.auth,
  error: state.error,
  isLoading: state.auth.isLoading,
  user: state.auth.user
});

export default connect(mapStateToProps, { refreshUserData })(Account);
