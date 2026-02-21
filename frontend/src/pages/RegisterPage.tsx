import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "../api/axios";
import { toast } from "react-hot-toast";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name is too short"),
  lastName: z.string().min(2, "Last name is too short"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["RESEARCHER"]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "RESEARCHER" },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await api.post("/auth/register", data);
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="dark flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[hsl(var(--bg-main))] text-[hsl(var(--text-main))] transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 p-10 bg-[hsl(var(--bg-card))] rounded-3xl shadow-2xl border border-[hsl(var(--border-subtle))] backdrop-blur-xl">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-[hsl(var(--text-main))] uppercase italic">
            XploitArena
          </h2>
          <p className="mt-3 text-sm text-[hsl(var(--text-muted))] font-bold uppercase tracking-widest">
            Join the elite arena
          </p>
        </div>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5 ml-1">
                First Name
              </label>
              <input
                {...register("firstName")}
                placeholder="John"
                className="block w-full rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.03] px-4 py-3.5 text-[hsl(var(--text-main))] placeholder-[hsl(var(--text-muted))]/40 focus:border-indigo-500/50 focus:bg-[hsl(var(--text-main))]/[0.06] sm:text-sm transition-all outline-none"
              />
              {errors.firstName && (
                <p className="mt-1.5 text-[10px] text-rose-500 font-bold uppercase tracking-tight ml-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5 ml-1">
                Last Name
              </label>
              <input
                {...register("lastName")}
                placeholder="Doe"
                className="block w-full rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.03] px-4 py-3.5 text-[hsl(var(--text-main))] placeholder-[hsl(var(--text-muted))]/40 focus:border-indigo-500/50 focus:bg-[hsl(var(--text-main))]/[0.06] sm:text-sm transition-all outline-none"
              />
              {errors.lastName && (
                <p className="mt-1.5 text-[10px] text-rose-500 font-bold uppercase tracking-tight ml-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5 ml-1">
              Email address
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="hacker@xploitarena.com"
              className="block w-full rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.03] px-4 py-3.5 text-[hsl(var(--text-main))] placeholder-[hsl(var(--text-muted))]/40 focus:border-indigo-500/50 focus:bg-[hsl(var(--text-main))]/[0.06] sm:text-sm transition-all outline-none"
            />
            {errors.email && (
              <p className="mt-1.5 text-[10px] text-rose-500 font-bold uppercase tracking-tight ml-1">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5 ml-1">
              Password
            </label>
            <input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className="block w-full rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.03] px-4 py-3.5 text-[hsl(var(--text-main))] placeholder-[hsl(var(--text-muted))]/40 focus:border-indigo-500/50 focus:bg-[hsl(var(--text-main))]/[0.06] sm:text-sm transition-all outline-none"
            />
            {errors.password && (
              <p className="mt-1.5 text-[10px] text-rose-500 font-bold uppercase tracking-tight ml-1">
                {errors.password.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5 ml-1">
              Account Type
            </label>
            <select
              {...register("role")}
              className="block w-full rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-card))] px-4 py-3.5 text-[hsl(var(--text-main))] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 sm:text-sm transition-all outline-none appearance-none cursor-pointer"
            >
              <option
                value="RESEARCHER"
                className="bg-[hsl(var(--bg-card))] text-[hsl(var(--text-main))]"
              >
                Researcher (Hacker)
              </option>
            </select>
          </div>

          <div className="pt-2">
            <button
              disabled={isSubmitting}
              type="submit"
              className="group relative flex w-full justify-center rounded-2xl bg-indigo-600 px-4 py-4 text-xs font-black text-white hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[hsl(var(--bg-main))] transition-all duration-300 disabled:opacity-50 uppercase tracking-[0.2em] italic shadow-lg shadow-indigo-600/20"
            >
              {isSubmitting ? "Registering..." : "Sign up"}
            </button>
          </div>
        </form>
        <p className="text-center text-[11px] text-[hsl(var(--text-muted))] font-bold uppercase tracking-widest">
          Already a legend?{" "}
          <a
            href="/login"
            className="text-indigo-400 hover:text-indigo-300 transition-colors underline decoration-2 underline-offset-4"
          >
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
