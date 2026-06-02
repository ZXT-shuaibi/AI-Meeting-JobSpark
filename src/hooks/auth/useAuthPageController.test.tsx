import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/lib/constants";
import { authService } from "@/services/authService";
import { useAuthPageController } from "@/hooks/auth/useAuthPageController";
import chatReducer from "@/store/slices/chatSlice";
import {
  logoutUser,
  loginUser,
  default as userReducer,
} from "@/store/slices/userSlice";

const navigateMock = vi.fn();
const useLocationMock = vi.fn();
const servicePostMock = vi.fn();
const serviceGetMock = vi.fn();
const clearAuthTokenMock = vi.fn();
const getAuthTokenMock = vi.fn();
const setAuthTokenMock = vi.fn();

vi.mock("@/lib/request", () => ({
  default: {
    post: (...args: unknown[]) => servicePostMock(...args),
    get: (...args: unknown[]) => serviceGetMock(...args),
  },
}));

vi.mock("@/lib/authToken", () => ({
  clearAuthToken: () => clearAuthTokenMock(),
  getAuthToken: () => getAuthTokenMock(),
  setAuthToken: (...args: unknown[]) => setAuthTokenMock(...args),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => useLocationMock(),
  };
});

const createStore = () =>
  configureStore({
    reducer: {
      user: userReducer,
      chat: chatReducer,
    },
    preloadedState: {
      user: {
        currentUser: {
          id: 1,
          username: "tester",
        },
        isAuthenticated: true,
        loading: false,
        error: null,
        authEpoch: 1,
      },
      chat: {
        messages: [],
        isStreaming: false,
        error: null,
        currentSessionId: null,
        currentSessionTitle: null,
        pendingOutbound: null,
        activeStreamRequestId: null,
        activeStreamSessionId: null,
        activeStreamMessageId: null,
      },
    },
  });

const renderController = () => {
  const store = createStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return {
    store,
    ...renderHook(() => useAuthPageController(), { wrapper }),
  };
};

describe("useAuthPageController redirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthTokenMock.mockReturnValue(null);
  });

  it("redirects to the in-app from path after login", async () => {
    useLocationMock.mockReturnValue({
      state: {
        from: {
          pathname: "/career",
        },
      },
    });

    renderController();

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/career", {
        replace: true,
      });
    });
  });

  it("falls back to / when from path is unsafe", async () => {
    useLocationMock.mockReturnValue({
      state: {
        from: {
          pathname: "https://example.com",
        },
      },
    });

    renderController();

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(ROUTES.home, {
        replace: true,
      });
    });
  });

  it("keeps registration unavailable in the controller flow", async () => {
    useLocationMock.mockReturnValue({ state: null });

    const { result } = renderController();

    act(() => {
      result.current.switchMode("register");
    });

    expect(result.current.mode).toBe("login");
    expect(result.current.isLogin).toBe(true);
    expect(result.current.localError).toBe(
      "Registration is not available in this phase.",
    );
  });
});

describe("authService auth alignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in via /auth/login, stores the token, and fetches /user/me", async () => {
    servicePostMock.mockResolvedValueOnce({
      userId: "7",
      role: "candidate",
      token: "token-123",
      avatar: "avatar-login.png",
    });
    serviceGetMock.mockResolvedValueOnce({
      userId: "7",
      username: "tester",
      role: "candidate",
      avatar: "avatar-me.png",
    });

    const result = await authService.login({
      username: "tester",
      password: "secret",
    });

    expect(servicePostMock).toHaveBeenCalledWith("/auth/login", {
      username: "tester",
      password: "secret",
    });
    expect(setAuthTokenMock).toHaveBeenCalledWith("token-123");
    expect(serviceGetMock).toHaveBeenCalledWith("/user/me");
    expect(result).toMatchObject({
      id: 7,
      username: "tester",
      avatar: "avatar-me.png",
    });
  });

  it("checks authentication status via /user/me", async () => {
    serviceGetMock.mockResolvedValueOnce({
      userId: "8",
      username: "resume-owner",
      role: "candidate",
      avatar: "avatar-me.png",
    });

    const result = await authService.checkLogin();

    expect(serviceGetMock).toHaveBeenCalledWith("/user/me");
    expect(result).toMatchObject({
      id: 8,
      username: "resume-owner",
      avatar: "avatar-me.png",
    });
  });

  it("clears the stored token when /user/me fails after login", async () => {
    servicePostMock.mockResolvedValueOnce({
      userId: "7",
      role: "candidate",
      token: "token-123",
      avatar: "avatar-login.png",
    });
    serviceGetMock.mockRejectedValueOnce(new Error("me failed"));
    getAuthTokenMock.mockReturnValue("token-123");

    await expect(
      authService.login({
        username: "tester",
        password: "secret",
      }),
    ).rejects.toThrow("me failed");

    expect(setAuthTokenMock).toHaveBeenCalledWith("token-123");
    expect(clearAuthTokenMock).toHaveBeenCalledTimes(1);
  });

  it("does not clear a newer token when /user/me fails for an older login", async () => {
    servicePostMock.mockResolvedValueOnce({
      userId: "7",
      role: "candidate",
      token: "token-123",
      avatar: "avatar-login.png",
    });
    serviceGetMock.mockRejectedValueOnce(new Error("me failed"));
    getAuthTokenMock.mockReturnValue("token-456");

    await expect(
      authService.login({
        username: "tester",
        password: "secret",
      }),
    ).rejects.toThrow("me failed");

    expect(setAuthTokenMock).toHaveBeenCalledWith("token-123");
    expect(clearAuthTokenMock).not.toHaveBeenCalled();
  });

  it("logs out via /auth/logout and clears the stored token", async () => {
    servicePostMock.mockResolvedValueOnce(null);

    await authService.logout();

    expect(servicePostMock).toHaveBeenCalledWith("/auth/logout");
    expect(clearAuthTokenMock).toHaveBeenCalledTimes(1);
  });
});

describe("userSlice auth consistency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears redux auth state when logout fails after token cleanup", async () => {
    useLocationMock.mockReturnValue({ state: null });
    servicePostMock.mockRejectedValueOnce(new Error("logout failed"));
    const store = createStore();

    await store.dispatch(logoutUser());

    expect(clearAuthTokenMock).toHaveBeenCalledTimes(1);
    expect(store.getState().user).toMatchObject({
      isAuthenticated: false,
      currentUser: null,
      error: "logout failed",
    });
    expect(store.getState().user.authEpoch).toBe(2);
  });

  it("keeps redux unauthenticated when login fails after fetching the token", async () => {
    useLocationMock.mockReturnValue({ state: null });
    servicePostMock.mockResolvedValueOnce({
      userId: "9",
      role: "candidate",
      token: "token-xyz",
      avatar: "avatar-login.png",
    });
    serviceGetMock.mockRejectedValueOnce(new Error("me failed"));
    getAuthTokenMock.mockReturnValue("token-xyz");
    const store = configureStore({
      reducer: {
        user: userReducer,
        chat: chatReducer,
      },
    });

    await store.dispatch(
      loginUser({
        username: "tester",
        password: "secret",
      }),
    );

    expect(clearAuthTokenMock).toHaveBeenCalledTimes(1);
    expect(store.getState().user).toMatchObject({
      isAuthenticated: false,
      currentUser: null,
      error: "me failed",
    });
  });
});
