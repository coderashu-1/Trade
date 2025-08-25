// actions/userActions.js
import axios from "axios";
import { REFRESH_USER_DATA } from "./types";
import { returnErrors } from "./errorActions";

export const refreshUserData = () => async (dispatch, getState) => {
  const userId = getState()?.auth?.user?._id;

  if (!userId) {
    console.warn("❌ No user ID in state");
    return;
  }

  try {
    const res = await axios.post("/api/user/data", { id: userId }); // ✅ send correct ID

    dispatch({
      type: REFRESH_USER_DATA,
      payload: res.data
    });
  } catch (err) {
    dispatch(returnErrors(err.response.data, err.response.status));
  }
};
