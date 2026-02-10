const Auth = {
  key: "idrak_session",
  login(email) {
    const session = { email, at: Date.now() };
    localStorage.setItem(this.key, JSON.stringify(session));
  },
  logout() {
    localStorage.removeItem(this.key);
  },
  session() {
    try { return JSON.parse(localStorage.getItem(this.key)); }
    catch { return null; }
  },
  requireAuth() {
    const s = this.session();
    if (!s) window.location.href = "login.html";
    return s;
  }
};

const Cases = {
  key: "idrak_cases",
  all() {
    try { return JSON.parse(localStorage.getItem(this.key)) || []; }
    catch { return []; }
  },
  saveAll(casesArr) {
    localStorage.setItem(this.key, JSON.stringify(casesArr));
  },
  create({ title, category, priority, description, customerEmail }) {
    const casesArr = this.all();
    const id = "CASE-" + String(Date.now()).slice(-8);
    const item = {
      id,
      title,
      category,
      priority,
      description,
      customerEmail,
      status: "Open",
      createdAt: new Date().toISOString()
    };
    casesArr.unshift(item);
    this.saveAll(casesArr);
    return item;
  }
};

// UI helpers
function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return [...root.querySelectorAll(sel)]; }

function setActiveNav() {
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  $all(".nav-links a").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.setAttribute("aria-current", "page");
  });
}

function setupMobileNav() {
  const toggle = $("#mobileToggle");
  const links = $("#navLinks");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    links.classList.toggle("open");
    const expanded = links.classList.contains("open");
    toggle.setAttribute("aria-expanded", String(expanded));
  });

  // Close on navigation
  links.addEventListener("click", (e) => {
    if (e.target.matches("a")) links.classList.remove("open");
  });
}

function setupAuthUI() {
  const session = Auth.session();
  const authArea = $("#authArea");
  if (!authArea) return;

  authArea.innerHTML = "";

  if (session) {
    const wrap = document.createElement("div");
    wrap.className = "row";
    wrap.style.gap = "8px";

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = session.email;

    const portal = document.createElement("a");
    portal.className = "btn";
    portal.href = "portal.html";
    portal.textContent = "Customer Portal";

    const logout = document.createElement("button");
    logout.className = "btn danger";
    logout.type = "button";
    logout.textContent = "Logout";
    logout.addEventListener("click", () => {
      Auth.logout();
      window.location.href = "index.html";
    });

    wrap.append(badge, portal, logout);
    authArea.append(wrap);
  } else {
    const login = document.createElement("a");
    login.className = "btn primary";
    login.href = "login.html";
    login.textContent = "Login";
    authArea.append(login);
  }
}

function setupLoginPage() {
  const form = $("#loginForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#email").value.trim().toLowerCase();
    const password = $("#password").value;

    // Demo-only credential check (replace with real auth later)
    // Accept any password with a valid-looking email.
    if (!email || !email.includes("@") || password.length < 4) {
      $("#loginError").textContent = "Enter a valid email and a password (min 4 chars).";
      $("#loginError").style.display = "block";
      return;
    }

    Auth.login(email);
    window.location.href = "portal.html";
  });
}

