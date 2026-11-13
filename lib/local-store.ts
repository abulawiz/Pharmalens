export type LocalRole = "admin" | "reviewer" | "user";

export type LocalUser = {
  id: string;
  email: string;
  name: string;
  role: LocalRole;
};

export type LocalProduct = {
  id: string;
  name: string;
  presentation: string;
  strength: string;
  dosage_form: string;
  manufacturer: string;
  registration_number: string | null;
};

export type LocalVersion = {
  id: string;
  product_id: string;
  version: number;
  packaging_version: string;
  package_text: string[];
  source_name: string;
  source_url?: string | null;
  provenance_notes?: string;
  coverage_notes?: string | null;
  reviewed_at: string | null;
  status: "draft" | "published" | "retired" | "withdrawn";
  products?: LocalProduct;
};

export type LocalReport = {
  id: string;
  public_reference: string;
  scan_id: string;
  reason: string;
  notes: string | null;
  contact_information: string | null;
  status: "submitted" | "under_review" | "more_information_requested" | "closed";
  created_at: string;
  scans: { product_name: string; outcome: string };
};

export type LocalReferenceImage = {
  id: string;
  reference_version_id: string;
  storage_path: string;
  package_side: string;
  width: number;
  height: number;
  approved_at: string;
  dataUrl?: string;
};

export const PRESET_ACCOUNTS: LocalUser[] = [
  { id: "usr_admin_001", email: "admin@pharmalens.local", name: "Administrator", role: "admin" },
  { id: "usr_admin_002", email: "admin@pharmalens.com", name: "Administrator", role: "admin" },
  { id: "usr_rev_002", email: "pharmacist@pharmalens.local", name: "Licensed Pharmacist", role: "reviewer" },
  { id: "usr_usr_003", email: "patient@pharmalens.local", name: "Verified Patient", role: "user" },
];

export const INITIAL_PRODUCTS: LocalProduct[] = [
  {
    id: "prod_para_01",
    name: "Paracetamol",
    presentation: "Pack of 10 Blisters (100 Tablets)",
    strength: "500 mg",
    dosage_form: "Tablet",
    manufacturer: "Emzor Pharmaceuticals Ind. Ltd",
    registration_number: "04-0123",
  },
  {
    id: "prod_amox_02",
    name: "Amoxicillin",
    presentation: "Box of 10 Blisters (100 Capsules)",
    strength: "500 mg",
    dosage_form: "Capsule",
    manufacturer: "GlaxoSmithKline / Beecham",
    registration_number: "04-4567",
  },
  {
    id: "prod_lonart_03",
    name: "Lonart DS",
    presentation: "Blister Pack of 6 Tablets",
    strength: "80 mg / 480 mg",
    dosage_form: "Tablet",
    manufacturer: "Bliss GVS Pharma Ltd",
    registration_number: "04-8901",
  },
  {
    id: "prod_coart_04",
    name: "Coartem",
    presentation: "Box of 24 Tablets",
    strength: "20 mg / 120 mg",
    dosage_form: "Tablet",
    manufacturer: "Novartis Pharma AG",
    registration_number: "04-2345",
  },
];

