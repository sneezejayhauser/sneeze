# Setup Guide — cjhauser.me Ecosystem

A single Next.js application powering five subdomains under one Vercel deployment.

---

## 1. Vercel Deployment Setup

### One project, one deploy

There is **only one Vercel project** for this entire ecosystem.
Every subdomain is handled inside the same Next.js app using Next.js middleware.

**Steps:**

1. Push the repository to GitHub (or any Git provider).
2. In the [Vercel dashboard](https://vercel.com/dashboard), click **Add New → Project**.
3. Import the repository.
4. Accept all defaults — the framework is detected automatically as **Next.js**.
5. Click **Deploy**.

You do not need to change build settings. Vercel will run `next build` and serve the output.

---

## 2. Subdomain Configuration in Vercel

After the initial deployment, add all subdomains to the **same Vercel project**.

1. Open your Vercel project → **Settings → Domains**.
2. Add each of the following domains one at a time:

| Domain | Purpose |
|---|---|
| `cjhauser.me` | Homepage |
| `projects.cjhauser.me` | Projects module |
| `lab.cjhauser.me` | Lab / experiments module |
| `status.cjhauser.me` | Status dashboard |
| `links.cjhauser.me` | Link hub |

3. Vercel will show you the DNS records you need to set for each domain. Keep this tab open while you configure your DNS provider.

> **Important:** All domains must point to the **same project**. Do not create additional projects.

---

## 3. DNS Setup (Namecheap / any registrar)

### Root domain — `cjhauser.me`

| Type | Host | Value | TTL |
|---|---|---|---|
| `A` | `@` | `76.76.21.21` | Automatic |

> Vercel's primary IP for root domains is `76.76.21.21`. Always confirm the current IP in **Vercel → Settings → Domains** in case it has changed.

Alternatively, if your registrar supports `ALIAS` or `ANAME` records, point `@` to `cname.vercel-dns.com.` — this is more resilient to IP changes.

### Subdomains

| Type | Host | Value | TTL |
|---|---|---|---|
| `CNAME` | `projects` | `cname.vercel-dns.com.` | Automatic |
| `CNAME` | `lab` | `cname.vercel-dns.com.` | Automatic |
| `CNAME` | `status` | `cname.vercel-dns.com.` | Automatic |
| `CNAME` | `links` | `cname.vercel-dns.com.` | Automatic |

**Namecheap-specific steps:**

1. Log into Namecheap → **Domain List** → **Manage** next to `cjhauser.me`.
2. Click the **Advanced DNS** tab.
3. Add each record from the tables above.
4. Save changes. DNS propagation typically takes a few minutes up to 48 hours.

After DNS propagates, Vercel will automatically provision a TLS certificate for each domain.

---

## 4. Routing Behavior

### How it works

```
Browser: https://projects.cjhauser.me/
         │
         ▼
   Next.js Middleware (middleware.ts)
         │  reads `host` header → "projects.cjhauser.me"
         │  getSubdomainFromHost() → "projects"
         │
         ▼
   Internal URL rewrite: / → /projects
         │
         ▼
   app/projects/page.tsx is rendered
         │
         ▼
   Response sent — browser still shows projects.cjhauser.me
```

Key files:

| File | Role |
|---|---|
| `proxy.ts` | Reads the `host` header, identifies the subdomain, rewrites the request to the matching internal route |
| `lib/subdomain.ts` | `getSubdomainFromHost(host)` — pure function, usable in proxy and Server Components |
| `app/page.tsx` | Serves `cjhauser.me` (home) |
| `app/projects/page.tsx` | Serves `projects.cjhauser.me` |
| `app/lab/page.tsx` | Serves `lab.cjhauser.me` |
| `app/status/page.tsx` | Serves `status.cjhauser.me` |
| `app/links/page.tsx` | Serves `links.cjhauser.me` |

**No path-based routing is exposed.** Visiting `cjhauser.me/projects` will simply render the home page — the middleware only rewrites based on subdomain, not paths typed by users.

---

## 5. Development Workflow

### Local development

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`. Because subdomains don't exist locally, all pages fall back to the `home` subdomain. To test a specific module locally, navigate directly to its path:

| Module | Local URL |
|---|---|
| Home | `http://localhost:3000/` |
| Projects | `http://localhost:3000/projects` |
| Lab | `http://localhost:3000/lab` |
| Status | `http://localhost:3000/status` |
| Links | `http://localhost:3000/links` |

### Adding a new subdomain module

Follow these four steps for every new subdomain (e.g. `blog.cjhauser.me`):

**Step 1 — Add the route segment**

```
app/
  blog/
    page.tsx    ← create this file
```

**Step 2 — Register the subdomain in `lib/subdomain.ts`**

Add the new key to `SubdomainKey` and `SUBDOMAIN_MAP`:

```ts
export type SubdomainKey = "home" | "projects" | "lab" | "status" | "links" | "blog";

const SUBDOMAIN_MAP: Record<string, SubdomainKey> = {
  // ... existing entries ...
  blog: "blog",
};
```

**Step 3 — Add a nav item in `components/Navbar.tsx`**

Append to `NAV_ITEMS`:

```ts
{ key: "blog", label: "Blog" },
```

**Step 4 — Add a link helper** *(optional)*

`getSubdomainHref("blog")` already works without changes because it derives the URL from the key automatically.

**Step 5 — Register in Vercel + DNS**

- Add `blog.cjhauser.me` to your Vercel project domains.
- Add a `CNAME blog → cname.vercel-dns.com.` record at your DNS registrar.

### Deploying changes

```bash
git add .
git commit -m "feat: add blog module"
git push origin main
```

Vercel automatically deploys on every push to `main`. No manual deployment steps are required. Preview deployments are created for every other branch.
