import service from "@/lib/request";
import { clearAuthToken, getAuthToken, setAuthToken } from "@/lib/authToken";
import { AppError, ErrorCode } from "@/lib/errors";
import type {
  AuthPayloadDTO,
  ResultVoid,
  UserLoginReqDTO,
  UserRegisterReqDTO,
  UserRespDTO,
} from "@/types/auth";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") return Number.isNaN(value) ? undefined : value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const toString = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return undefined;
};

const normalizeLegacyUser = (raw: unknown): UserRespDTO | null => {
  if (!isRecord(raw)) return null;

  const username = toString(raw.username) || "";
  if (!username) return null;

  return {
    id: toNumber(raw.id),
    username,
    realName: toString(raw.realName ?? raw.real_name),
    phone: toString(raw.phone),
    mail: toString(raw.mail),
    avatar: toString(raw.avatar),
    deletionTime: toNumber(raw.deletionTime ?? raw.deletion_time),
    createTime: toString(raw.createTime ?? raw.create_time),
    updateTime: toString(raw.updateTime ?? raw.update_time),
    delFlag: toNumber(raw.delFlag ?? raw.del_flag) as 0 | 1 | undefined,
  };
};

const normalizeCurrentUser = (raw: unknown): UserRespDTO | null => {
  if (!isRecord(raw)) return null;

  const username = toString(raw.username) || toString(raw.userId) || "";
  if (!username) return null;

  return {
    id: toNumber(raw.id ?? raw.userId),
    username,
    realName: toString(raw.realName ?? raw.real_name),
    phone: toString(raw.phone),
    mail: toString(raw.mail),
    avatar: toString(raw.avatar),
    deletionTime: toNumber(raw.deletionTime ?? raw.deletion_time),
    createTime: toString(raw.createTime ?? raw.create_time),
    updateTime: toString(raw.updateTime ?? raw.update_time),
    delFlag: toNumber(raw.delFlag ?? raw.del_flag) as 0 | 1 | undefined,
  };
};

const extractUserFromAuthPayload = (payload: unknown): UserRespDTO | null => {
  const direct = normalizeCurrentUser(payload) || normalizeLegacyUser(payload);
  if (direct) return direct;
  if (!isRecord(payload)) return null;
  return (
    normalizeCurrentUser(payload.user) ||
    normalizeCurrentUser(payload.currentUser) ||
    normalizeCurrentUser(payload.data) ||
    normalizeLegacyUser(payload.user) ||
    normalizeLegacyUser(payload.currentUser) ||
    normalizeLegacyUser(payload.data)
  );
};

const extractTokenFromAuthPayload = (payload: unknown): string | null => {
  if (!isRecord(payload)) return null;

  const directToken = toString(
    payload.token ?? payload.accessToken ?? payload.authToken,
  )?.trim();
  if (directToken) return directToken;

  const nestedData = payload.data;
  if (isRecord(nestedData)) {
    const nestedToken = toString(
      nestedData.token ?? nestedData.accessToken ?? nestedData.authToken,
    )?.trim();
    if (nestedToken) return nestedToken;
  }

  return null;
};

export const authService = {
  login: async (data: UserLoginReqDTO) => {
    const payload = await service.post<AuthPayloadDTO>("/auth/login", data);
    const token = extractTokenFromAuthPayload(payload);
    if (!token) {
      throw new Error("Login succeeded but token is missing");
    }

    setAuthToken(token);
    try {
      return await authService.checkLogin();
    } catch (error) {
      if (getAuthToken() === token) {
        clearAuthToken();
      }
      throw error;
    }
  },

  register: async (data: UserRegisterReqDTO) => {
    void data;
    throw new Error("Registration is not available in this phase.");
  },

  checkLogin: async () => {
    const payload = await service.get<AuthPayloadDTO>("/user/me");
    const user = extractUserFromAuthPayload(payload);
    if (!user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "User is not logged in");
    }
    return user;
  },

  logout: async () => {
    try {
      return await service.post<ResultVoid>("/auth/logout");
    } finally {
      clearAuthToken();
    }
  },
};