export const INITIAL_VERSIONS: LocalVersion[] = [
  {
    id: "ver_para_v1",
    product_id: "prod_para_01",
    version: 1,
    packaging_version: "EMZ-PARA-NG-2025-A",
    package_text: ["PARACETAMOL", "500 mg", "Emzor Pharmaceuticals", "04-0123", "Fast relief of pain and fever"],
    source_name: "Official Emzor Specification Sheet",
    source_url: "https://example.com/emzor-spec",
    provenance_notes: "Physical carton inspection verified by licensed pharmacist.",
    coverage_notes: "Front, back, and batch panel covered.",
    reviewed_at: "2026-01-15T10:00:00.000Z",
    status: "published",
    products: INITIAL_PRODUCTS[0],
  },
  {
    id: "ver_amox_v1",
    product_id: "prod_amox_02",
    version: 1,
    packaging_version: "GSK-AMOX-NG-2024-C",
    package_text: ["AMOXICILLIN", "500 mg", "Beecham", "04-4567", "Antibiotic capsules"],
    source_name: "GSK Quality Assurance Reference",
    source_url: "https://example.com/gsk-qa",
    provenance_notes: "Verified against authorized registered pack.",
    coverage_notes: "Standard carton with tamper seal.",
    reviewed_at: "2026-02-10T14:30:00.000Z",
    status: "published",
    products: INITIAL_PRODUCTS[1],
  },
  {
    id: "ver_lonart_v1",
    product_id: "prod_lonart_03",
    version: 1,
    packaging_version: "BGVS-LON-DS-2025",
    package_text: ["LONART DS", "80 mg / 480 mg", "Bliss GVS Pharma", "04-8901", "Artemether Lumefantrine"],
    source_name: "Manufacturer Inspection Sample",
    source_url: "https://example.com/bliss-gvs",
    provenance_notes: "Authentic blister carton reference from manufacturer distributor.",
    coverage_notes: "Green and gold foil packaging.",
    reviewed_at: "2026-03-01T09:00:00.000Z",
    status: "published",
    products: INITIAL_PRODUCTS[2],
  },
  {
    id: "ver_coart_v1",
    product_id: "prod_coart_04",
    version: 1,
    packaging_version: "NOV-COART-2025-V2",
    package_text: ["COARTEM", "20 mg / 120 mg", "Novartis", "04-2345", "Artemether and Lumefantrine"],
    source_name: "Novartis Packaging Reference",
    source_url: "https://example.com/novartis-ref",
    provenance_notes: "Standard export pack for West Africa.",
    coverage_notes: "Yellow and red carton with hologram.",
    reviewed_at: "2026-03-12T11:20:00.000Z",
    status: "published",
    products: INITIAL_PRODUCTS[3],
  },
];

const STORAGE_KEYS = {
  USER: "pharmalens_local_user",
  PROFILES: "pharmalens_local_profiles",
  PRODUCTS: "pharmalens_local_products",
  VERSIONS: "pharmalens_local_versions",
  REPORTS: "pharmalens_local_reports",
  IMAGES: "pharmalens_local_images",
  AUDITS: "pharmalens_local_audits",
} as const;

export function getLocalUserFromCookie(cookieHeader?: string | null): LocalUser | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${STORAGE_KEYS.USER}=([^;]+)`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as LocalUser;
  } catch {
    return null;
  }
}

export function getLocalUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${STORAGE_KEYS.USER}=([^;]+)`));
  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[1])) as LocalUser;
    } catch {}
  }
  const local = localStorage.getItem(STORAGE_KEYS.USER);
  if (local) {
    try {
      return JSON.parse(local) as LocalUser;
    } catch {}
  }
  return null;
}

export function setLocalUser(user: LocalUser): void {
  if (typeof window === "undefined") return;
  const encoded = encodeURIComponent(JSON.stringify(user));
  document.cookie = `${STORAGE_KEYS.USER}=${encoded}; path=/; max-age=604800; SameSite=Lax`;
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  const profiles = getLocalProfiles();
  if (!profiles.some(p => p.id === user.id)) {
    profiles.push(user);
    saveLocalProfiles(profiles);
  }
}

export function clearLocalUser(): void {
  if (typeof window === "undefined") return;
  document.cookie = `${STORAGE_KEYS.USER}=; path=/; max-age=0; SameSite=Lax`;
  localStorage.removeItem(STORAGE_KEYS.USER);
}

export function getLocalProfiles(): LocalUser[] {
  if (typeof window === "undefined") return PRESET_ACCOUNTS;
  const stored = localStorage.getItem(STORAGE_KEYS.PROFILES);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(PRESET_ACCOUNTS));
    return PRESET_ACCOUNTS;
  }
  try {
    const list = JSON.parse(stored) as LocalUser[];
    for (const preset of PRESET_ACCOUNTS) {
      if (!list.some((p) => p.email.toLowerCase() === preset.email.toLowerCase())) {
        list.push(preset);
      }
    }
    return list;
  } catch {
    return PRESET_ACCOUNTS;
  }
}

