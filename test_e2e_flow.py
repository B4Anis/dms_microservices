import sys
import time
import io
import requests

BASE = "http://localhost:8080"

GREEN = "\033[92m"
RED   = "\033[91m"
CYAN  = "\033[96m"
BOLD  = "\033[1m"
RESET = "\033[0m"

PASS = f"{GREEN}[PASS]{RESET}"
FAIL = f"{RED}[FAIL]{RESET}"


def check(label, condition, detail=""):
    if condition:
        print(f"  {PASS} {label}")
    else:
        msg = f"  {FAIL} {label}"
        if detail:
            msg += f"\n       {RED}Detail: {detail}{RESET}"
        print(msg)
        sys.exit(1)


def step(n, desc):
    print(f"\n{CYAN}{BOLD}{'='*62}{RESET}")
    print(f"{CYAN}{BOLD}  STEP {n}: {desc}{RESET}")
    print(f"{CYAN}{BOLD}{'='*62}{RESET}")


# ── Step 1: Register ──────────────────────────────────────────
step(1, "Register u1@ensia.dz (IT) and u2@ensia.dz (Finance)")

r1 = requests.post(f"{BASE}/auth/register", json={
    "email": "u1@ensia.dz",
    "password": "Test1234!",
    "role": "user",
    "departmentId": "IT",
    "firstName": "User",
    "lastName": "One",
})
# 201 = created, 409 = already exists (idempotent re-run)
check(
    "Register u1@ensia.dz (201 or 409 if already exists)",
    r1.status_code in (200, 201, 409),
    f"HTTP {r1.status_code}: {r1.text[:300]}",
)

r2 = requests.post(f"{BASE}/auth/register", json={
    "email": "u2@ensia.dz",
    "password": "Test1234!",
    "role": "user",
    "departmentId": "Finance",
    "firstName": "User",
    "lastName": "Two",
})
check(
    "Register u2@ensia.dz (201 or 409 if already exists)",
    r2.status_code in (200, 201, 409),
    f"HTTP {r2.status_code}: {r2.text[:300]}",
)


# ── Step 2: Login ─────────────────────────────────────────────
step(2, "Login both users and extract JWT tokens")

login1 = requests.post(f"{BASE}/auth/login", json={
    "email": "u1@ensia.dz",
    "password": "Test1234!",
})
check("Login u1@ensia.dz -> HTTP 200", login1.status_code == 200,
      f"HTTP {login1.status_code}: {login1.text[:300]}")

token1 = login1.json().get("token")
check("u1 JWT token present in response", bool(token1))

login2 = requests.post(f"{BASE}/auth/login", json={
    "email": "u2@ensia.dz",
    "password": "Test1234!",
})
check("Login u2@ensia.dz -> HTTP 200", login2.status_code == 200,
      f"HTTP {login2.status_code}: {login2.text[:300]}")

token2 = login2.json().get("token")
check("u2 JWT token present in response", bool(token2))

headers1 = {"Authorization": f"Bearer {token1}"}
headers2 = {"Authorization": f"Bearer {token2}"}
print(f"  u1 token: {token1[:40]}…")
print(f"  u2 token: {token2[:40]}…")


# ── Step 3: Upload ────────────────────────────────────────────
step(3, "u1 uploads a dummy text file -> POST /api/documents")

dummy_content = (
    b"This is a test document created by the E2E validation script.\n"
    b"Department: IT. Purpose: verify the full upload pipeline,\n"
    b"including Kafka event emission and Gemini translation.\n"
)

upload_resp = requests.post(
    f"{BASE}/api/documents",
    headers=headers1,
    data={"title": "E2E Test Document"},
    files={"file": ("test_doc.txt", io.BytesIO(dummy_content), "text/plain")},
)
check("Upload returns HTTP 201", upload_resp.status_code == 201,
      f"HTTP {upload_resp.status_code}: {upload_resp.text[:300]}")

doc = upload_resp.json()
doc_id = doc.get("id")
check("Response body contains document id", doc_id is not None, str(doc))
check("Document owner set to u1 (from JWT, not body)", doc.get("owner") == "u1@ensia.dz",
      f"owner={doc.get('owner')!r}")
check("Document departmentId set to IT (from JWT, not body)", doc.get("departmentId") == "IT",
      f"departmentId={doc.get('departmentId')!r}")
check("Translations initially null (pipeline not yet complete)",
      doc.get("translatedContentFr") is None and
      doc.get("translatedContentAr") is None and
      doc.get("translatedContentEs") is None,
      str(doc))

print(f"  -> Uploaded docId = {doc_id}")


# ── Step 4: RBAC Isolation Test ───────────────────────────────
step(4, "RBAC isolation: u2 (Finance) must NOT access u1's IT document")

list_resp = requests.get(f"{BASE}/api/documents", headers=headers2)
check("u2 GET /api/documents -> HTTP 200", list_resp.status_code == 200,
      f"HTTP {list_resp.status_code}")

docs_for_u2 = list_resp.json()
u1_doc_in_list = any(d.get("id") == doc_id for d in docs_for_u2)
check(
    f"u1's docId={doc_id} (IT dept) NOT present in u2's list (Finance dept)",
    not u1_doc_in_list,
    f"u2's document list: {docs_for_u2}",
)
print(f"  u2 sees {len(docs_for_u2)} document(s) — none from IT department")

fetch_resp = requests.get(f"{BASE}/api/documents/{doc_id}", headers=headers2)
check(
    f"u2 GET /api/documents/{doc_id} -> HTTP 403 Forbidden",
    fetch_resp.status_code == 403,
    f"HTTP {fetch_resp.status_code}: {fetch_resp.text[:300]}",
)
print("  Department isolation enforced correctly by RBAC.")


# ── Step 5: Wait for Kafka / AI Pipeline ─────────────────────
step(5, "Pausing 15s for Kafka -> Translator -> Gemini -> DB pipeline")

for remaining in range(15, 0, -1):
    print(f"\r  Waiting {remaining:2d}s for async pipeline…", end="", flush=True)
    time.sleep(1)
print("\r  Pipeline wait complete.                          ")


# ── Step 6: Translation Verification ─────────────────────────
step(6, "Verify AI translations written back -> u1 GET /api/documents/{docId}")

verify_resp = requests.get(f"{BASE}/api/documents/{doc_id}", headers=headers1)
check("u1 fetch own document -> HTTP 200", verify_resp.status_code == 200,
      f"HTTP {verify_resp.status_code}: {verify_resp.text[:300]}")

translated = verify_resp.json()
fr = translated.get("translatedContentFr")
ar = translated.get("translatedContentAr")
es = translated.get("translatedContentEs")

check("French translation (translatedContentFr) is populated", bool(fr),
      f"translatedContentFr={fr!r}")
check("Arabic translation (translatedContentAr) is populated", bool(ar),
      f"translatedContentAr={ar!r}")
check("Spanish translation (translatedContentEs) is populated", bool(es),
      f"translatedContentEs={es!r}")

print(f"\n  French  : {str(fr)[:90]}")
print(f"  Arabic  : {str(ar)[:90]}")
print(f"  Spanish : {str(es)[:90]}")

# ── Final summary ─────────────────────────────────────────────
print(f"\n{GREEN}{BOLD}{'='*62}{RESET}")
print(f"{GREEN}{BOLD}  ALL 6 STEPS PASSED — Full architecture validated.{RESET}")
print(f"{GREEN}{BOLD}  Auth · RBAC · Upload · Kafka · Gemini · Translations{RESET}")
print(f"{GREEN}{BOLD}{'='*62}{RESET}\n")
