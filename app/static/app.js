(() => {
  "use strict";

  const state = {
    token: sessionStorage.getItem("workfolk_token"),
    user: null,
    employmentType: "",
    offset: 0,
    limit: 12,
    loading: false,
    jobs: [],
    hasMore: false,
    currentJob: null,
    editingJobId: null,
    dashboardRequest: 0,
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const jobList = $("#job-list");
  const backdrop = $("#modal-backdrop");
  const modalBody = $("#modal-body");
  let toastTimer;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[character]);
  }

  function notify(message, error = false) {
    const region = $("#toast-region");
    const toast = document.createElement("div");
    toast.className = `toast${error ? " error" : ""}`;
    toast.setAttribute("role", error ? "alert" : "status");
    toast.textContent = message;
    region.append(toast);
    window.setTimeout(() => toast.remove(), 3800);
  }

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (state.token) headers.set("Authorization", `Bearer ${state.token}`);
    if (
      options.body
      && !(options.body instanceof FormData)
      && !(options.body instanceof URLSearchParams)
    ) {
      headers.set("Content-Type", "application/json");
    }
    let response;
    try {
      response = await fetch(path, { ...options, headers });
    } catch {
      throw new Error("Could not reach the API. Make sure the backend is running and try again.");
    }
    if (response.status === 204) return null;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && state.token) {
        state.token = null;
        state.user = null;
        sessionStorage.removeItem("workfolk_token");
        updateAccountUI();
      }
      const detail = Array.isArray(data.detail)
        ? data.detail.map((item) => item.msg).join(", ")
        : data.detail;
      throw new Error(detail || `Request failed (${response.status})`);
    }
    return data;
  }

  function updateAccountUI() {
    const loggedIn = Boolean(state.user && state.token);
    $("#login-open").hidden = loggedIn;
    $("#register-open").hidden = loggedIn;
    $("#logout-button").hidden = !loggedIn;
    $("#signed-in-label").hidden = !loggedIn;
    $("#signed-in-label").textContent = loggedIn ? `Hi, ${state.user.full_name.split(" ")[0]}` : "";
    $("#dashboard-nav").hidden = !loggedIn;
    $("#post-job-open").textContent = state.user?.role === "employer" ? "Post a job ↗" : "I’m hiring ↗";
  }

  function showModal({ title, description = "", kicker = "Welcome to workfolk", content }) {
    $("#modal-title").textContent = title;
    $("#modal-description").textContent = description;
    $("#modal-kicker").textContent = kicker;
    modalBody.replaceChildren();
    modalBody.append(content);
    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
    window.clearTimeout(toastTimer);
    window.requestAnimationFrame(() => $("input, select, textarea, button", modalBody)?.focus());
  }

  function closeModal() {
    backdrop.hidden = true;
    document.body.style.overflow = "";
    state.currentJob = null;
  }

  function makeField({ label, name, type = "text", required = false, value = "", placeholder = "", min, max, options, multiline = false }) {
    const wrapper = document.createElement("label");
    wrapper.className = "form-field";
    const caption = document.createElement("span");
    caption.textContent = label;
    const input = document.createElement(multiline ? "textarea" : (options ? "select" : "input"));
    input.name = name;
    input.required = required;
    if (!options && !multiline) input.type = type;
    if (value !== undefined && value !== null) input.value = String(value);
    if (placeholder) input.placeholder = placeholder;
    if (min !== undefined) input.min = String(min);
    if (max !== undefined) input.max = String(max);
    if (multiline) input.rows = 5;
    if (options) {
      for (const [optionValue, optionLabel] of options) {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = optionLabel;
        input.append(option);
      }
      input.value = value || options[0][0];
    }
    wrapper.append(caption, input);
    return wrapper;
  }

  function openAuth(mode = "register") {
    const isRegister = mode === "register";
    const form = document.createElement("form");
    form.className = "modal-form";
    if (isRegister) {
      form.append(makeField({ label: "Your name", name: "full_name", required: true, max: 150, placeholder: "e.g. Alex Morgan" }));
    }
    form.append(
      makeField({ label: "Email address", name: "email", type: "email", required: true, max: 255, placeholder: "you@example.com" }),
      makeField({ label: "Password", name: "password", type: "password", required: true, min: 8, max: 128, placeholder: "At least 8 characters" }),
    );
    if (isRegister) {
      form.append(makeField({
        label: "I’m here as a", name: "role", required: true,
        options: [["job_seeker", "Job seeker — I’m looking for work"], ["employer", "Employer — I’m building a team"]],
      }));
    }
    const submit = document.createElement("button");
    submit.className = "button button-green";
    submit.type = "submit";
    submit.textContent = isRegister ? "Create my account ↗" : "Log in ↗";
    const switchLine = document.createElement("div");
    switchLine.className = "auth-switch";
    switchLine.append(document.createTextNode(isRegister ? "Already have an account? " : "New to workfolk? "));
    const switchButton = document.createElement("button");
    switchButton.type = "button";
    switchButton.className = "link-button";
    switchButton.textContent = isRegister ? "Log in" : "Create an account";
    switchButton.addEventListener("click", () => openAuth(isRegister ? "login" : "register"));
    switchLine.append(switchButton);
    form.append(submit, switchLine);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      submit.disabled = true;
      submit.textContent = "One moment…";
      const formData = new FormData(form);
      const email = String(formData.get("email")).trim().toLowerCase();
      const password = String(formData.get("password"));
      try {
        if (isRegister) {
          await request("/auth/register", {
            method: "POST",
            body: JSON.stringify({
              email, password,
              full_name: String(formData.get("full_name")).trim(),
              role: formData.get("role"),
            }),
          });
        }
        const tokenData = await request("/auth/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ username: email, password }),
        });
        state.token = tokenData.access_token;
        sessionStorage.setItem("workfolk_token", state.token);
        state.user = await request("/users/me");
        updateAccountUI();
        closeModal();
        notify(isRegister ? "Welcome to workfolk. You’re all set!" : "Welcome back!");
        await loadJobs(true);
      } catch (error) {
        notify(error.message, true);
        submit.disabled = false;
        submit.textContent = isRegister ? "Create my account ↗" : "Log in ↗";
      }
    });
    showModal({
      kicker: isRegister ? "A good move" : "Good to see you",
      title: isRegister ? "Find your next fit." : "Welcome back.",
      description: isRegister ? "Create your account and take your next step." : "Log in to pick up where you left off.",
      content: form,
    });
  }

  function formatSalary(job) {
    if (job.salary_min == null && job.salary_max == null) return "Salary not listed";
    const format = (amount) => `$${Math.round(amount / 1000)}k`;
    if (job.salary_min != null && job.salary_max != null) return `${format(job.salary_min)}–${format(job.salary_max)} / year`;
    return `${job.salary_min != null ? "From " + format(job.salary_min) : "Up to " + format(job.salary_max)} / year`;
  }

  function formatType(value) {
    return String(value || "full_time").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function formatDate(value) {
    if (!value) return "Recently posted";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recently posted";
    const days = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (days < 1) return "Posted today";
    if (days === 1) return "Posted yesterday";
    if (days < 30) return `Posted ${days} days ago`;
    return `Posted ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }

  function savedJobs() {
    try {
      return new Set(JSON.parse(localStorage.getItem("workfolk_saved_jobs") || "[]"));
    } catch {
      return new Set();
    }
  }

  function toggleSavedJob(jobId) {
    const saved = savedJobs();
    if (saved.has(jobId)) saved.delete(jobId);
    else saved.add(jobId);
    localStorage.setItem("workfolk_saved_jobs", JSON.stringify([...saved]));
    renderJobs();
  }

  function jobCard(job) {
    const saved = savedJobs().has(job.id);
    const palette = [
      ["#e6eee4", "#446d4d"], ["#f4e9dc", "#a46d38"], ["#e7e8f1", "#60638d"],
      ["#f3e5e2", "#a45f51"], ["#e3edf0", "#4d7782"], ["#eee8f2", "#765985"],
    ][Math.abs(Number(job.id) || 0) % 6];
    const card = document.createElement("article");
    card.className = "job-card";
    card.innerHTML = `
      <div class="job-card-top">
        <div class="company-badge" style="--badge-bg:${palette[0]};--badge-color:${palette[1]}" aria-hidden="true">${escapeHtml((job.company || "?").trim().charAt(0).toUpperCase())}</div>
        <button class="save-button${saved ? " saved" : ""}" type="button" aria-label="${saved ? "Remove saved job" : "Save job"}" aria-pressed="${saved}" data-save="${job.id}">${saved ? "♥" : "♡"}</button>
      </div>
      <p class="job-company">${escapeHtml(job.company)}</p>
      <h3>${escapeHtml(job.title)}</h3>
      <div class="job-meta"><span>⌖ ${escapeHtml(job.location)}</span><span>${escapeHtml(formatType(job.employment_type))}</span></div>
      <div class="job-bottom"><div><div class="salary-text">${escapeHtml(formatSalary(job))}</div><div class="job-date">${escapeHtml(formatDate(job.created_at))}</div></div><button class="button button-outline card-action" type="button" data-apply="${job.id}">View role ↗</button></div>`;
    return card;
  }

  function showJobsMessage(title, message, actionLabel, action) {
    jobList.replaceChildren();
    const box = document.createElement("div");
    box.className = "empty-state";
    box.innerHTML = `<div class="empty-icon" aria-hidden="true">✳</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p>`;
    if (actionLabel && action) {
      const button = document.createElement("button");
      button.className = "button button-outline";
      button.type = "button";
      button.textContent = actionLabel;
      button.addEventListener("click", action, { once: true });
      box.append(button);
    }
    jobList.append(box);
  }

  async function loadJobs(reset = true) {
    if (state.loading) return;
    if (reset) {
      state.offset = 0;
      state.jobs = [];
    }
    state.loading = true;
    jobList.setAttribute("aria-busy", "true");
    $("#load-more").disabled = true;
    if (reset) {
      jobList.innerHTML = '<div class="skeleton" aria-hidden="true"></div><div class="skeleton" aria-hidden="true"></div><div class="skeleton" aria-hidden="true"></div>';
    }
    const params = new URLSearchParams({
      offset: String(state.offset),
      limit: String(state.limit),
    });
    const search = $("#search-input").value.trim();
    const location = $("#location-input").value.trim();
    if (search) params.set("search", search);
    if (location) params.set("location", location);
    if (state.employmentType) params.set("employment_type", state.employmentType);
    if ($("#salary-filter").checked) params.set("salary_min", "90000");
    try {
      const page = await request(`/jobs?${params}`);
      state.jobs = reset ? page : [...state.jobs, ...page];
      state.hasMore = page.length === state.limit;
      state.offset = state.jobs.length;
      renderJobs();
    } catch (error) {
      if (reset) {
        showJobsMessage("We couldn’t load the roles.", error.message, "Try again", () => loadJobs(true));
        $("#results-count").textContent = "";
      } else {
        notify(error.message, true);
      }
    } finally {
      state.loading = false;
      jobList.setAttribute("aria-busy", "false");
      $("#load-more").disabled = false;
    }
  }

  function renderJobs() {
    jobList.replaceChildren();
    const queryActive = $("#search-input").value.trim() || $("#location-input").value.trim() || state.employmentType || $("#salary-filter").checked;
    if (!state.jobs.length) {
      showJobsMessage(
        queryActive ? "No roles match just yet." : "Your next opportunity starts here.",
        queryActive ? "Try a different title, location, or filter." : "There aren’t any listings at the moment. Check back soon for fresh opportunities.",
        queryActive ? "Clear filters" : null,
        queryActive ? () => {
          $("#search-input").value = "";
          $("#location-input").value = "";
          $("#salary-filter").checked = false;
          state.employmentType = "";
          $$(".filter-chip").forEach((chip) => chip.classList.toggle("selected", chip.dataset.type === ""));
          loadJobs(true);
        } : null,
      );
    } else {
      const fragment = document.createDocumentFragment();
      for (const job of state.jobs) fragment.append(jobCard(job));
      jobList.append(fragment);
    }
    $("#results-count").textContent = `${state.jobs.length}${state.hasMore ? "+" : ""} ${state.jobs.length === 1 ? "role" : "roles"}`;
    $("#load-more").hidden = !state.hasMore;
    $("#load-more").disabled = state.loading;
  }

  function openJobDetails(job) {
    state.currentJob = job;
    const panel = document.createElement("div");
    panel.className = "modal-form";
    const details = document.createElement("div");
    details.innerHTML = `
      <div class="job-meta"><span>⌖ ${escapeHtml(job.location)}</span><span>${escapeHtml(formatType(job.employment_type))}</span></div>
      <p><strong>${escapeHtml(job.company)}</strong> · <span class="salary-text">${escapeHtml(formatSalary(job))}</span></p>
      <div style="color:#687269;font-size:12px;line-height:1.85;white-space:pre-wrap">${escapeHtml(job.description)}</div>
      <p class="form-help">${escapeHtml(formatDate(job.created_at))}</p>`;
    const applyButton = document.createElement("button");
    applyButton.type = "button";
    applyButton.className = "button button-green";
    applyButton.textContent = state.user?.role === "employer" ? "Employer accounts can’t apply" : "Apply for this role ↗";
    applyButton.disabled = state.user?.role === "employer";
    applyButton.addEventListener("click", () => openApplicationForm(job));
    panel.append(details, applyButton);
    showModal({ kicker: job.company, title: job.title, description: `${job.location} · ${formatType(job.employment_type)}`, content: panel });
  }

  function openApplicationForm(job) {
    if (!state.token || !state.user) {
      closeModal();
      openAuth("login");
      notify("Log in as a job seeker to apply.");
      return;
    }
    if (state.user.role !== "job_seeker") {
      notify("Employer accounts can’t apply for jobs.", true);
      return;
    }
    state.currentJob = job;
    const form = document.createElement("form");
    form.className = "modal-form";
    form.append(makeField({ label: "A note to the hiring team (optional)", name: "cover_letter", multiline: true, max: 10000, placeholder: "What makes you a good fit for this role?" }));
    const hint = document.createElement("p");
    hint.className = "form-help";
    hint.textContent = "You can only apply once to each job. Your application will be shared with the employer.";
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "button button-green";
    submit.textContent = "Send application ↗";
    form.append(hint, submit);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      submit.disabled = true;
      try {
        await request("/applications", {
          method: "POST",
          body: JSON.stringify({ job_id: job.id, cover_letter: new FormData(form).get("cover_letter") || null }),
        });
        closeModal();
        notify("Application sent. Good luck with this next step!");
        if (!$("#dashboard").hidden) loadDashboard();
      } catch (error) {
        notify(error.message, true);
        submit.disabled = false;
      }
    });
    showModal({
      kicker: "Take the next step",
      title: `Apply to ${job.title}.`,
      description: `${job.company} · ${job.location}`,
      content: form,
    });
  }

  function openJobForm(job = null) {
    if (!state.user || state.user.role !== "employer") {
      if (!state.user) {
        openAuth("login");
        notify("Log in with an employer account to post a role.");
      } else {
        notify("Posting a role is available to employer accounts.", true);
      }
      return;
    }
    state.editingJobId = job?.id || null;
    const form = document.createElement("form");
    form.className = "modal-form";
    form.append(
      makeField({ label: "Job title", name: "title", required: true, max: 200, value: job?.title || "", placeholder: "e.g. Product Designer" }),
      makeField({ label: "Company", name: "company", required: true, max: 150, value: job?.company || "", placeholder: "Your company" }),
      makeField({ label: "Location", name: "location", required: true, max: 150, value: job?.location || "", placeholder: "City or Remote" }),
      makeField({ label: "Employment type", name: "employment_type", required: true, value: job?.employment_type || "full_time", options: [["full_time", "Full-time"], ["part_time", "Part-time"], ["contract", "Contract"], ["internship", "Internship"]] }),
      makeField({ label: "Minimum salary per year (optional)", name: "salary_min", type: "number", min: 0, value: job?.salary_min ?? "", placeholder: "e.g. 80000" }),
      makeField({ label: "Maximum salary per year (optional)", name: "salary_max", type: "number", min: 0, value: job?.salary_max ?? "", placeholder: "e.g. 110000" }),
      makeField({ label: "About the role", name: "description", required: true, multiline: true, value: job?.description || "", placeholder: "Tell candidates what they will work on and what makes your team a good fit." }),
    );
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "button button-green";
    submit.textContent = job ? "Save changes ↗" : "Publish this role ↗";
    form.append(submit);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const salaryMin = data.get("salary_min");
      const salaryMax = data.get("salary_max");
      const payload = {
        title: String(data.get("title")).trim(),
        company: String(data.get("company")).trim(),
        location: String(data.get("location")).trim(),
        employment_type: data.get("employment_type"),
        description: String(data.get("description")).trim(),
        salary_min: salaryMin ? Number(salaryMin) : null,
        salary_max: salaryMax ? Number(salaryMax) : null,
      };
      submit.disabled = true;
      try {
        await request(job ? `/jobs/${job.id}` : "/jobs", {
          method: job ? "PUT" : "POST",
          body: JSON.stringify(payload),
        });
        closeModal();
        notify(job ? "Your listing has been updated." : "Your role is now live.");
        await loadJobs(true);
        if (!$("#dashboard").hidden) await loadDashboard();
      } catch (error) {
        notify(error.message, true);
        submit.disabled = false;
      }
    });
    showModal({
      kicker: "For teams",
      title: job ? "Make an update." : "Find your next teammate.",
      description: "Good listings help people picture themselves doing great work.",
      content: form,
    });
  }

  async function loadDashboard() {
    if (!state.user || !state.token) return;
    const requestId = ++state.dashboardRequest;
    const section = $("#dashboard");
    section.hidden = false;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    const content = $("#dashboard-content");
    content.innerHTML = '<div class="skeleton" style="min-height:90px"></div><div class="skeleton" style="min-height:90px"></div>';
    const isEmployer = state.user.role === "employer";
    $("#dashboard-subtitle").textContent = isEmployer ? "Manage the roles you’ve shared and meet people who’ve applied." : "Keep up with the roles you’re excited about.";
    $("#dashboard-title").textContent = isEmployer ? "A good team starts here." : "Your next steps.";
    try {
      const records = await request(isEmployer ? "/applications?limit=100" : "/applications?limit=100");
      const jobs = await request("/jobs?limit=100");
      if (requestId !== state.dashboardRequest) return;
      const jobsById = new Map(jobs.map((job) => [job.id, job]));
      let rows = [];
      if (isEmployer) {
        const ownJobs = jobs.filter((job) => job.employer_id === state.user.id);
        const applicationRows = records.map((application) => {
          const job = jobsById.get(application.job_id);
          return `<article class="dashboard-row"><div><h3>${escapeHtml(job?.title || `Job #${application.job_id}`)}</h3><p>Applicant #${application.applicant_id} · Applied ${escapeHtml(formatDate(application.created_at))}</p></div><div class="dashboard-actions"><span class="status-pill ${escapeHtml(application.status)}">${escapeHtml(application.status)}</span><select class="status-select" aria-label="Update application status" data-status="${application.id}"><option value="">Update status</option><option value="reviewed">Reviewed</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option></select></div></article>`;
        }).join("");
        const jobRows = ownJobs.map((job) => `<article class="dashboard-row"><div><h3>${escapeHtml(job.title)}</h3><p>${escapeHtml(job.company)} · ${escapeHtml(job.location)} · ${escapeHtml(formatDate(job.created_at))}</p></div><div class="dashboard-actions"><button class="button button-outline" data-edit-job="${job.id}" type="button">Edit listing</button><button class="button button-outline" data-delete-job="${job.id}" type="button">Delete</button></div></article>`).join("");
        rows = [
          `<div class="dashboard-section-title"><h3>Your job listings</h3><button class="button button-green" id="dashboard-post-job" type="button">Post a role ↗</button></div>`,
          jobRows || `<div class="empty-state"><h3>Your first role is waiting.</h3><p>Post a thoughtful listing and meet the right people.</p><button class="button button-green" id="dashboard-post-job-empty" type="button">Post a job ↗</button></div>`,
          `<div class="dashboard-section-title"><h3>People who applied</h3></div>`,
          applicationRows || `<div class="empty-state"><h3>No applications yet.</h3><p>When someone applies to one of your roles, you’ll find them here.</p></div>`,
        ];
      } else {
        rows = records.map((application) => {
          const job = jobsById.get(application.job_id);
          return `<article class="dashboard-row"><div><h3>${escapeHtml(job?.title || `Job #${application.job_id}`)}</h3><p>${escapeHtml(job?.company || "Job listing")} · Applied ${escapeHtml(formatDate(application.created_at))}</p></div><div class="dashboard-actions"><span class="status-pill ${escapeHtml(application.status)}">${escapeHtml(application.status)}</span>${application.status === "pending" ? `<button class="button button-outline" data-withdraw="${application.id}" type="button">Withdraw</button>` : ""}</div></article>`;
        });
        if (!rows.length) rows = ['<div class="empty-state"><h3>A good fit is out there.</h3><p>When you apply to a role, you can follow its progress right here.</p><button class="button button-outline" id="dashboard-find-jobs" type="button">Explore open roles</button></div>'];
      }
      content.innerHTML = rows.join("");
      wireDashboardActions(jobs, requestId);
    } catch (error) {
      if (requestId !== state.dashboardRequest) return;
      content.replaceChildren();
      const message = document.createElement("div");
      message.className = "empty-state";
      const heading = document.createElement("h3");
      heading.textContent = "Your dashboard couldn’t load.";
      const details = document.createElement("p");
      details.textContent = error.message;
      const retry = document.createElement("button");
      retry.className = "button button-outline";
      retry.type = "button";
      retry.textContent = "Try again";
      retry.addEventListener("click", loadDashboard);
      message.append(heading, details, retry);
      content.append(message);
    }
  }

  function wireDashboardActions(jobs, requestId) {
    $("#dashboard-post-job")?.addEventListener("click", () => openJobForm());
    $("#dashboard-post-job-empty")?.addEventListener("click", () => openJobForm());
    $("#dashboard-find-jobs")?.addEventListener("click", () => $("#opportunities").scrollIntoView({ behavior: "smooth" }));
    $$("[data-edit-job]").forEach((button) => {
      button.addEventListener("click", () => openJobForm(jobs.find((job) => job.id === Number(button.dataset.editJob))));
    });
    $$("[data-delete-job]").forEach((button) => {
      button.addEventListener("click", async () => {
        const job = jobs.find((entry) => entry.id === Number(button.dataset.deleteJob));
        if (!job || !window.confirm(`Delete “${job.title}”? Applications to this role will also be removed.`)) return;
        button.disabled = true;
        try {
          await request(`/jobs/${job.id}`, { method: "DELETE" });
          notify("The listing has been removed.");
          await loadJobs(true);
          await loadDashboard();
        } catch (error) {
          notify(error.message, true);
          button.disabled = false;
        }
      });
    });
    $$("[data-status]").forEach((select) => {
      select.addEventListener("change", async () => {
        if (!select.value) return;
        select.disabled = true;
        try {
          await request(`/applications/${select.dataset.status}`, {
            method: "PATCH",
            body: JSON.stringify({ status: select.value }),
          });
          notify("Application status updated.");
          if (requestId === state.dashboardRequest) await loadDashboard();
        } catch (error) {
          notify(error.message, true);
          select.disabled = false;
          select.value = "";
        }
      });
    });
    $$("[data-withdraw]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!window.confirm("Withdraw this application? You can apply again later.")) return;
        button.disabled = true;
        try {
          await request(`/applications/${button.dataset.withdraw}`, { method: "DELETE" });
          notify("Your application has been withdrawn.");
          await loadDashboard();
        } catch (error) {
          notify(error.message, true);
          button.disabled = false;
        }
      });
    });
  }

  function setDashboardVisible(visible) {
    $("#dashboard").hidden = !visible;
    if (visible) loadDashboard();
  }

  $("#search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    loadJobs(true);
    $("#opportunities").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#load-more").addEventListener("click", () => loadJobs(false));
  $("#salary-filter").addEventListener("change", () => loadJobs(true));
  $$(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.employmentType = chip.dataset.type;
      $$(".filter-chip").forEach((item) => item.classList.toggle("selected", item === chip));
      loadJobs(true);
    });
  });
  jobList.addEventListener("click", (event) => {
    const saveButton = event.target.closest("[data-save]");
    if (saveButton) {
      toggleSavedJob(Number(saveButton.dataset.save));
      return;
    }
    const applyButton = event.target.closest("[data-apply]");
    if (applyButton) {
      const job = state.jobs.find((item) => item.id === Number(applyButton.dataset.apply));
      if (job) openJobDetails(job);
    }
  });
  $("#login-open").addEventListener("click", () => openAuth("login"));
  $("#register-open").addEventListener("click", () => openAuth("register"));
  $("#post-job-open").addEventListener("click", () => {
    if (state.user?.role === "employer") openJobForm();
    else if (!state.user) {
      openAuth("register");
      notify("Choose “Employer” when you create your account.");
    } else {
      notify("Posting a role is available to employer accounts.", true);
    }
  });
  $("#dashboard-nav").addEventListener("click", () => {
    const isVisible = !$("#dashboard").hidden;
    setDashboardVisible(!isVisible);
    if (isVisible) $("#opportunities").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#logout-button").addEventListener("click", () => {
    state.token = null;
    state.user = null;
    sessionStorage.removeItem("workfolk_token");
    updateAccountUI();
    setDashboardVisible(false);
    notify("You’ve been logged out.");
  });
  $("#modal-close").addEventListener("click", closeModal);
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !backdrop.hidden) closeModal();
  });

  async function start() {
    if (state.token) {
      try {
        state.user = await request("/users/me");
      } catch {
        state.token = null;
        state.user = null;
        sessionStorage.removeItem("workfolk_token");
      }
    }
    updateAccountUI();
    loadJobs(true);
  }

  start();
})();