export function saveLocalProfiles(profiles: LocalUser[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
}

export function updateLocalUserRole(userId: string, role: LocalRole): void {
  const profiles = getLocalProfiles().map(p => (p.id === userId ? { ...p, role } : p));
  saveLocalProfiles(profiles);
  const current = getLocalUser();
  if (current?.id === userId) {
    setLocalUser({ ...current, role });
  }
  recordAuditEvent(`ROLE_CHANGED_TO_${role.toUpperCase()}`, `user:${userId}`);
}

export function getLocalProducts(): LocalProduct[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as LocalProduct[];
  } catch {
    return [];
  }
}

export function addLocalProduct(product: Omit<LocalProduct, "id">): LocalProduct {
  const products = getLocalProducts();
  const created: LocalProduct = {
    ...product,
    id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  };
  products.push(created);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }
  recordAuditEvent("PRODUCT_CREATED", `product:${created.id}`);
  return created;
}

export function getLocalVersions(): LocalVersion[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.VERSIONS);
  if (!stored) return [];
  try {
    const list = JSON.parse(stored) as LocalVersion[];
    const products = getLocalProducts();
    return list.map(ver => ({
      ...ver,
      products: ver.products || products.find(p => p.id === ver.product_id),
    }));
  } catch {
    return [];
  }
}

export function addLocalVersion(version: Omit<LocalVersion, "id" | "status" | "products">): LocalVersion {
  const versions = getLocalVersions();
  const products = getLocalProducts();
  const product = products.find(p => p.id === version.product_id);
  const created: LocalVersion = {
    ...version,
    id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    status: "draft",
    products: product,
  };
  versions.unshift(created);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(versions));
  }
  recordAuditEvent("REFERENCE_VERSION_CREATED_DRAFT", `reference_version:${created.id}`);
  return created;
}

export function updateLocalVersionStatus(versionId: string, status: LocalVersion["status"]): void {
  const versions = getLocalVersions().map(v => (v.id === versionId ? { ...v, status } : v));
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(versions));
  }
  recordAuditEvent(`VERSION_STATUS_${status.toUpperCase()}`, `reference_version:${versionId}`);
}

export function getLocalReports(): LocalReport[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.REPORTS);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as LocalReport[];
  } catch {
    return [];
  }
}

export function addLocalReport(report: Omit<LocalReport, "id" | "public_reference" | "created_at" | "status">): LocalReport {
  const reports = getLocalReports();
  const created: LocalReport = {
    ...report,
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    public_reference: `PL-REV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    status: "submitted",
    created_at: new Date().toISOString(),
  };
  reports.unshift(created);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }
  recordAuditEvent("REPORT_SUBMITTED", `report:${created.id}`);
  return created;
}

export function updateLocalReportStatus(
  reportId: string,
  status: LocalReport["status"],
  note?: string,
): void {
  const reports = getLocalReports().map(r => (r.id === reportId ? { ...r, status, notes: note ? `${r.notes || ""}\n[Reviewer Note]: ${note}`.trim() : r.notes } : r));
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }
  recordAuditEvent(`REPORT_STATUS_${status.toUpperCase()}`, `report:${reportId}`);
}

export function deleteLocalReport(reportId: string): void {
  const reports = getLocalReports().filter(r => r.id !== reportId);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }
  recordAuditEvent("REPORT_DELETED", `report:${reportId}`);
}

export function getLocalReferenceImages(versionId?: string): LocalReferenceImage[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.IMAGES);
  if (!stored) return [];
  try {
    const list = JSON.parse(stored) as LocalReferenceImage[];
    return versionId ? list.filter(img => img.reference_version_id === versionId) : list;
  } catch {
    return [];
  }
}

export function addLocalReferenceImage(img: Omit<LocalReferenceImage, "id" | "approved_at">): LocalReferenceImage {
  const images = getLocalReferenceImages();
  const created: LocalReferenceImage = {
    ...img,
    id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    approved_at: new Date().toISOString(),
  };
  images.push(created);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(images));
  }
  recordAuditEvent("REFERENCE_IMAGE_UPLOADED", `reference_image:${created.id}`);
  return created;
}

export function getLocalAudits(): Array<{ id: string; action: string; entity_type: string; created_at: string }> {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.AUDITS);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function recordAuditEvent(action: string, entity_type: string): void {
  if (typeof window === "undefined") return;
  const audits = getLocalAudits();
  audits.unshift({
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    action,
    entity_type,
    created_at: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(audits.slice(0, 30)));
}
