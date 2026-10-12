interface LoginResponse {
  accessToken: string;
  token?: string;
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
  role?: string;
  message?: string;
}

interface UserDetailResponse {
  id: number;
  role?: string;
}

document.addEventListener("DOMContentLoaded", () => {
  // Jika sudah login, redirect otomatis sesuai peran
  const existingToken = localStorage.getItem("auth_token");
  const existingRole = localStorage.getItem("user_role");
  if (existingToken && existingRole) {
    if (existingRole === "admin" || existingRole === "moderator") {
      window.location.href = "index.html";
      return;
    } else {
      window.location.href = "operator.html";
      return;
    }
  }

  const loginForm = document.getElementById("login-form") as HTMLFormElement;
  const usernameInput = document.getElementById("username") as HTMLInputElement;
  const passwordInput = document.getElementById("password") as HTMLInputElement;
  const submitBtn = document.getElementById("btn-submit") as HTMLButtonElement;
  const errorAlert = document.getElementById("error-alert") as HTMLDivElement;

  loginForm.addEventListener("submit", async (e: Event) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      showError("Username dan password tidak boleh kosong!");
      return;
    }

    // Set Loading State
    setLoading(true);
    hideError();

    try {
      const response = await fetch("https://dummyjson.com/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          expiresInMins: 60,
        }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Username atau password salah.");
      }

      const token = data.accessToken || data.token || "";
      let role = data.role?.toLowerCase() || "";

      // Fallback: Jika payload auth/login tidak membawa role, fetch detail user
      if (!role && data.id) {
        try {
          const userRes = await fetch(`https://dummyjson.com/users/${data.id}`);
          if (userRes.ok) {
            const userData: UserDetailResponse = await userRes.json();
            role = userData.role?.toLowerCase() || "user";
          }
        } catch {
          role = "user";
        }
      }

      // Standarisasi role moderator setara admin
      if (role === "moderator") {
        role = "admin";
      } else if (!role) {
        role = "user";
      }

      // Simpan sesi ke Local Storage
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user_role", role);
      localStorage.setItem("firstName", data.firstName);
      localStorage.setItem("username", data.username);

      // Auto Redirect Berdasarkan Role
      if (role === "admin") {
        window.location.href = "index.html";
      } else {
        window.location.href = "operator.html";
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        showError(err.message);
      } else {
        showError("Terjadi kesalahan jaringan atau server.");
      }
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading: boolean) {
    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Memproses...";
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = "Masuk";
    }
  }

  function showError(message: string) {
    errorAlert.textContent = message;
    errorAlert.style.display = "block";
  }

  function hideError() {
    errorAlert.style.display = "none";
    errorAlert.textContent = "";
  }
});