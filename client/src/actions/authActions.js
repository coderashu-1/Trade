import axios from "axios";
import { returnErrors } from "./errorActions";
import { refreshUserData } from "./userActions";
import store from "../store";
import {
  USER_LOADING,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT_SUCCESS,
  REGISTER_SUCCESS,
  REGISTER_FAIL
} from "../actions/types";

// ✅ Check token and load user
export const loadUser = () => (dispatch, getState) => {
  dispatch({ type: USER_LOADING });

  axios
    .get("/api/authorize/user", tokenConfig(getState)) // FIXED: use GET not POST
    .then(res =>
      dispatch({
        type: USER_LOADED,
        payload: res.data // only user object, no token here
      })
    )
    .then(() => {
      const state = store.getState();
      console.log("state after loadUser: " + JSON.stringify(state));
      dispatch(refreshUserData());
    })
    .catch(err => {
      dispatch(returnErrors(err));
      dispatch({ type: AUTH_ERROR });
    });
};

// ✅ Register user
export const register = ({ name, email, password }) => dispatch => {
  dispatch({ type: USER_LOADING });

  const config = {
    headers: { "Content-type": "application/json" }
  };

  const body = JSON.stringify({ name, email, password });

  axios
    .post("/api/user", body, config)
    .then(res =>
      dispatch({
        type: REGISTER_SUCCESS,
        payload: res.data
      })
    )
    .catch(err => {
      dispatch(
        returnErrors(err.response.data, err.response.status, "REGISTER_FAIL")
      );
      dispatch({ type: REGISTER_FAIL });
    });
};

// ✅ Login user
export const login = ({ email, password }) => dispatch => {
  dispatch({ type: USER_LOADING });

  const config = {
    headers: { "Content-type": "application/json" }
  };

  const body = JSON.stringify({ email, password });

  axios
    .post("/api/authorize", body, config)
    .then(res =>
      dispatch({
        type: LOGIN_SUCCESS,
        payload: res.data
      })
    )
    .catch(err => {
      dispatch(
        returnErrors(err.response.data, err.response.status, "LOGIN_FAIL")
      );
      dispatch({ type: LOGIN_FAIL });
    });
};

// ✅ Logout User
export const logout = () => {
  return { type: LOGOUT_SUCCESS };
};

// ✅ Helper: set headers + token
export const tokenConfig = getState => {
  const token = getState().auth.token;

  const config = {
    headers: { "Content-type": "application/json" }
  };

  if (token) {
    config.headers["auth-token"] = token;
  }

  return config;
};
