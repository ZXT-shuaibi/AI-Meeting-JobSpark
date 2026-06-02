import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type {
  AuthFormData,
  AuthMode,
} from "@/hooks/auth/useAuthPageController";

type AuthFormCardProps = {
  mode: AuthMode;
  formData: AuthFormData;
  errorMessage: string;
  isSubmitting: boolean;
  showPreviewEntry?: boolean;
  onSwitchMode: (mode: AuthMode) => void;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
};

export default function AuthFormCard({
  mode,
  formData,
  errorMessage,
  isSubmitting,
  showPreviewEntry = false,
  onSwitchMode,
  onInputChange,
  onSubmit,
}: AuthFormCardProps) {
  const isLogin = mode === "login";

  return (
    <Card className="border-slate-100 p-8 shadow-sm">
      <div className="flex items-center gap-2 rounded-full bg-slate-100 p-1">
        <Button
          type="button"
          variant={isLogin ? "default" : "ghost"}
          className={cn("flex-1 rounded-full", !isLogin && "text-slate-500")}
          onClick={() => onSwitchMode("login")}
        >
          登录
        </Button>
        <Button
          type="button"
          variant={!isLogin ? "default" : "ghost"}
          className={cn("flex-1 rounded-full", isLogin && "text-slate-500")}
          onClick={() => onSwitchMode("register")}
        >
          注册
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-slate-500">用户名</label>
          <Input
            name="username"
            placeholder="输入你的用户名"
            value={formData.username}
            onChange={onInputChange}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-500">密码</label>
          <Input
            name="password"
            type="password"
            placeholder="输入密码"
            value={formData.password}
            onChange={onInputChange}
          />
        </div>
        {!isLogin ? (
          <div className="space-y-2">
            <label className="text-xs text-slate-500">确认密码</label>
            <Input
              name="confirmPassword"
              type="password"
              placeholder="再次输入密码"
              value={formData.confirmPassword}
              onChange={onInputChange}
            />
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-2 text-xs text-red-500">{errorMessage}</div>
        ) : null}
      </div>

      <Button
        className="mt-6 w-full rounded-full"
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isLogin ? "登录进入" : "注册并开始"}
      </Button>

      {showPreviewEntry ? (
        <Button asChild variant="outline" className="mt-3 w-full rounded-full">
          <Link to={ROUTES.previewResumeList}>直接查看内部预览</Link>
        </Button>
      ) : null}

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>登录即代表同意服务条款与隐私政策</span>
        <Link to={ROUTES.home} className="text-slate-500 hover:text-slate-700">
          返回首页
        </Link>
      </div>
    </Card>
  );
}
