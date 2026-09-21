import axios from "axios";
import { userAuthStore } from "@/store/Auth";

export async function withFreshJWT(request, onSessionExpired) {
  async function refresh() {
    try {
      return await userAuthStore.getState().refreshJWT();
    } catch (error) {
      if (error.code === 401) onSessionExpired();
      throw error;
    }
  }

  const token = userAuthStore.getState().jwt || await refresh();
  try {
    return await request(token);
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      throw error;
    }
    const freshToken = await refresh();
    return await request(freshToken);
  }
}
