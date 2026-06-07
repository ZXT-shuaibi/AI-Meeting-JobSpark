export interface HireSparkAuthUserDto {
  id?: string | number | null;
  username?: string | null;
  realName?: string | null;
  avatarUrl?: string | null;
}

export interface HireSparkAuthSessionDto {
  token?: string | null;
  refreshToken?: string | null;
  expiresIn?: number | string | null;
  user?: HireSparkAuthUserDto | null;
}

export interface HireSparkAuthUser {
  id: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface HireSparkAuthSession {
  accessToken: string | null;
  refreshToken: string | null;
  expiresInSeconds: number | null;
  user: HireSparkAuthUser | null;
}

const normalizeString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
};

const normalizeNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const mapHireSparkAuthUser = (
  payload: HireSparkAuthUserDto | null | undefined,
): HireSparkAuthUser | null => {
  if (!payload) {
    return null;
  }

  return {
    id: normalizeString(payload.id),
    username: normalizeString(payload.username),
    displayName:
      normalizeString(payload.realName) ?? normalizeString(payload.username),
    avatarUrl: normalizeString(payload.avatarUrl),
  };
};

export const mapHireSparkAuthSession = (
  payload: HireSparkAuthSessionDto,
): HireSparkAuthSession => ({
  accessToken: normalizeString(payload.token),
  refreshToken: normalizeString(payload.refreshToken),
  expiresInSeconds: normalizeNumber(payload.expiresIn),
  user: mapHireSparkAuthUser(payload.user),
});
