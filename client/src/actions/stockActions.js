//actions are where we actually make request to backend
import axios from "axios";
import {
  GET_STOCKS,
  ADD_STOCK,
  DELETE_STOCK,
  STOCKS_LOADING,
  SEARCH_STOCK,
  BUY_SUCCESS,
  UPDATE_BALANCE // ✅ Add this action type

} from "./types";
import { tokenConfig } from "./authActions";
import { refreshUserData } from "./userActions";
import { returnErrors } from "./errorActions";
import store from "../store";

// the return is where we're implementing the action.type that's seen in the reducer.
// type is how you identify the action

// we call these actions from within the component
export const getStocks = user => dispatch => {
  axios
    .post("/api/stocks/find", user)
    .then(res =>
      dispatch({
        type: GET_STOCKS,
        payload: res.data
      })
    )
    .catch(err =>
      dispatch(returnErrors(err.response.data, err.response.status))
    );

  return {
    type: GET_STOCKS
  };
};

// stock passed in from submit
// You can include getState as a second argument in dispatch to get the current state
export const addStock = stock => (dispatch, getState) => {
  axios
    .post("/api/stocks/add", stock, tokenConfig(getState))
    .then(res =>
      dispatch({
        type: ADD_STOCK,
        payload: res.data
      })
    )
    .catch(err =>
      dispatch(returnErrors(err.response.data, err.response.status))
    );

  return {
    type: ADD_STOCK,
    payload: stock
  };
};

export const buyStock = stock => async (dispatch, getState) => {
  try {
    const res = await axios.post("/api/stocks/buy", stock, tokenConfig(getState));

    // ✅ Update balance directly
    dispatch({
      type: UPDATE_BALANCE,
      payload: res.data.newBalance
    });

    dispatch({
      type: BUY_SUCCESS,
      payload: res.data.stock // stock info from backend
    });

    // ✅ OPTIONAL: Refresh user data (if needed elsewhere)
    dispatch(refreshUserData());
  } catch (err) {
    dispatch(returnErrors(err.response?.data, err.response?.status));
  }
};



export const searchStock = stock => (dispatch, getState) => {
  axios
    .post("/api/iex", tokenConfig(getState))
    .then(res =>
      dispatch({
        type: SEARCH_STOCK,
        payload: res.data
      })
    )
    .catch(err =>
      dispatch(returnErrors(err.response.data, err.response.status))
    );

  return {
    type: SEARCH_STOCK,
    payload: stock
  };
};

// return to reducer
export const deleteStock = stock => (dispatch, getState) => {
  const state = store.getState();
  axios
    .post(`/api/stocks/delete`, stock, tokenConfig(getState))
    .then(res =>
      dispatch({
        type: DELETE_STOCK,
        payload: res.data
      })
    )
    .then(() => dispatch(refreshUserData(state.auth.user)))
    .catch(err =>
      dispatch(returnErrors(err.response.data, err.response.status))
    );

  return {
    type: DELETE_STOCK,
    payload: stock
  };
};

export const setStocksLoading = () => {
  return {
    type: STOCKS_LOADING
  };
};
