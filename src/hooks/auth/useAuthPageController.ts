import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearError, loginUser } from "@/store/slices/userSlice";

export type AuthMode = "login" | "register";

export type AuthFormData = {
  username: string;
  password: string;
  confirmPassword: string;
};

const initialFormData: AuthFormData = {
  username: "",
  password: "",
  confirmPassword: "",
};

const REQUIRED_FIELDS_MESSAGE = "Please enter your username and password.";
const REGISTER_UNAVAILABLE_MESSAGE =
  "Registration is not available in this phase.";

type AuthRedirectState = {
  from?: {
    pathname?: string;
    search?: string;
    hash?: string;
  };
};

const normalizeInAppRedirect = (value: unknown): string | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const pathnameValue =
    "pathname" in value && typeof value.pathname === "string"
      ? value.pathname.trim()
      : "";
  if (
    !pathnameValue ||
    !pathnameValue.startsWith("/") ||
    pathnameValue.startsWith("//")
  ) {
    return null;
  }

  const searchValue =
    "search" in value && typeof value.search === "string"
      ? value.search.trim()
      : "";
  const hashValue =
    "hash" in value && typeof value.hash === "string" ? value.hash.trim() : "";

  return `${pathnameValue}${searchValue}${hashValue}`;
};

export function useAuthPageController() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [formData, setFormData] = useState<AuthFormData>(initialFormData);
  const [registerLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated } = useAppSelector(
    (state) => state.user,
  );

  useEffect(() => {
    if (isAuthenticated) {
      const redirectState = location.state as AuthRedirectState | null;
      const redirectPath =
        normalizeInAppRedirect(redirectState?.from) ?? ROUTES.career;
      navigate(redirectPath, { replace: true });
    }
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, location.state, navigate, dispatch]);

  const switchMode = (nextMode: AuthMode) => {
    if (nextMode === "register") {
      setMode("login");
      setLocalError(REGISTER_UNAVAILABLE_MESSAGE);
      dispatch(clearError());
      return;
    }

    setMode(nextMode);
    setLocalError("");
    dispatch(clearError());
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLocalError("");
    if (error) {
      dispatch(clearError());
    }
  };

  const handleSubmit = async () => {
    if (!formData.username || !formData.password) {
      setLocalError(REQUIRED_FIELDS_MESSAGE);
      return;
    }

    if (mode !== "login") {
      setLocalError(REGISTER_UNAVAILABLE_MESSAGE);
      return;
    }

    dispatch(
      loginUser({ username: formData.username, password: formData.password }),
    );
  };

  return {
    mode,
    isLogin: mode === "login",
    formData,
    loading,
    error,
    registerLoading,
    localError,
    switchMode,
    handleInputChange,
    handleSubmit,
  };
}