function setupPortalPage() {
  const portalRoot = $("#portalRoot");
  if (!portalRoot) return;

  const session = Auth.requireAuth();
  $("#welcomeEmail").textContent = session.email;

  const tbody = $("#casesBody");
  const empty = $("#casesEmpty");

  function render() {
    const myCases = Cases.all().filter(c => c.customerEmail === session.email);
    tbody.innerHTML = "";

    if (myCases.length === 0) {
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    myCases.forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong style="color: rgba(234,240,255,0.92)">${c.id}</strong></td>
        <td>${escapeHtml(c.title)}</td>
        <td>${escapeHtml(c.category)}</td>
        <td>${escapeHtml(c.priority)}</td>
        <td>${escapeHtml(c.status)}</td>
        <td>${new Date(c.createdAt).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  render();
}

function setupCasePage() {
  const form = $("#caseForm");
  if (!form) return;

  const session = Auth.requireAuth();
  $("#customerEmail").value = session.email;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = $("#caseTitle").value.trim();
    const category = $("#caseCategory").value;
    const priority = $("#casePriority").value;
    const description = $("#caseDescription").value.trim();

    if (!title || !description) {
      $("#caseMsg").textContent = "Please fill in the case title and description.";
      $("#caseMsg").style.display = "block";
      $("#caseMsg").style.borderColor = "rgba(239,68,68,0.45)";
      $("#caseMsg").style.background = "rgba(239,68,68,0.12)";
      return;
    }

    const created = Cases.create({
      title, category, priority, description,
      customerEmail: session.email
    });

    $("#caseMsg").textContent = `Case created successfully: ${created.id}`;
    $("#caseMsg").style.display = "block";
    $("#caseMsg").style.borderColor = "rgba(34,197,94,0.45)";
    $("#caseMsg").style.background = "rgba(34,197,94,0.12)";

    form.reset();
    $("#customerEmail").value = session.email;
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function setupContactPage() {
  const form = $("#contactForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = $("#contactName").value.trim();
    const email = $("#contactEmail").value.trim();
    const title = $("#contactSubject").value.trim();
    const message = $("#contactMessage").value.trim();
    const msgDiv = $("#contactMsg");

    if (!name || !email || !title || !message) {
      msgDiv.textContent = document.documentElement.lang === "ar" 
        ? "يرجى ملء جميع الحقول." 
        : "Please fill in all fields.";
      msgDiv.style.display = "block";
      msgDiv.style.borderColor = "rgba(239,68,68,0.45)";
      msgDiv.style.background = "rgba(239,68,68,0.12)";
      return;
    }

    if (!email.includes("@")) {
      msgDiv.textContent = document.documentElement.lang === "ar"
        ? "يرجى إدخال بريد إلكتروني صحيح."
        : "Please enter a valid email address.";
      msgDiv.style.display = "block";
      msgDiv.style.borderColor = "rgba(239,68,68,0.45)";
      msgDiv.style.background = "rgba(239,68,68,0.12)";
      return;
    }

    // Get current date and time
    const now = new Date();
    const time = now.toLocaleString(document.documentElement.lang === "ar" ? "ar-AE" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short"
    });

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = document.documentElement.lang === "ar" ? "جاري الإرسال..." : "Sending...";

    try {
      if (typeof emailjs === 'undefined') {
        throw new Error("EmailJS not loaded");
      }

      await emailjs.send("service_yz5x9nr", "template_hnneby6", {
        title: title,
        name: name,
        message: message,
        time: time,
        email: email
      });

      msgDiv.textContent = document.documentElement.lang === "ar"
        ? "تم إرسال رسالتك بنجاح. سنرد عليك قريباً."
        : "Your message has been sent successfully. We'll get back to you soon.";
      msgDiv.style.display = "block";
      msgDiv.style.borderColor = "rgba(34,197,94,0.45)";
      msgDiv.style.background = "rgba(34,197,94,0.12)";
      form.reset();
    } catch (error) {
      console.error("EmailJS error:", error);
      msgDiv.textContent = document.documentElement.lang === "ar"
        ? "حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى أو التواصل عبر البريد الإلكتروني."
        : "An error occurred while sending. Please try again or contact us via email.";
      msgDiv.style.display = "block";
      msgDiv.style.borderColor = "rgba(239,68,68,0.45)";
      msgDiv.style.background = "rgba(239,68,68,0.12)";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  // Initialize EmailJS if available
  if (typeof emailjs !== 'undefined') {
    emailjs.init("YvZvwxZYgvwNnI5bN");
  }

  setActiveNav();
  setupMobileNav();
  setupAuthUI();

  setupLoginPage();
  setupPortalPage();
  setupCasePage();
  setupContactPage();
});