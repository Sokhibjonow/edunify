/* ============================================================
 * EDUNIFY — FAKE BACKEND (TypeScript)
 * ============================================================
 * In-memory mock that mirrors the real backend's surface:
 *   - JWT-shaped auth (header.payload.signature)
 *   - Role-based access control (edunify_admin, org_owner, manager,
 *     administrator, teacher, student)
 *   - Org → Branch → Class hierarchy
 *   - Pagination envelope: { items, page, pageSize, total }
 *   - Response envelope:   { ok: true, data } | { ok: false, error, status }
 *   - Activation gating (org_owner + teacher only)
 *
 * All mutations are in-memory. Page reload = fresh Faker seed.
 * Dataset is generated once at module load via faker.seed().
 * Passwords are never returned. Latin characters only.
 *
 * Every protected endpoint takes a `token: string` argument.
 * The frontend service wrapper reads the token from authStore and
 * passes it in. The real backend uses the same JWT via the
 * Authorization header — service signatures don't change between
 * mock and live except that the real call drops the explicit token
 * parameter (axios interceptor attaches it).
 * ============================================================ */

import { faker } from '@faker-js/faker'
import { z } from 'zod'
import { defaultDarkTheme, defaultLightTheme } from '@/schemas/themeSchemas'
import { authSessionSchema, authUserSchema } from '@/schemas/authSchemas'
import {
  branchManagerSchema,
  branchAdministratorSchema,
  branchTeacherSchema,
  branchSchema,
  pageSchema,
} from '@/schemas/branchSchemas'
import {
  organizationSchema,
  orgLogoPatchResultSchema,
  orgThemePatchResultSchema,
} from '@/schemas/orgSchemas'
import { statisticsSnapshotSchema } from '@/schemas/statisticsSchemas'
import { branchOverviewSchema } from '@/schemas/managerHomeSchemas'
import {
  profileSchema,
  changePasswordResultSchema,
} from '@/schemas/profileSchemas'
import {
  connectionStatusResponseSchema,
} from '@/schemas/connectionSchemas'
import type { ThemeColors } from '@/types/theme'
import type { AttendanceCounts, StatisticsSnapshot } from '@/types/statistics'
import type { BranchOverview } from '@/types/managerHome'
import { addOneMonth, buildCountMetric, buildExpectedRevenueMetric } from '@/utils/statisticsPeriod'
import { attendancePctFromCounts } from '@/utils/aggregateBranchStatistics'
import { generateConnectCode } from '@/utils/connectCode'

// ─────────────────────────────────────────────────────────────
// 1. TYPES
// ─────────────────────────────────────────────────────────────

export type Role = 'edunify_admin' | 'director' | 'manager' | 'administrator' | 'teacher' | 'student' | 'parent';
export type ActivationStatus = 'pending' | 'active' | 'suspended';
export type ConnectionStatus = 'connected' | 'unconnected';
export type DirectorActivationStatus = 'activated' | 'not_activated';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type PaymentStatus = 'paid' | 'due' | 'overdue';

export interface BaseUser {
  uniqueId: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  role: Role;
}

export interface EdunifyAdmin extends BaseUser { role: 'edunify_admin'; }
export interface OrgOwner extends BaseUser {
  role: 'director';
  organizationId: string;
  directorActivationStatus: DirectorActivationStatus;
}
export interface Manager extends BaseUser {
  role: 'manager';
  connectionStatus: ConnectionStatus;
  organizationId?: string;
  branchId?: string;
  requestedBranchId?: string | null;
}
export interface Administrator extends BaseUser {
  role: 'administrator';
  connectionStatus: ConnectionStatus;
  organizationId?: string;
  branchId?: string;
  requestedBranchId?: string | null;
}
export interface Teacher extends BaseUser {
  role: 'teacher';
  connectionStatus: ConnectionStatus;
  organizationId?: string;
  branchId?: string;
  requestedBranchId?: string | null;
  classCategory: string;
  activationStatus: ActivationStatus;
}
export interface Student extends BaseUser {
  role: 'student';
  connectionStatus: ConnectionStatus;
  organizationId?: string;
  branchId?: string;
  requestedBranchId?: string | null;
  classIds: string[];
  statistics: { quizAvg: number; homeworkCompletion: number; attendancePct: number };
}
export interface Parent extends BaseUser {
  role: 'parent';
  connectionStatus: ConnectionStatus;
  requestedBranchId?: string | null;
  childIds: string[];
}

export type AnyUser = EdunifyAdmin | OrgOwner | Manager | Administrator | Teacher | Student | Parent;

export interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  ownerId: string;
  logoUrl: string | null;
  activationStatus: ActivationStatus;
  joinCode: string;
  createdAt: string;
  lightTheme: ThemeColors;
  darkTheme: ThemeColors;
}

export interface Branch {
  id: string;
  organizationId: string;
  name: string;
  createdAt: string;
}

export interface Class {
  id: string;
  organizationId: string;
  branchId: string;
  name: string;
  teacherId: string | null;
  studentIds: string[];
  classPrice: number;
  joinCode: string;
  createdAt: string;
  /** Mock only: a price change scheduled for a future month (the backend keeps a full history). */
  scheduledPrice?: { price: number; effectiveFrom: string };
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  order: number;
}

export interface Module {
  id: string;
  teacherId: string;
  title: string;
  classId: string | null;
  lessons: Lesson[];
  createdAt: string;
}

export interface Payment {
  id: string;
  classId: string;
  studentId: string;
  amount: number;
  currency: string;
  period: string;
  dueDate: string | null;
  paidAt: string | null;
  status: PaymentStatus;
  note: string;
  recordedBy?: string | null;
  recordedAt: string;
}

export interface Attendance {
  id: string;
  classId: string;
  lessonId: string | null;
  studentId: string;
  /** Calendar day of the register, YYYY-MM-DD (browser local time in the mock). */
  date: string;
  status: AttendanceStatus;
  recordedBy: string | null;
  recordedAt: string;
}

export interface Rating {
  id: string;
  classId: string;
  lessonId: string;
  studentId: string;
  score: number;
  comment: string;
  ratedBy: string | null;
  ratedAt: string;
}

export interface BranchStats {
  branchId: string;
  attendancePct: number | null;
  avgRating: number | null;
  paymentSummary: { total: number; paid: number; due: number; overdue: number };
}

export type TaskPriority = 'normal' | 'important';

export interface Task {
  id: string;
  classId: string;
  lessonId: string | null;
  title: string;
  description: string;
  dueDate: string | null;
  priority: TaskPriority;
  createdBy: string;
  createdAt: string;
}

export type HomeworkStatus = 'submitted' | 'reviewed' | 'late';

export interface HomeworkSubmission {
  id: string;
  classId: string;
  lessonId: string;
  studentId: string;
  studentName: string;
  comment: string;
  photos: string[];
  submittedAt: string;
  status: HomeworkStatus;
}

export interface StudentCredentials {
  student: Student;
  login: string;
  password: string;
}

export interface StudentLookup {
  uniqueId: string;
  name: string;
  surname: string;
  alreadyInClass: boolean;
}

export interface Page<T> { items: T[]; page: number; pageSize: number; total: number; }
export type Ok<T> = { ok: true; data: T };
export type Err = { ok: false; error: string; status: number };
export type Result<T> = Ok<T> | Err;

export interface PageParams { page?: number; pageSize?: number; }
export interface AuthSession { token: string; user: AnyUser; }

// ─────────────────────────────────────────────────────────────
// 2. UTILITIES
// ─────────────────────────────────────────────────────────────

let _idCounter = 1;
const uid = (): string => String(_idCounter++).padStart(4, '0');

const MOCK_SEED = 2026_0316
const DEMO_PASSWORD = 'Pass1234!'
const LATENCY_MS = 80

function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data)
}

function toAuthUser(user: StoredAny): z.infer<typeof authUserSchema> {
  const payload: z.infer<typeof authUserSchema> = {
    uniqueId: user.uniqueId,
    name: user.name,
    surname: user.surname,
    email: user.email,
    phone: user.phone,
    role: user.role,
  }

  if (user.role === 'director') {
    payload.organizationId = user.organizationId
    payload.directorActivationStatus = user.directorActivationStatus
  }

  if (
    user.role === 'manager' ||
    user.role === 'administrator' ||
    user.role === 'teacher' ||
    user.role === 'student' ||
    user.role === 'parent'
  ) {
    payload.connectionStatus = user.connectionStatus
    payload.requestedBranchId = user.requestedBranchId ?? null
    if (user.connectionStatus === 'connected') {
      if ('organizationId' in user && user.organizationId) payload.organizationId = user.organizationId
      if ('branchId' in user && user.branchId) payload.branchId = user.branchId
    }
  }

  return validate(authUserSchema, payload)
}

const CONNECTABLE_ROLES: Role[] = ['manager', 'administrator', 'teacher', 'student', 'parent']

function toConnectionStatus(user: StoredAny): z.infer<typeof connectionStatusResponseSchema> {
  if (user.role === 'director') {
    return validate(connectionStatusResponseSchema, {
      connectionStatus: 'connected',
      requestedBranchId: null,
      organizationId: user.organizationId,
      directorActivationStatus: user.directorActivationStatus,
    })
  }

  if (CONNECTABLE_ROLES.includes(user.role) && 'connectionStatus' in user) {
    const connected = user.connectionStatus === 'connected'
    return validate(connectionStatusResponseSchema, {
      connectionStatus: user.connectionStatus,
      requestedBranchId: user.requestedBranchId ?? null,
      organizationId: connected && 'organizationId' in user ? user.organizationId : undefined,
      branchId: connected && 'branchId' in user ? user.branchId : undefined,
    })
  }

  return validate(connectionStatusResponseSchema, {
    connectionStatus: 'connected',
    requestedBranchId: null,
  })
}

function toAuthSession(token: string, user: StoredAny): AuthSession {
  return validate(authSessionSchema, { token, user: toAuthUser(user) }) as AuthSession
}

const branchStudentCountsSchema = z.record(z.string(), z.number())

const delay = (ms = LATENCY_MS): Promise<void> => new Promise((r) => setTimeout(r, ms))
function ok<T>(data: T): Ok<T> { return { ok: true, data }; }
function err(message: string, status = 400): Err { return { ok: false, error: message, status }; }

const defaultOrgThemes = () => ({
  lightTheme: defaultLightTheme,
  darkTheme: defaultDarkTheme,
});

function paginate<T>(items: T[], { page = 1, pageSize = 20 }: PageParams = {}): Page<T> {
  const safePage = Math.max(1, Math.floor(page));
  const safeSize = Math.max(1, Math.floor(pageSize));
  const start = (safePage - 1) * safeSize;
  return { items: items.slice(start, start + safeSize), page: safePage, pageSize: safeSize, total: items.length };
}

function stripPassword<T extends { password?: string }>(u: T): Omit<T, 'password'> {
  const clone: T = { ...u };
  delete clone.password;
  return clone;
}

// JWT-shaped fake token. Runs in browser via Vite; uses native btoa/atob.
const JWT_SECRET = 'fake-edunify-secret';
const b64encode = (s: string): string => btoa(s);
const b64decode = (s: string): string => atob(s);

function makeToken(userId: string): string {
  const header = b64encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64encode(JSON.stringify({ sub: userId, iat: Date.now(), exp: Date.now() + 7 * 86_400_000 }));
  const signature = b64encode(`${header}.${payload}.${JWT_SECRET}`);
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token: string | undefined | null): string | null {
  if (!token) return null;
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;
    if (b64encode(`${header}.${payload}.${JWT_SECRET}`) !== signature) return null;
    const decoded = JSON.parse(b64decode(payload)) as { sub: string; exp: number };
    if (Date.now() > decoded.exp) return null;
    return decoded.sub;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// 3. INTERNAL STORE
// ─────────────────────────────────────────────────────────────

type StoredEdunifyAdmin = EdunifyAdmin & { password: string };
type StoredOrgOwner = OrgOwner & { password: string };
type StoredManager = Manager & { password: string };
type StoredAdministrator = Administrator & { password: string };
type StoredTeacher = Teacher & { password: string };
type StoredStudent = Student & { password: string };
type StoredParent = Parent & { password: string };
type StoredAny =
  | StoredEdunifyAdmin
  | StoredOrgOwner
  | StoredManager
  | StoredAdministrator
  | StoredTeacher
  | StoredStudent
  | StoredParent;

interface DB {
  orgs: Organization[];
  branches: Branch[];
  classes: Class[];
  modules: Module[];
  payments: Payment[];
  attendance: Attendance[];
  ratings: Rating[];
  tasks: Task[];
  homeworks: HomeworkSubmission[];
  users: StoredAny[];
}

const DB: DB = {
  orgs: [], branches: [], classes: [], modules: [],
  payments: [], attendance: [], ratings: [], tasks: [], homeworks: [], users: [],
};

function isConnectCodeTaken(id: string): boolean {
  return DB.branches.some((b) => b.id === id) || DB.users.some((u) => u.uniqueId === id);
}

/** Globally unique branch ID — Connect Code format, not org-scoped. */
function uniqueBranchId(): string {
  let id: string;
  do {
    id = generateConnectCode();
  } while (isConnectCodeTaken(id));
  return id;
}

// ─────────────────────────────────────────────────────────────
// 4. DATASET INITIALIZATION (Faker — once per session)
// ─────────────────────────────────────────────────────────────

function monthAtOffset(offset: number): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function fakerPhone(): string {
  return faker.phone.number({ style: 'international' })
}

function fakerEmail(domain: string): string {
  return faker.internet.email({ provider: domain }).toLowerCase()
}

function localIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Attendance of a student in the given classes over the last 30 days. */
function mockAttendanceCounts(classes: Class[], studentId: string) {
  const since = localIsoDate(new Date(Date.now() - 29 * 86_400_000));
  const today = localIsoDate(new Date());
  const counts = { present: 0, late: 0, absent: 0, excused: 0, total: 0 };
  for (const a of DB.attendance) {
    if (a.studentId !== studentId || a.date < since || a.date > today || !classes.some((c) => c.id === a.classId)) continue;
    counts[a.status] += 1;
    counts.total += 1;
  }
  return counts;
}

/** Unpaid months of one student in one class. Mock has almost no payment history, so only the last two months are billed. */
function mockUnpaidLines(c: Class, studentId: string) {
  const today = localIsoDate(new Date());
  const thisMonth = today.slice(0, 7);
  const [ty, tm] = thisMonth.split('-').map(Number);
  const lastMonth = tm === 1 ? `${ty - 1}-12` : `${ty}-${String(tm - 1).padStart(2, '0')}`;
  const out = [];
  for (let m = [c.createdAt.slice(0, 7), lastMonth].sort()[1]; m <= thisMonth; m = addOneMonth(m)) {
    const paid = DB.payments.filter((p) => p.classId === c.id && p.studentId === studentId && p.period === m && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    if (c.classPrice <= 0 || paid >= c.classPrice) continue;
    const dueDate = `${m}-10`;
    out.push({ classId: c.id, className: c.name, period: m, balance: c.classPrice - paid, dueDate, status: dueDate < today ? 'overdue' as const : paid > 0 ? 'partial' as const : 'due' as const });
  }
  return out;
}

function mockChildClasses(studentId: string) {
  return DB.classes
    .filter((c) => c.studentIds.includes(studentId))
    .map((c) => {
      const t = c.teacherId ? DB.users.find((u) => u.uniqueId === c.teacherId) : undefined;
      return { id: c.id, name: c.name, teacherName: t ? `${t.name} ${t.surname}` : null };
    });
}

function isBranchTeacher(teacherId: string, orgId: string, branchId: string): boolean {
  return DB.users.some((u) => u.role === 'teacher' && u.uniqueId === teacherId && u.organizationId === orgId && u.branchId === branchId && u.connectionStatus === 'connected');
}

function toBranchClassDto(c: Class) {
  const t = c.teacherId ? DB.users.find((u) => u.uniqueId === c.teacherId) : undefined;
  return {
    id: c.id, organizationId: c.organizationId, branchId: c.branchId, name: c.name, teacherId: c.teacherId,
    studentIds: [...c.studentIds], classPrice: c.scheduledPrice?.price ?? c.classPrice, joinCode: c.joinCode, createdAt: c.createdAt,
    teacher: t ? { uniqueId: t.uniqueId, name: t.name, surname: t.surname } : null,
    currentPrice: c.classPrice,
    nextPrice: c.scheduledPrice ? { ...c.scheduledPrice } : null,
  };
}

export interface AttendanceRegister {
  date: string;
  lessonId: string | null;
  recordedAt: string | null;
  records: { studentId: string; status: AttendanceStatus }[];
}

function toAttendanceRegister(date: string, rows: Attendance[]): AttendanceRegister {
  const recordedAt = rows.reduce<string | null>((max, r) => (!max || r.recordedAt > max ? r.recordedAt : max), null);
  return {
    date,
    lessonId: rows[0]?.lessonId ?? null,
    recordedAt,
    records: rows.map((r) => ({ studentId: r.studentId, status: r.status })),
  };
}

const PAPER_TINTS =['#fdfaf3', '#f5f8fc', '#fbf5ec', '#f3f8f3'];
const INK_TINTS = ['#1f3a8a', '#1e293b', '#7c2d12', '#14532d'];

/** Fake "photo of a notebook page" as an SVG data URI, so mocks need no network. */
function homeworkPhoto(seed: number, heading: string): string {
  const paper = PAPER_TINTS[seed % PAPER_TINTS.length];
  const ink = INK_TINTS[(seed >> 1) % INK_TINTS.length];
  const rows = Array.from({ length: 12 }, (_, i) => 72 + i * 26);
  const rules = rows.map((y) => `<line x1="0" y1="${y}" x2="300" y2="${y}" stroke="#a9c4e8" stroke-width="1"/>`).join('');
  const scribbles = rows.slice(1, 10).map((y, i) => {
    const width = 110 + ((seed * 37 + i * 53) % 140);
    let d = `M50 ${y - 7}`;
    for (let x = 50; x < 50 + width; x += 12) d += ` q3 -${5 + ((x + i + seed) % 5)} 6 0 t6 0`;
    return `<path d="${d}" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>`;
  }).join('');
  const safeHeading = heading.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="${paper}"/>${rules}<line x1="40" y1="0" x2="40" y2="400" stroke="#e8a3a3" stroke-width="1.2"/><text x="50" y="50" font-family="Georgia, serif" font-size="18" fill="${ink}">${safeHeading}</text>${scribbles}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k',
  л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
};

function loginSlug(s: string): string {
  return [...s.toLowerCase()].map((ch) => TRANSLIT[ch] ?? ch).join('').replace(/[^a-z0-9]/g, '');
}

function uniqueStudentLogin(name: string, surname: string): string {
  const base = `${loginSlug(name) || 'student'}.${loginSlug(surname) || 'edunify'}`;
  let login = `${base}@edunify.uz`;
  for (let n = 2; DB.users.some((u) => u.email === login); n++) login = `${base}${n}@edunify.uz`;
  return login;
}

function generatePassword(): string {
  const letters = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
  const head = pick(letters).toUpperCase() + Array.from({ length: 4 }, () => pick(letters)).join('');
  return `${head}${pick(digits)}${pick(digits)}${pick(digits)}`;
}

function initializeDataset(): void {
  faker.seed(MOCK_SEED)

  DB.users.push({
    uniqueId: generateConnectCode(),
    name: 'Edunify',
    surname: 'Admin',
    email: 'admin@edunify.uz',
    phone: '+998900000001',
    role: 'edunify_admin',
    password: DEMO_PASSWORD,
  })

  const addOrg = (
    name: string,
    email: string,
    phone: string,
    ownerName: string,
    ownerSurname: string,
    ownerEmail: string,
    ownerPhone: string,
    logoUrl: string | null,
    activationStatus: ActivationStatus = 'active',
  ): { org: Organization; owner: StoredOrgOwner } => {
    const orgId = uid()
    const owner: StoredOrgOwner = {
      uniqueId: generateConnectCode(),
      name: ownerName,
      surname: ownerSurname,
      email: ownerEmail,
      phone: ownerPhone,
      role: 'director',
      organizationId: orgId,
      directorActivationStatus: activationStatus === 'active' ? 'activated' : 'not_activated',
      password: DEMO_PASSWORD,
    }
    const org: Organization = {
      id: orgId,
      name,
      email,
      phone,
      ownerId: owner.uniqueId,
      logoUrl,
      activationStatus,
      joinCode: generateConnectCode(),
      createdAt: faker.date.past({ years: 2 }).toISOString(),
      ...defaultOrgThemes(),
    }
    DB.orgs.push(org)
    DB.users.push(owner)
    return { org, owner }
  }

  const addBranch = (orgId: string, name: string): Branch => {
    const b: Branch = {
      id: uniqueBranchId(),
      organizationId: orgId,
      name,
      createdAt: faker.date.past({ years: 1 }).toISOString(),
    }
    DB.branches.push(b)
    return b
  }

  const addTeacher = (
    orgId: string,
    branchId: string,
    name: string,
    surname: string,
    email: string,
    phone: string,
    classCategory: string,
    activationStatus: ActivationStatus = 'active',
  ): StoredTeacher => {
    const t: StoredTeacher = {
      uniqueId: generateConnectCode(),
      name,
      surname,
      email,
      phone,
      role: 'teacher',
      connectionStatus: 'connected',
      organizationId: orgId,
      branchId,
      requestedBranchId: null,
      classCategory,
      activationStatus,
      password: DEMO_PASSWORD,
    }
    DB.users.push(t)
    return t
  }

  const addStaff = (
    role: 'manager' | 'administrator',
    orgId: string,
    branchId: string,
    name: string,
    surname: string,
    email: string,
    phone: string,
  ): StoredManager | StoredAdministrator => {
    const u = {
      uniqueId: generateConnectCode(),
      name,
      surname,
      email,
      phone,
      role,
      connectionStatus: 'connected' as const,
      organizationId: orgId,
      branchId,
      requestedBranchId: null,
      password: DEMO_PASSWORD,
    } as StoredManager | StoredAdministrator
    DB.users.push(u)
    return u
  }

  const addClass = (
    orgId: string,
    branchId: string,
    name: string,
    teacherId: string,
    classPrice: number,
  ): Class => {
    const c: Class = {
      id: uid(),
      organizationId: orgId,
      branchId,
      name,
      teacherId,
      studentIds: [],
      classPrice,
      joinCode: generateConnectCode(),
      createdAt: faker.date.past({ years: 1 }).toISOString(),
    }
    DB.classes.push(c)
    return c
  }

  const addStudent = (
    orgId: string,
    branchId: string,
    classId: string,
    name: string,
    surname: string,
    email: string,
    phone: string,
  ): StoredStudent => {
    const quizAvg = faker.number.int({ min: 50, max: 100 })
    const homeworkCompletion = faker.number.int({ min: 40, max: 100 })
    const attendancePct = faker.number.int({ min: 60, max: 100 })
    const s: StoredStudent = {
      uniqueId: generateConnectCode(),
      name,
      surname,
      email,
      phone,
      role: 'student',
      connectionStatus: 'connected',
      organizationId: orgId,
      branchId,
      requestedBranchId: null,
      classIds: [classId],
      statistics: { quizAvg, homeworkCompletion, attendancePct },
      password: DEMO_PASSWORD,
    }
    DB.users.push(s)
    const cls = DB.classes.find((c) => c.id === classId)
    if (cls) cls.studentIds.push(s.uniqueId)
    return s
  }

  const addParent = (
    name: string,
    surname: string,
    email: string,
    phone: string,
    childIds: string[],
  ): StoredParent => {
    const p: StoredParent = {
      uniqueId: generateConnectCode(),
      name,
      surname,
      email,
      phone,
      role: 'parent',
      connectionStatus: 'connected',
      requestedBranchId: null,
      childIds,
      password: DEMO_PASSWORD,
    }
    DB.users.push(p)
    return p
  }

  const addModule = (teacherId: string, title: string, classId: string | null): Module => {
    const lessonCount = faker.number.int({ min: 2, max: 5 })
    const moduleId = uid()
    const lessons: Lesson[] = Array.from({ length: lessonCount }, (_, index) => ({
      id: uid(),
      moduleId,
      title: faker.lorem.words({ min: 2, max: 4 }),
      order: index + 1,
    }))
    const m: Module = {
      id: moduleId,
      teacherId,
      title,
      classId,
      lessons,
      createdAt: faker.date.past({ years: 1 }).toISOString(),
    }
    DB.modules.push(m)
    return m
  }

  const seedAttendanceForClass = (
    classId: string,
    studentIds: string[],
    lessonId: string,
    recordedAt: string,
    presentRatio: number,
    recordedBy: string | null,
  ): void => {
    studentIds.forEach((studentId, index) => {
      const isPresent = index / Math.max(studentIds.length, 1) < presentRatio
      DB.attendance.push({
        id: uid(),
        classId,
        lessonId,
        studentId,
        date: localIsoDate(new Date(recordedAt)),
        status: isPresent ? 'present' : faker.helpers.arrayElement(['absent', 'late'] as AttendanceStatus[]),
        recordedBy,
        recordedAt,
      })
    })
  }

  const seedPayment = (
    classId: string,
    studentId: string,
    amount: number,
    period: string,
    status: PaymentStatus,
  ): void => {
    DB.payments.push({
      id: uid(),
      classId,
      studentId,
      amount,
      currency: 'UZS',
      period,
      dueDate:
        status === 'due'
          ? faker.date.soon({ days: 14 }).toISOString()
          : status === 'overdue'
            ? faker.date.recent({ days: 30 }).toISOString()
            : null,
      paidAt: status === 'paid' ? faker.date.recent({ days: 10 }).toISOString() : null,
      status,
      note: faker.lorem.sentence(),
      recordedAt: faker.date.recent({ days: 30 }).toISOString(),
    })
  }

  const seedRating = (
    classId: string,
    lessonId: string,
    studentId: string,
    ratedBy: string,
  ): void => {
    DB.ratings.push({
      id: uid(),
      classId,
      lessonId,
      studentId,
      score: faker.number.int({ min: 1, max: 5 }),
      comment: faker.lorem.sentence(),
      ratedBy,
      ratedAt: faker.date.recent({ days: 30 }).toISOString(),
    })
  }

  // ── Organization 1 (primary demo org — pinned director credentials)
  const o1 = addOrg(
    faker.company.name(),
    fakerEmail('bfa.uz'),
    fakerPhone(),
    'Komiljon',
    'Abdullayev',
    'komiljon@bfa.uz',
    '+998901000001',
    `https://placehold.co/120x120?text=${encodeURIComponent('BFA')}`,
  )

  const o1b1 = addBranch(o1.org.id, `${faker.location.city()} Branch`)
  const o1b2 = addBranch(o1.org.id, `${faker.location.city()} Branch`)

  addStaff('manager', o1.org.id, o1b1.id, faker.person.firstName(), faker.person.lastName(), 'manager@bfa.uz', fakerPhone())
  addStaff('administrator', o1.org.id, o1b1.id, faker.person.firstName(), faker.person.lastName(), 'administrator@bfa.uz', fakerPhone())
  addStaff('manager', o1.org.id, o1b2.id, faker.person.firstName(), faker.person.lastName(), 'manager2@bfa.uz', fakerPhone())

  const tO1B1_1 = addTeacher(o1.org.id, o1b1.id, faker.person.firstName(), faker.person.lastName(), 'teacher@bfa.uz', fakerPhone(), 'English')
  const tO1B1_2 = addTeacher(o1.org.id, o1b1.id, faker.person.firstName(), faker.person.lastName(), 'teacher2@bfa.uz', fakerPhone(), 'Math')
  const tO1B2_1 = addTeacher(o1.org.id, o1b2.id, faker.person.firstName(), faker.person.lastName(), 'teacher3@bfa.uz', fakerPhone(), 'Science')

  const cO1B1_1 = addClass(o1.org.id, o1b1.id, `${faker.word.adjective()} ${faker.word.noun()} A`, tO1B1_1.uniqueId, 500_000)
  const cO1B1_2 = addClass(o1.org.id, o1b1.id, `${faker.word.adjective()} ${faker.word.noun()} B`, tO1B1_2.uniqueId, 600_000)
  const cO1B2_1 = addClass(o1.org.id, o1b2.id, `${faker.word.adjective()} ${faker.word.noun()} C`, tO1B2_1.uniqueId, 550_000)

  const sAliya = addStudent(o1.org.id, o1b1.id, cO1B1_1.id, faker.person.firstName(), faker.person.lastName(), 'student@bfa.uz', fakerPhone())
  addStudent(o1.org.id, o1b1.id, cO1B1_1.id, faker.person.firstName(), faker.person.lastName(), 'student2@bfa.uz', fakerPhone())
  addParent(faker.person.firstName(), faker.person.lastName(), 'parent@bfa.uz', fakerPhone(), [sAliya.uniqueId])
  addStudent(o1.org.id, o1b1.id, cO1B1_2.id, faker.person.firstName(), faker.person.lastName(), 'student3@bfa.uz', fakerPhone())

  // Third o1b1 class deliberately left without today's attendance → its teacher shows as "pending".
  const tO1B1_3 = addTeacher(o1.org.id, o1b1.id, faker.person.firstName(), faker.person.lastName(), 'teacher4@bfa.uz', fakerPhone(), 'History')
  const cO1B1_3 = addClass(o1.org.id, o1b1.id, `${faker.word.adjective()} ${faker.word.noun()} D`, tO1B1_3.uniqueId, 520_000)
  const sDue = addStudent(o1.org.id, o1b1.id, cO1B1_3.id, faker.person.firstName(), faker.person.lastName(), 'student4@bfa.uz', fakerPhone())
  const sOverdue = addStudent(o1.org.id, o1b1.id, cO1B1_3.id, faker.person.firstName(), faker.person.lastName(), 'student5@bfa.uz', fakerPhone())

  addStudent(o1.org.id, o1b2.id, cO1B2_1.id, faker.person.firstName(), faker.person.lastName(), fakerEmail('bfa.uz'), fakerPhone())

  // ── Organization 2
  const o2 = addOrg(
    faker.company.name(),
    fakerEmail('iec.uz'),
    fakerPhone(),
    faker.person.firstName(),
    faker.person.lastName(),
    fakerEmail('iec.uz'),
    fakerPhone(),
    `https://placehold.co/120x120?text=${encodeURIComponent('IEC')}`,
  )
  const o2b1 = addBranch(o2.org.id, `${faker.location.city()} Branch`)
  addStaff('manager', o2.org.id, o2b1.id, faker.person.firstName(), faker.person.lastName(), fakerEmail('iec.uz'), fakerPhone())
  const tO2B1_1 = addTeacher(o2.org.id, o2b1.id, faker.person.firstName(), faker.person.lastName(), fakerEmail('iec.uz'), fakerPhone(), 'Programming')
  const cO2B1_1 = addClass(o2.org.id, o2b1.id, `${faker.word.adjective()} Python A`, tO2B1_1.uniqueId, 800_000)
  addStudent(o2.org.id, o2b1.id, cO2B1_1.id, faker.person.firstName(), faker.person.lastName(), fakerEmail('iec.uz'), fakerPhone())

  const mO1B1_1 = addModule(tO1B1_1.uniqueId, faker.lorem.words(3), cO1B1_1.id)
  addModule(tO1B1_1.uniqueId, faker.lorem.words(3), null)
  const mO2B1_1 = addModule(tO2B1_1.uniqueId, faker.lorem.words(3), cO2B1_1.id)

  const todayIso = new Date().toISOString()
  seedAttendanceForClass(cO1B1_1.id, cO1B1_1.studentIds, mO1B1_1.lessons[0].id, todayIso, 0.9, tO1B1_1.uniqueId)
  seedAttendanceForClass(cO1B1_2.id, cO1B1_2.studentIds, mO1B1_1.lessons[0].id, todayIso, 0.65, tO1B1_2.uniqueId)

  const currentMonth = monthAtOffset(0)
  const previousMonth = monthAtOffset(-1)
  seedAttendanceForClass(
    cO1B1_1.id,
    cO1B1_1.studentIds,
    mO1B1_1.lessons[1]?.id ?? mO1B1_1.lessons[0].id,
    `${currentMonth}-15T10:00:00.000Z`,
    0.85,
    tO1B1_1.uniqueId,
  )

  seedPayment(cO1B1_1.id, sAliya.uniqueId, 400_000, currentMonth, 'paid')
  seedPayment(cO1B1_1.id, cO1B1_1.studentIds[1], 450_000, currentMonth, 'paid')
  seedPayment(cO1B1_2.id, cO1B1_2.studentIds[0], 480_000, currentMonth, 'paid')
  seedPayment(cO1B1_1.id, sAliya.uniqueId, 350_000, previousMonth, 'paid')
  seedPayment(cO2B1_1.id, cO2B1_1.studentIds[0], 600_000, currentMonth, 'due')
  seedPayment(cO1B1_3.id, sDue.uniqueId, 520_000, currentMonth, 'due')
  seedPayment(cO1B1_3.id, sOverdue.uniqueId, 520_000, previousMonth, 'overdue')

  seedRating(cO1B1_1.id, mO1B1_1.lessons[0].id, sAliya.uniqueId, tO1B1_1.uniqueId)
  seedRating(cO2B1_1.id, mO2B1_1.lessons[0].id, cO2B1_1.studentIds[0], tO2B1_1.uniqueId)

  // ── Tasks for cO1B1_1
  DB.tasks.push(
    {
      id: uid(), classId: cO1B1_1.id, lessonId: mO1B1_1.lessons[0].id,
      title: 'Complete grammar exercises 1-10',
      description: 'Finish all exercises on page 23 of your workbook. Pay attention to tense forms.',
      dueDate: faker.date.soon({ days: 4 }).toISOString(),
      priority: 'important', createdBy: tO1B1_1.uniqueId,
      createdAt: faker.date.recent({ days: 2 }).toISOString(),
    },
    {
      id: uid(), classId: cO1B1_1.id, lessonId: mO1B1_1.lessons[1]?.id ?? mO1B1_1.lessons[0].id,
      title: 'Read chapter 3 and write a summary',
      description: 'Summarize the main ideas in 150-200 words.',
      dueDate: faker.date.soon({ days: 7 }).toISOString(),
      priority: 'normal', createdBy: tO1B1_1.uniqueId,
      createdAt: faker.date.recent({ days: 1 }).toISOString(),
    },
    {
      id: uid(), classId: cO1B1_1.id, lessonId: null,
      title: 'Prepare for the upcoming test',
      description: 'Review all vocabulary from modules 1 and 2. Test covers listening and reading.',
      dueDate: faker.date.soon({ days: 10 }).toISOString(),
      priority: 'important', createdBy: tO1B1_1.uniqueId,
      createdAt: faker.date.recent({ days: 3 }).toISOString(),
    },
  )

  // ── Teacher demo class cO1B1_1: readable curriculum, more students, photo homework per lesson
  cO1B1_1.name = 'English A1 · Morning'
  const unit1Titles =['Present Simple', 'Present Continuous', 'Simple vs Continuous', 'Daily routines', 'Unit 1 review']
  mO1B1_1.title = 'Unit 1 · Present tenses'
  mO1B1_1.lessons.forEach((l, i) => { l.title = unit1Titles[i] ?? `Lesson ${i + 1}` })

  const unit2Id = uid()
  DB.modules.push({
    id: unit2Id, teacherId: tO1B1_1.uniqueId, title: 'Unit 2 · Past tenses', classId: cO1B1_1.id,
    createdAt: new Date().toISOString(),
    lessons: ['Past Simple', 'Irregular verbs', 'Past Continuous'].map((title, i) => ({
      id: uid(), moduleId: unit2Id, title, order: i + 1,
    })),
  })

  addStudent(o1.org.id, o1b1.id, cO1B1_1.id, 'Aziza', 'Karimova', 'aziza.karimova@edunify.uz', fakerPhone())
  addStudent(o1.org.id, o1b1.id, cO1B1_1.id, 'Bekzod', 'Toshmatov', 'bekzod.toshmatov@edunify.uz', fakerPhone())
  addStudent(o1.org.id, o1b1.id, cO1B1_1.id, 'Dilnoza', 'Rahimova', 'dilnoza.rahimova@edunify.uz', fakerPhone())
  addStudent(o1.org.id, o1b1.id, cO1B1_1.id, 'Jasur', 'Aliyev', 'jasur.aliyev@edunify.uz', fakerPhone())

  const students1 = DB.users.filter(
    (u): u is StoredStudent => u.role === 'student' && cO1B1_1.studentIds.includes(u.uniqueId),
  )
  const comments = [
    'Done! Exercise 3 was a bit tricky, I am not sure about the last sentence.',
    'Here is my homework, two pages.',
    'I wrote 12 sentences instead of 10 :)',
    'Could you check number 5 please? I used "is going" there.',
    'All exercises finished.',
    'Page 2 is the vocabulary part.',
  ]
  const classLessons = DB.modules.filter((m) => m.classId === cO1B1_1.id).flatMap((m) => m.lessons)
  let photoSeed = 0
  classLessons.forEach((lesson, li) => {
    const lessonAge = (classLessons.length - li) * 2
    students1.forEach((s, si) => {
      // Recent lessons: not everyone has submitted yet
      if ((si + li) % 4 === 3 || (li >= classLessons.length - 2 && si % 2 === 1)) return
      const photoCount = 1 + ((si + li) % 3)
      const status: HomeworkStatus = li < classLessons.length - 3 ? 'reviewed' : (si + li) % 5 === 0 ? 'late' : 'submitted'
      const submitted = new Date(Date.now() - (lessonAge * 24 - si * 3) * 3_600_000)
      DB.homeworks.push({
        id: uid(), classId: cO1B1_1.id, lessonId: lesson.id,
        studentId: s.uniqueId, studentName: `${s.name} ${s.surname}`,
        comment: status === 'late'
          ? 'Sorry for the late submission, I was sick yesterday.'
          : comments[(si + li * 2) % comments.length],
        photos: Array.from({ length: photoCount }, (_, p) => homeworkPhoto(photoSeed++, `${lesson.title} — p.${p + 1}`)),
        submittedAt: submitted.toISOString(),
        status,
      })
    })
  })

  // ── Self-registered students with no class yet: a teacher links them by uniqueId
  const freeStudents: Array<[string, string, string, string]> = [
    ['K7M-2QX-9DP', 'Nodira', 'Ergasheva', 'nodira.ergasheva@edunify.uz'],
    ['R4T-8WN-3LB', 'Timur', 'Nazarov', 'timur.nazarov@edunify.uz'],
  ]
  for (const [uniqueId, name, surname, email] of freeStudents) {
    DB.users.push({
      uniqueId, name, surname, email, phone: fakerPhone(),
      role: 'student', connectionStatus: 'unconnected', requestedBranchId: null,
      classIds: [], statistics: { quizAvg: 0, homeworkCompletion: 0, attendancePct: 0 },
      password: DEMO_PASSWORD,
    })
  }
}

initializeDataset()

function monthHash(month: string, key: string): number {
  let h = 0;
  for (const c of `${month}:${key}`) {
    h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  }
  return Math.abs(h);
}

function classIdsInScope(orgId: string, branchId: string): string[] {
  return DB.classes
    .filter((c) => c.organizationId === orgId && c.branchId === branchId)
    .map((c) => c.id);
}

function studentsForMonth(orgId: string, branchId: string, month: string): number {
  const base = DB.users.filter(
    (u) => u.role === 'student' && u.organizationId === orgId && u.branchId === branchId,
  ).length;
  const offset = (monthHash(month, `stu:${branchId}`) % 21) - 10;
  return Math.max(0, base + offset);
}

function classesForMonth(orgId: string, branchId: string, month: string): number {
  const base = DB.classes.filter(
    (c) => c.organizationId === orgId && c.branchId === branchId,
  ).length;
  const offset = (monthHash(month, `cls:${branchId}`) % 9) - 4;
  return Math.max(0, base + offset);
}

function teachersForMonth(orgId: string, branchId: string, month: string): number {
  const base = DB.users.filter(
    (u) => u.role === 'teacher' && u.organizationId === orgId && u.branchId === branchId,
  ).length;
  const offset = (monthHash(month, `tch:${branchId}`) % 7) - 3;
  return Math.max(0, base + offset);
}

function attendanceCountsForMonth(orgId: string, branchId: string, month: string): AttendanceCounts {
  const classIds = classIdsInScope(orgId, branchId);
  const rows = DB.attendance.filter(
    (a) => classIds.includes(a.classId) && a.recordedAt.slice(0, 7) === month,
  );
  if (rows.length > 0) {
    return {
      present: rows.filter((a) => a.status === 'present').length,
      total: rows.length,
    };
  }
  const pct = 60 + (monthHash(month, `att:${branchId}`) % 36);
  const total = 10;
  return { present: Math.round((total * pct) / 100), total };
}

function attendanceCountsToday(orgId: string, branchId: string): AttendanceCounts {
  const today = new Date().toISOString().slice(0, 10);
  const classIds = classIdsInScope(orgId, branchId);
  const rows = DB.attendance.filter(
    (a) => classIds.includes(a.classId) && a.recordedAt.startsWith(today),
  );
  if (rows.length > 0) {
    return {
      present: rows.filter((a) => a.status === 'present').length,
      total: rows.length,
    };
  }
  const pct = 75 + (monthHash(today, `today:${branchId}`) % 20);
  const total = 10;
  return { present: Math.round((total * pct) / 100), total };
}

function studentCountForClassInMonth(classId: string, month: string): number {
  const cls = DB.classes.find((c) => c.id === classId);
  if (!cls) return 0;
  const base = cls.studentIds.length;
  const offset = (monthHash(month, `cls-stu:${classId}`) % 5) - 2;
  return Math.max(0, base + offset);
}

function expectedRevenueForMonth(orgId: string, branchId: string, month: string): number {
  return DB.classes
    .filter((c) => c.organizationId === orgId && c.branchId === branchId)
    .reduce((sum, cls) => sum + cls.classPrice * studentCountForClassInMonth(cls.id, month), 0);
}

function revenueForMonth(orgId: string, branchId: string, month: string): number {
  const classIds = classIdsInScope(orgId, branchId);
  const paid = DB.payments
    .filter((p) => classIds.includes(p.classId) && p.status === 'paid' && p.period === month)
    .reduce((sum, p) => sum + p.amount, 0);
  if (paid > 0) return paid;
  const expected = expectedRevenueForMonth(orgId, branchId, month);
  if (expected === 0) return 0;
  const ratio = 0.7 + (monthHash(month, `rev:${branchId}`) % 26) / 100;
  return Math.round(expected * ratio);
}

function paymentCountsForMonth(orgId: string, branchId: string, month: string): { paid: number; total: number } {
  const classIds = classIdsInScope(orgId, branchId);
  const total = studentsForMonth(orgId, branchId, month);
  const paidStudents = new Set(
    DB.payments
      .filter((p) => classIds.includes(p.classId) && p.status === 'paid' && p.period === month)
      .map((p) => p.studentId),
  ).size;
  if (paidStudents > 0) return { paid: paidStudents, total };
  if (total === 0) return { paid: 0, total: 0 };
  const ratio = 0.7 + (monthHash(month, `rev:${branchId}`) % 26) / 100;
  return { paid: Math.round(total * ratio), total };
}

function buildBranchStatisticsSnapshot(
  orgId: string,
  branchId: string,
  from: string,
  to: string,
): StatisticsSnapshot {
  const averageAttendanceCounts = attendanceCountsForMonth(orgId, branchId, to);
  const attendanceTodayCounts = attendanceCountsToday(orgId, branchId);

  return {
    students: buildCountMetric((m) => studentsForMonth(orgId, branchId, m), from, to),
    classes: buildCountMetric((m) => classesForMonth(orgId, branchId, m), from, to),
    teachers: buildCountMetric((m) => teachersForMonth(orgId, branchId, m), from, to),
    averageAttendance: attendancePctFromCounts(averageAttendanceCounts),
    attendanceToday: attendancePctFromCounts(attendanceTodayCounts),
    averageAttendanceCounts,
    attendanceTodayCounts,
    paymentCounts: paymentCountsForMonth(orgId, branchId, to),
    revenue: revenueForMonth(orgId, branchId, to),
    expectedRevenue: buildExpectedRevenueMetric(
      (m) => expectedRevenueForMonth(orgId, branchId, m),
      from,
      to,
    ),
  };
}

// ─────────────────────────────────────────────────────────────
// 5. AUTH HELPERS
// ─────────────────────────────────────────────────────────────

function findUserById(uniqueId: string): StoredAny | undefined {
  return DB.users.find((u) => u.uniqueId === uniqueId);
}

function resolveOrganizationNameForUser(user: StoredAny): string | null {
  if (user.role === 'student') {
    for (const classId of user.classIds) {
      const cls = DB.classes.find((c) => c.id === classId);
      if (cls) {
        const org = DB.orgs.find((o) => o.id === cls.organizationId);
        if (org) return org.name;
      }
    }
  }
  if (user.role === 'parent') {
    for (const childId of user.childIds) {
      const child = DB.users.find((x) => x.uniqueId === childId && x.role === 'student') as StoredStudent | undefined;
      if (child) {
        for (const classId of child.classIds) {
          const cls = DB.classes.find((c) => c.id === classId);
          if (cls) {
            const org = DB.orgs.find((o) => o.id === cls.organizationId);
            if (org) return org.name;
          }
        }
      }
    }
  }
  if ('organizationId' in user && user.organizationId) {
    const org = DB.orgs.find((o) => o.id === user.organizationId);
    if (org) return org.name;
  }
  return null;
}

function toProfile(user: StoredAny): z.infer<typeof profileSchema> {
  return validate(profileSchema, {
    uniqueId: user.uniqueId,
    name: user.name,
    surname: user.surname,
    email: user.email,
    phone: user.phone,
    organizationName: resolveOrganizationNameForUser(user),
  });
}

function isActivated(user: StoredAny): boolean {
  if (user.role === 'director') return user.directorActivationStatus === 'activated';
  if (user.role === 'teacher') return user.activationStatus === 'active';
  return true;
}

/** Verify token + lookup user. Returns 401 on any failure. */
function requireAuth(token: string | undefined): Result<StoredAny> {
  const userId = verifyToken(token);
  if (!userId) return err('Unauthorized', 401);
  const u = findUserById(userId);
  if (!u) return err('Unauthorized', 401);
  return ok(u);
}

/** Must be one of the listed roles. */
function requireRoles(token: string | undefined, ...roles: Role[]): Result<StoredAny> {
  const auth = requireAuth(token);
  if (!auth.ok) return auth;
  if (!roles.includes(auth.data.role)) return err(`Forbidden: requires ${roles.join(' or ')}`, 403);
  return ok(auth.data);
}

/** edunify_admin OR any member of the given org. Read-level access. */
function requireOrgAccess(token: string | undefined, orgId: string): Result<StoredAny> {
  const auth = requireAuth(token);
  if (!auth.ok) return auth;
  const u = auth.data;
  if (u.role === 'edunify_admin') return ok(u);
  if ('organizationId' in u && u.organizationId === orgId) return ok(u);
  if (u.role === 'parent') {
    const hasChildInOrg = u.childIds.some((childId) => {
      const child = DB.users.find((x) => x.uniqueId === childId && x.role === 'student') as StoredStudent | undefined;
      return child?.organizationId === orgId;
    });
    if (hasChildInOrg) return ok(u);
  }
  return err('Forbidden: not a member of this organization', 403);
}

/** edunify_admin OR org_owner of the given org. Org-level write access. */
function requireOrgOwner(token: string | undefined, orgId: string): Result<StoredAny> {
  const auth = requireAuth(token);
  if (!auth.ok) return auth;
  const u = auth.data;
  if (u.role === 'edunify_admin') return ok(u);
  if (u.role === 'director' && u.organizationId === orgId) return ok(u);
  return err('Forbidden: requires org_owner of this organization', 403);
}

/** edunify_admin OR (org_owner of parent org) OR (manager|administrator of that branch). Branch-level write. */
function requireBranchStaff(token: string | undefined, orgId: string, branchId: string): Result<StoredAny> {
  const auth = requireAuth(token);
  if (!auth.ok) return auth;
  const u = auth.data;
  if (u.role === 'edunify_admin') return ok(u);
  if (u.role === 'director' && u.organizationId === orgId) return ok(u);
  if ((u.role === 'manager' || u.role === 'administrator') && u.organizationId === orgId && u.branchId === branchId) return ok(u);
  return err('Forbidden: requires org_owner, manager, or administrator of this branch', 403);
}

/** Only the teacher themselves (not edunify_admin — they don't author content). */
function requireTeacherSelf(token: string | undefined, teacherId: string): Result<StoredTeacher> {
  const auth = requireAuth(token);
  if (!auth.ok) return auth;
  const u = auth.data;
  if (u.role === 'teacher' && u.uniqueId === teacherId) return ok(u);
  return err('Forbidden: only the teacher themselves', 403);
}

/** A student who may be linked to the class: exists, and is not tied to another organization. */
function findLinkableStudent(c: Class, uniqueId: string): Result<StoredStudent> {
  const s = DB.users.find((u): u is StoredStudent => u.role === 'student' && u.uniqueId === uniqueId.trim().toUpperCase());
  if (!s) return err('No student with this ID', 404);
  if (s.organizationId && s.organizationId !== c.organizationId) {
    return err('This student belongs to another organization', 403);
  }
  return ok(s);
}

/** Only the assigned teacher of the class. */
function requireClassTeacher(token: string | undefined, classId: string): Result<StoredTeacher> {
  const auth = requireAuth(token);
  if (!auth.ok) return auth;
  const u = auth.data;
  const c = DB.classes.find((x) => x.id === classId);
  if (!c) return err('Class not found', 404);
  if (u.role !== 'teacher' || u.uniqueId !== c.teacherId) {
    return err('Forbidden: only the assigned teacher of this class', 403);
  }
  return ok(u as StoredTeacher);
}

// ─────────────────────────────────────────────────────────────
// 6. API
// ─────────────────────────────────────────────────────────────

export const api = {
  // ── AUTH (public) ─────────────────────────────────────────
  async login(body: { email: string; password: string }): Promise<Result<AuthSession>> {
    await delay();
    const user = DB.users.find((u) => u.email === body.email && u.password === body.password);
    if (!user) return err('Invalid email or password', 401);
    if (!isActivated(user)) return err('Account not activated', 403);
    return ok(toAuthSession(makeToken(user.uniqueId), user));
  },

  async me(token: string): Promise<Result<AnyUser>> {
    await delay();
    const auth = requireAuth(token);
    if (!auth.ok) return auth;
    return ok(toAuthUser(auth.data) as AnyUser);
  },

  async getProfile(token: string): Promise<Result<z.infer<typeof profileSchema>>> {
    await delay();
    const auth = requireAuth(token);
    if (!auth.ok) return auth;
    return ok(toProfile(auth.data));
  },

  async patchProfile(
    token: string,
    body: { name: string; surname: string; email: string; phone: string },
  ): Promise<Result<z.infer<typeof profileSchema>>> {
    await delay();
    const auth = requireAuth(token);
    if (!auth.ok) return auth;
    const u = auth.data;
    const email = body.email.trim().toLowerCase();
    if (DB.users.some((x) => x.email === email && x.uniqueId !== u.uniqueId)) {
      return err('Email already registered', 409);
    }
    u.name = body.name.trim();
    u.surname = body.surname.trim();
    u.email = email;
    u.phone = body.phone.trim();
    return ok(toProfile(u));
  },

  async patchPassword(
    token: string,
    body: { currentPassword: string; newPassword: string },
  ): Promise<Result<z.infer<typeof changePasswordResultSchema>>> {
    await delay();
    const auth = requireAuth(token);
    if (!auth.ok) return auth;
    const u = auth.data;
    if (u.password !== body.currentPassword) return err('Current password is incorrect', 400);
    u.password = body.newPassword;
    return ok(validate(changePasswordResultSchema, { success: true as const }));
  },

  async getConnectionStatus(token: string): Promise<Result<z.infer<typeof connectionStatusResponseSchema>>> {
    await delay();
    const auth = requireAuth(token);
    if (!auth.ok) return auth;
    return ok(toConnectionStatus(auth.data));
  },

  async submitConnectionRequest(
    token: string,
    body: { branchId: string },
  ): Promise<Result<z.infer<typeof connectionStatusResponseSchema>>> {
    await delay();
    const auth = requireAuth(token);
    if (!auth.ok) return auth;
    const u = auth.data;
    if (!CONNECTABLE_ROLES.includes(u.role)) return err('Role cannot request branch connection', 403);
    if ('connectionStatus' in u && u.connectionStatus === 'connected') {
      return err('Already connected', 400);
    }
    const branch = DB.branches.find((b) => b.id === body.branchId);
    if (!branch) return err('Branch not found', 404);
    if ('connectionStatus' in u) {
      u.connectionStatus = 'unconnected';
      u.requestedBranchId = body.branchId;
    }
    return ok(toConnectionStatus(u));
  },

  /**
   * PUBLIC — self-service signup for every role except edunify_admin. Creates a
   * usable account and returns a session (signup logs you straight in). A
   * director also gets a fresh active org; other roles are attached to a default
   * seeded org/branch/class so their record satisfies the tenancy model. The
   * real backend mirrors this signature (it drops the token from the response
   * shape only by reusing the same { token, user } envelope).
   */
  async signup(body: {
    role: Exclude<Role, 'edunify_admin'>;
    name: string; surname: string; email: string; phone: string; password: string;
    organizationName?: string;
  }): Promise<Result<AuthSession>> {
    await delay();
    if (DB.users.some((u) => u.email === body.email)) return err('Email already registered', 409);
    const base = { uniqueId: generateConnectCode(), name: body.name, surname: body.surname, email: body.email, phone: body.phone, password: body.password };

    let user: StoredAny;
    switch (body.role) {
      case 'director': {
        const organizationName = body.organizationName?.trim();
        if (!organizationName) return err('Organization name is required', 400);
        const orgId = uid();
        DB.orgs.push({
          id: orgId, name: organizationName,
          email: body.email, phone: body.phone, ownerId: base.uniqueId,
          logoUrl: null, activationStatus: 'active', joinCode: generateConnectCode(),
          createdAt: new Date().toISOString(),
          ...defaultOrgThemes(),
        });
        user = { ...base, role: 'director', organizationId: orgId, directorActivationStatus: 'activated' };
        break;
      }
      case 'manager':
      case 'administrator': {
        user = {
          ...base,
          role: body.role,
          connectionStatus: 'unconnected',
          requestedBranchId: null,
        };
        break;
      }
      case 'teacher': {
        user = {
          ...base,
          role: 'teacher',
          connectionStatus: 'unconnected',
          requestedBranchId: null,
          classCategory: 'General',
          activationStatus: 'active',
        };
        break;
      }
      case 'student': {
        user = {
          ...base,
          role: 'student',
          connectionStatus: 'unconnected',
          requestedBranchId: null,
          classIds: [],
          statistics: { quizAvg: 0, homeworkCompletion: 0, attendancePct: 0 },
        };
        break;
      }
      case 'parent': {
        user = { ...base, role: 'parent', connectionStatus: 'unconnected', requestedBranchId: null, childIds: [] };
        break;
      }
    }

    DB.users.push(user);
    return ok(toAuthSession(makeToken(user.uniqueId), user));
  },

  // ── ORGS ──────────────────────────────────────────────────
  /** PUBLIC — anyone can sign up to create an org. Org starts 'pending'. */
  async createOrg(body: {
    name: string; email: string; phone: string;
    ownerName: string; ownerSurname: string;
    ownerEmail: string; ownerPhone: string;
    password: string; logoUrl?: string | null;
  }): Promise<Result<{ org: Organization; owner: AnyUser }>> {
    await delay();
    if (DB.users.some((u) => u.email === body.ownerEmail)) return err('Email already registered', 409);
    const orgId = uid();
    const owner: StoredOrgOwner = {
      uniqueId: generateConnectCode(), name: body.ownerName, surname: body.ownerSurname,
      email: body.ownerEmail, phone: body.ownerPhone,
      role: 'director', organizationId: orgId,
      directorActivationStatus: 'not_activated',
      password: body.password,
    };
    const org: Organization = {
      id: orgId, name: body.name, email: body.email, phone: body.phone, ownerId: owner.uniqueId,
      logoUrl: body.logoUrl ?? null, activationStatus: 'pending', joinCode: generateConnectCode(),
      createdAt: new Date().toISOString(),
      ...defaultOrgThemes(),
    };
    DB.orgs.push(org);
    DB.users.push(owner);
    return ok({ org, owner: stripPassword(owner) as AnyUser });
  },

  async approveOrg(orgId: string, token: string): Promise<Result<Organization>> {
    await delay();
    const auth = requireRoles(token, 'edunify_admin');
    if (!auth.ok) return auth;
    const org = DB.orgs.find((o) => o.id === orgId);
    if (!org) return err('Org not found', 404);
    org.activationStatus = 'active';
    const owner = DB.users.find(
      (u): u is StoredOrgOwner => u.role === 'director' && u.organizationId === orgId,
    );
    if (owner) owner.directorActivationStatus = 'activated';
    return ok(org);
  },

  async getOrg(orgId: string, token: string): Promise<Result<Organization>> {
    await delay();
    const auth = requireOrgAccess(token, orgId);
    if (!auth.ok) return auth;
    const org = DB.orgs.find((o) => o.id === orgId);
    if (!org) return err('Org not found', 404);
    return ok(validate(organizationSchema, org));
  },

  async resolveUserOrg(token: string): Promise<Result<Organization | null>> {
    await delay();
    const auth = requireAuth(token);
    if (!auth.ok) return auth;
    const u = auth.data;
    if ('organizationId' in u && u.organizationId) {
      const org = DB.orgs.find((o) => o.id === u.organizationId);
      return ok(org ? validate(organizationSchema, org) : null);
    }
    if (u.role === 'parent') {
      for (const childId of u.childIds) {
        const child = DB.users.find((x) => x.uniqueId === childId && x.role === 'student') as StoredStudent | undefined;
        if (child?.organizationId) {
          const org = DB.orgs.find((o) => o.id === child.organizationId);
          if (org) return ok(validate(organizationSchema, org));
        }
      }
    }
    return ok(null);
  },

  async patchOrgTheme(
    orgId: string,
    body: { lightTheme?: ThemeColors; darkTheme?: ThemeColors },
    token: string,
  ): Promise<Result<{ lightTheme: ThemeColors; darkTheme: ThemeColors }>> {
    await delay();
    const auth = requireOrgOwner(token, orgId);
    if (!auth.ok) return auth;
    const org = DB.orgs.find((o) => o.id === orgId);
    if (!org) return err('Org not found', 404);
    if (body.lightTheme) org.lightTheme = body.lightTheme;
    if (body.darkTheme) org.darkTheme = body.darkTheme;
    return ok(validate(orgThemePatchResultSchema, { lightTheme: org.lightTheme, darkTheme: org.darkTheme }));
  },

  async patchOrgLogo(orgId: string, _file: unknown, token: string): Promise<Result<{ logoUrl: string }>> {
    await delay();
    const auth = requireOrgOwner(token, orgId);
    if (!auth.ok) return auth;
    const org = DB.orgs.find((o) => o.id === orgId);
    if (!org) return err('Org not found', 404);
    const logoUrl = `https://placehold.co/120x120?text=ORG-${orgId}`;
    org.logoUrl = logoUrl;
    return ok(validate(orgLogoPatchResultSchema, { logoUrl }));
  },

  // ── PLATFORM (edunify_admin only) ─────────────────────────
  async listPlatformOrgs(token: string, params?: PageParams & { status?: ActivationStatus }): Promise<Result<Page<Organization>>> {
    await delay();
    const auth = requireRoles(token, 'edunify_admin');
    if (!auth.ok) return auth;
    const rows = params?.status ? DB.orgs.filter((o) => o.activationStatus === params.status) : DB.orgs;
    return ok(paginate(rows, params));
  },

  async listPlatformTeachers(token: string, params?: PageParams & { status?: ActivationStatus }): Promise<Result<Page<Teacher>>> {
    await delay();
    const auth = requireRoles(token, 'edunify_admin');
    if (!auth.ok) return auth;
    let rows = DB.users.filter((u): u is StoredTeacher => u.role === 'teacher');
    if (params?.status) rows = rows.filter((t) => t.activationStatus === params.status);
    return ok(paginate(rows.map((t) => stripPassword(t) as Teacher), params));
  },

  async approveTeacher(teacherId: string, token: string): Promise<Result<Teacher>> {
    await delay();
    const auth = requireRoles(token, 'edunify_admin');
    if (!auth.ok) return auth;
    const t = DB.users.find((u) => u.uniqueId === teacherId && u.role === 'teacher') as StoredTeacher | undefined;
    if (!t) return err('Teacher not found', 404);
    t.activationStatus = 'active';
    return ok(stripPassword(t) as Teacher);
  },

  // ── BRANCHES ──────────────────────────────────────────────
  async listBranches(orgId: string, token: string, params?: PageParams): Promise<Result<Page<Branch>>> {
    await delay();
    const auth = requireOrgAccess(token, orgId);
    if (!auth.ok) return auth;
    if (!DB.orgs.find((o) => o.id === orgId)) return err('Org not found', 404);
    const page = paginate(DB.branches.filter((b) => b.organizationId === orgId), params);
    return ok(validate(pageSchema(branchSchema), page));
  },

  async getBranchStudentCounts(orgId: string, token: string): Promise<Result<Record<string, number>>> {
    await delay();
    const auth = requireOrgAccess(token, orgId);
    if (!auth.ok) return auth;
    if (!DB.orgs.find((o) => o.id === orgId)) return err('Org not found', 404);
    const counts: Record<string, number> = {};
    for (const branch of DB.branches.filter((b) => b.organizationId === orgId)) {
      counts[branch.id] = DB.users.filter(
        (u) => u.role === 'student' && u.organizationId === orgId && u.branchId === branch.id,
      ).length;
    }
    return ok(validate(branchStudentCountsSchema, counts));
  },

  async listBranchManagers(orgId: string, branchId: string, token: string, params?: PageParams): Promise<Result<Page<Manager>>> {
    await delay();
    const auth = requireOrgAccess(token, orgId);
    if (!auth.ok) return auth;
    if (!DB.branches.find((b) => b.id === branchId && b.organizationId === orgId)) return err('Branch not found', 404);
    const rows = DB.users
      .filter((u) => u.role === 'manager' && u.organizationId === orgId && u.branchId === branchId)
      .map((u) => validate(branchManagerSchema, stripPassword(u)));
    return ok(validate(pageSchema(branchManagerSchema), paginate(rows, params)) as Page<Manager>);
  },

  async assignBranchManager(orgId: string, branchId: string, body: {
    name: string; managerId: string;
  }, token: string): Promise<Result<Manager>> {
    await delay();
    const auth = requireOrgOwner(token, orgId);
    if (!auth.ok) return auth;
    if (!DB.branches.find((b) => b.id === branchId && b.organizationId === orgId)) return err('Branch not found', 404);
    const manager = DB.users.find(
      (u): u is StoredManager => u.role === 'manager' && u.uniqueId === body.managerId.trim(),
    );
    if (!manager) return err('Manager not found', 404);
    const fullName = `${manager.name} ${manager.surname}`.trim();
    if (fullName.toLowerCase() !== body.name.trim().toLowerCase()) {
      return err('Manager name does not match', 400);
    }
    manager.organizationId = orgId;
    manager.branchId = branchId;
    manager.connectionStatus = 'connected';
    manager.requestedBranchId = null;
    return ok(validate(branchManagerSchema, stripPassword(manager)) as Manager);
  },

  async listBranchAdministrators(orgId: string, branchId: string, token: string, params?: PageParams): Promise<Result<Page<Administrator>>> {
    await delay();
    const auth = requireOrgAccess(token, orgId);
    if (!auth.ok) return auth;
    if (!DB.branches.find((b) => b.id === branchId && b.organizationId === orgId)) return err('Branch not found', 404);
    const rows = DB.users
      .filter((u) => u.role === 'administrator' && u.organizationId === orgId && u.branchId === branchId)
      .map((u) => validate(branchAdministratorSchema, stripPassword(u)));
    return ok(validate(pageSchema(branchAdministratorSchema), paginate(rows, params)) as Page<Administrator>);
  },

  async listBranchTeachers(orgId: string, branchId: string, token: string, params?: PageParams): Promise<Result<Page<Teacher>>> {
    await delay();
    const auth = requireOrgAccess(token, orgId);
    if (!auth.ok) return auth;
    if (!DB.branches.find((b) => b.id === branchId && b.organizationId === orgId)) return err('Branch not found', 404);
    const rows = DB.users
      .filter((u) => u.role === 'teacher' && u.organizationId === orgId && u.branchId === branchId)
      .map((u) => validate(branchTeacherSchema, stripPassword(u)));
    return ok(validate(pageSchema(branchTeacherSchema), paginate(rows, params)) as Page<Teacher>);
  },

  /** Branch staff (or org_owner) link an existing administrator to the branch by id. */
  async assignBranchAdministrator(orgId: string, branchId: string, body: {
    administratorId: string;
  }, token: string): Promise<Result<Administrator>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    if (!DB.branches.find((b) => b.id === branchId && b.organizationId === orgId)) return err('Branch not found', 404);
    const administrator = DB.users.find(
      (u): u is StoredAdministrator => u.role === 'administrator' && u.uniqueId === body.administratorId.trim(),
    );
    if (!administrator) return err('Administrator not found', 404);
    administrator.organizationId = orgId;
    administrator.branchId = branchId;
    administrator.connectionStatus = 'connected';
    administrator.requestedBranchId = null;
    return ok(validate(branchAdministratorSchema, stripPassword(administrator)) as Administrator);
  },

  /** Branch staff (or org_owner) link an existing teacher to the branch by id. */
  async assignBranchTeacher(orgId: string, branchId: string, body: {
    teacherId: string;
  }, token: string): Promise<Result<Teacher>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    if (!DB.branches.find((b) => b.id === branchId && b.organizationId === orgId)) return err('Branch not found', 404);
    const teacher = DB.users.find(
      (u): u is StoredTeacher => u.role === 'teacher' && u.uniqueId === body.teacherId.trim(),
    );
    if (!teacher) return err('Teacher not found', 404);
    teacher.organizationId = orgId;
    teacher.branchId = branchId;
    teacher.connectionStatus = 'connected';
    teacher.requestedBranchId = null;
    return ok(validate(branchTeacherSchema, stripPassword(teacher)) as Teacher);
  },

  async removeBranchAdministrator(orgId: string, branchId: string, administratorId: string, token: string): Promise<Result<null>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    if (administratorId === auth.data.uniqueId) return err('You cannot remove yourself from the branch', 400);
    const administrator = DB.users.find(
      (u): u is StoredAdministrator =>
        u.role === 'administrator' &&
        u.organizationId === orgId &&
        u.uniqueId === administratorId &&
        u.branchId === branchId,
    );
    if (!administrator) return err('Administrator not found on this branch', 404);
    administrator.branchId = undefined;
    administrator.organizationId = undefined;
    administrator.connectionStatus = 'unconnected';
    administrator.requestedBranchId = null;
    return ok(null);
  },

  /** Unlink a teacher from the branch; cascade-unassign their branch classes and auto-disconnect those modules. */
  async removeBranchTeacher(orgId: string, branchId: string, teacherId: string, token: string): Promise<Result<null>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    const teacher = DB.users.find(
      (u): u is StoredTeacher =>
        u.role === 'teacher' &&
        u.organizationId === orgId &&
        u.uniqueId === teacherId &&
        u.branchId === branchId,
    );
    if (!teacher) return err('Teacher not found on this branch', 404);
    for (const c of DB.classes) {
      if (c.teacherId === teacherId && c.organizationId === orgId && c.branchId === branchId) {
        c.teacherId = null;
        for (const m of DB.modules) {
          if (m.teacherId === teacherId && m.classId === c.id) m.classId = null;
        }
      }
    }
    teacher.branchId = undefined;
    teacher.organizationId = undefined;
    teacher.connectionStatus = 'unconnected';
    teacher.requestedBranchId = null;
    return ok(null);
  },

  async removeBranchManager(orgId: string, branchId: string, managerId: string, token: string): Promise<Result<null>> {
    await delay();
    const auth = requireOrgOwner(token, orgId);
    if (!auth.ok) return auth;
    const manager = DB.users.find(
      (u): u is StoredManager =>
        u.role === 'manager' &&
        u.organizationId === orgId &&
        u.uniqueId === managerId &&
        u.branchId === branchId,
    );
    if (!manager) return err('Manager not found on this branch', 404);
    manager.branchId = undefined;
    manager.organizationId = undefined;
    manager.connectionStatus = 'unconnected';
    manager.requestedBranchId = null;
    return ok(null);
  },

  async getBranch(orgId: string, branchId: string, token: string): Promise<Result<Branch>> {
    await delay();
    const auth = requireOrgAccess(token, orgId);
    if (!auth.ok) return auth;
    const b = DB.branches.find((x) => x.id === branchId && x.organizationId === orgId);
    if (!b) return err('Branch not found', 404);
    return ok(b);
  },

  async createBranch(orgId: string, body: { name: string }, token: string): Promise<Result<Branch>> {
    await delay();
    const auth = requireOrgOwner(token, orgId);
    if (!auth.ok) return auth;
    if (!DB.orgs.find((o) => o.id === orgId)) return err('Org not found', 404);
    const name = body.name.trim();
    if (!name) return err('Branch name is required', 400);
    const b: Branch = { id: uniqueBranchId(), organizationId: orgId, name, createdAt: new Date().toISOString() };
    DB.branches.push(b);
    return ok(validate(branchSchema, b));
  },

  async deleteBranch(orgId: string, branchId: string, token: string): Promise<Result<null>> {
    await delay();
    const auth = requireOrgOwner(token, orgId);
    if (!auth.ok) return auth;
    const idx = DB.branches.findIndex((b) => b.id === branchId && b.organizationId === orgId);
    if (idx < 0) return err('Branch not found', 404);
    if (DB.classes.some((c) => c.branchId === branchId)) {
      return err('The branch still has classes. Move or delete them first.', 409);
    }
    DB.branches.splice(idx, 1);
    return ok(null);
  },

  async updateBranch(orgId: string, branchId: string, body: { name: string }, token: string): Promise<Result<Branch>> {
    await delay();
    const auth = requireOrgOwner(token, orgId);
    if (!auth.ok) return auth;
    const branch = DB.branches.find((b) => b.id === branchId && b.organizationId === orgId);
    if (!branch) return err('Branch not found', 404);
    const name = body.name.trim();
    if (!name) return err('Branch name is required', 400);
    branch.name = name;
    return ok(validate(branchSchema, branch));
  },

  async getBranchStats(orgId: string, branchId: string, token: string): Promise<Result<BranchStats>> {
    await delay();
    const auth = requireOrgAccess(token, orgId);
    if (!auth.ok) return auth;
    const b = DB.branches.find((x) => x.id === branchId && x.organizationId === orgId);
    if (!b) return err('Branch not found', 404);
    const classIds = DB.classes.filter((c) => c.branchId === branchId).map((c) => c.id);
    const att = DB.attendance.filter((a) => classIds.includes(a.classId));
    const present = att.filter((a) => a.status === 'present').length;
    const attendancePct = att.length ? Math.round((present / att.length) * 100) : null;
    const ratings = DB.ratings.filter((r) => classIds.includes(r.classId));
    const avgRating = ratings.length
      ? Math.round((ratings.reduce((s, r) => s + r.score, 0) / ratings.length) * 10) / 10
      : null;
    const payments = DB.payments.filter((p) => classIds.includes(p.classId));
    return ok({
      branchId,
      attendancePct,
      avgRating,
      paymentSummary: {
        total: payments.length,
        paid: payments.filter((p) => p.status === 'paid').length,
        due: payments.filter((p) => p.status === 'due').length,
        overdue: payments.filter((p) => p.status === 'overdue').length,
      },
    });
  },

  // ── STAFF (manager / administrator) ───────────────────────
  async createManager(orgId: string, branchId: string, body: {
    name: string; surname: string; email: string; phone: string; password: string;
  }, token: string): Promise<Result<AnyUser>> {
    await delay();
    const auth = requireOrgOwner(token, orgId);
    if (!auth.ok) return auth;
    const b = DB.branches.find((x) => x.id === branchId && x.organizationId === orgId);
    if (!b) return err('Branch not found', 404);
    if (DB.users.some((u) => u.email === body.email)) return err('Email already registered', 409);
    const u: StoredManager = {
      uniqueId: generateConnectCode(), name: body.name, surname: body.surname,
      email: body.email, phone: body.phone,
      role: 'manager',
      connectionStatus: 'connected',
      organizationId: orgId,
      branchId,
      requestedBranchId: null,
      password: body.password,
    };
    DB.users.push(u);
    return ok(stripPassword(u) as AnyUser);
  },

  async createAdministrator(orgId: string, branchId: string, body: {
    name: string; surname: string; email: string; phone: string; password: string;
  }, token: string): Promise<Result<AnyUser>> {
    await delay();
    const auth = requireOrgOwner(token, orgId);
    if (!auth.ok) return auth;
    const b = DB.branches.find((x) => x.id === branchId && x.organizationId === orgId);
    if (!b) return err('Branch not found', 404);
    if (DB.users.some((u) => u.email === body.email)) return err('Email already registered', 409);
    const u: StoredAdministrator = {
      uniqueId: generateConnectCode(), name: body.name, surname: body.surname,
      email: body.email, phone: body.phone,
      role: 'administrator',
      connectionStatus: 'connected',
      organizationId: orgId,
      branchId,
      requestedBranchId: null,
      password: body.password,
    };
    DB.users.push(u);
    return ok(stripPassword(u) as AnyUser);
  },

  // ── TEACHERS ──────────────────────────────────────────────
  async createTeacher(orgId: string, branchId: string, body: {
    name: string; surname: string; email: string; phone: string; password: string; classCategory: string;
  }, token: string): Promise<Result<AnyUser>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    const b = DB.branches.find((x) => x.id === branchId && x.organizationId === orgId);
    if (!b) return err('Branch not found', 404);
    if (DB.users.some((u) => u.email === body.email)) return err('Email already registered', 409);
    const u: StoredTeacher = {
      uniqueId: generateConnectCode(), name: body.name, surname: body.surname,
      email: body.email, phone: body.phone,
      role: 'teacher',
      connectionStatus: 'connected',
      organizationId: orgId,
      branchId,
      requestedBranchId: null,
      classCategory: body.classCategory,
      activationStatus: 'pending',
      password: body.password,
    };
    DB.users.push(u);
    return ok(stripPassword(u) as AnyUser);
  },

  async listTeachers(orgId: string, token: string, params?: PageParams & { branchId?: string }): Promise<Result<Page<Teacher>>> {
    await delay();
    const auth = requireOrgAccess(token, orgId);
    if (!auth.ok) return auth;
    let rows = DB.users.filter((u): u is StoredTeacher => u.role === 'teacher' && u.organizationId === orgId);
    if (params?.branchId) rows = rows.filter((t) => t.branchId === params.branchId);
    return ok(paginate(rows.map((t) => stripPassword(t) as Teacher), params));
  },

  async getTeacher(teacherId: string, token: string): Promise<Result<Teacher>> {
    await delay();
    const t = DB.users.find((u) => u.uniqueId === teacherId && u.role === 'teacher') as StoredTeacher | undefined;
    if (!t) return err('Teacher not found', 404);
    if (!t.organizationId) return err('Teacher not connected', 404);
    const auth = requireOrgAccess(token, t.organizationId);
    if (!auth.ok) return auth;
    return ok(stripPassword(t) as Teacher);
  },

  // ── CLASSES ───────────────────────────────────────────────
  async listClasses(orgId: string, branchId: string, token: string, params?: PageParams): Promise<Result<Page<Class>>> {
    await delay();
    const auth = requireOrgAccess(token, orgId);
    if (!auth.ok) return auth;
    if (!DB.branches.find((b) => b.id === branchId && b.organizationId === orgId)) return err('Branch not found', 404);
    return ok(paginate(DB.classes.filter((c) => c.organizationId === orgId && c.branchId === branchId), params));
  },

  async getClass(classId: string, token: string): Promise<Result<Class>> {
    await delay();
    const c = DB.classes.find((x) => x.id === classId);
    if (!c) return err('Class not found', 404);
    const auth = requireOrgAccess(token, c.organizationId);
    if (!auth.ok) return auth;
    return ok({ ...c, studentIds: [...c.studentIds] });
  },

  async createClass(orgId: string, branchId: string, body: { name: string; teacherId: string | null }, token: string): Promise<Result<Class>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    const b = DB.branches.find((x) => x.id === branchId && x.organizationId === orgId);
    if (!b) return err('Branch not found', 404);
    if (body.teacherId) {
      const t = DB.users.find((u) => u.uniqueId === body.teacherId && u.role === 'teacher') as StoredTeacher | undefined;
      if (!t || t.organizationId !== orgId || t.branchId !== branchId) {
        return err('Teacher must belong to the same branch', 400);
      }
    }
    const c: Class = {
      id: uid(), organizationId: orgId, branchId, name: body.name,
      teacherId: body.teacherId, studentIds: [], classPrice: 0, joinCode: generateConnectCode(),
      createdAt: new Date().toISOString(),
    };
    DB.classes.push(c);
    return ok(c);
  },

  /** Branch staff or org_owner can assign teachers to classes. */
  async assignTeacherToClass(classId: string, teacherId: string, token: string): Promise<Result<Class>> {
    await delay();
    const c = DB.classes.find((x) => x.id === classId);
    if (!c) return err('Class not found', 404);
    const auth = requireBranchStaff(token, c.organizationId, c.branchId);
    if (!auth.ok) return auth;
    const t = DB.users.find((u) => u.uniqueId === teacherId && u.role === 'teacher') as StoredTeacher | undefined;
    if (!t) return err('Teacher not found', 404);
    if (t.organizationId !== c.organizationId || t.branchId !== c.branchId) {
      return err('Teacher must belong to the same branch as the class', 400);
    }
    c.teacherId = teacherId;
    return ok(c);
  },

  /** Branch staff or org_owner can unassign. Modules auto-disconnect. */
  async unassignTeacherFromClass(classId: string, token: string): Promise<Result<Class>> {
    await delay();
    const c = DB.classes.find((x) => x.id === classId);
    if (!c) return err('Class not found', 404);
    const auth = requireBranchStaff(token, c.organizationId, c.branchId);
    if (!auth.ok) return auth;
    const previousTeacherId = c.teacherId;
    c.teacherId = null;
    if (previousTeacherId) {
      for (const m of DB.modules) {
        if (m.teacherId === previousTeacherId && m.classId === classId) m.classId = null;
      }
    }
    return ok(c);
  },

  // ── STUDENTS ──────────────────────────────────────────────
  async listStudents(classId: string, token: string, params?: PageParams): Promise<Result<Page<Student>>> {
    await delay();
    const c = DB.classes.find((x) => x.id === classId);
    if (!c) return err('Class not found', 404);
    const auth = requireOrgAccess(token, c.organizationId);
    if (!auth.ok) return auth;
    const rows = DB.users.filter(
      (u): u is StoredStudent => u.role === 'student' && c.studentIds.includes(u.uniqueId),
    );
    return ok(paginate(rows.map((s) => stripPassword(s) as Student), params));
  },

  async createStudent(orgId: string, branchId: string, classId: string, body: {
    name: string; surname: string; email: string; phone: string; password: string;
  }, token: string): Promise<Result<AnyUser>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    const c = DB.classes.find((x) => x.id === classId && x.organizationId === orgId && x.branchId === branchId);
    if (!c) return err('Class not found in given org/branch', 404);
    if (DB.users.some((u) => u.email === body.email)) return err('Email already registered', 409);
    const s: StoredStudent = {
      uniqueId: generateConnectCode(), name: body.name, surname: body.surname,
      email: body.email, phone: body.phone,
      role: 'student',
      connectionStatus: 'connected',
      organizationId: orgId,
      branchId,
      requestedBranchId: null,
      classIds: [classId],
      statistics: { quizAvg: 0, homeworkCompletion: 0, attendancePct: 0 },
      password: body.password,
    };
    DB.users.push(s);
    c.studentIds.push(s.uniqueId);
    return ok(stripPassword(s) as AnyUser);
  },

  /** Student joins a class via its joinCode. Caller must be the student themselves. */
  async joinClassByCode(joinCode: string, token: string): Promise<Result<Class>> {
    await delay();
    const auth = requireRoles(token, 'student');
    if (!auth.ok) return auth;
    const s = auth.data as StoredStudent;
    const c = DB.classes.find((x) => x.joinCode === joinCode);
    if (!c) return err('Invalid join code', 404);
    if (c.organizationId !== s.organizationId) return err('Class belongs to a different organization', 403);
    if (!c.studentIds.includes(s.uniqueId)) c.studentIds.push(s.uniqueId);
    if (!s.classIds.includes(c.id)) s.classIds.push(c.id);
    return ok(c);
  },

  // ── MODULES ───────────────────────────────────────────────
  async listTeacherModules(teacherId: string, token: string, params?: PageParams & { classId?: string | null }): Promise<Result<Page<Module>>> {
    await delay();
    const auth = requireTeacherSelf(token, teacherId);
    if (!auth.ok) return auth;
    let rows = DB.modules.filter((m) => m.teacherId === teacherId);
    if (params && 'classId' in params) {
      if (params.classId === null) rows = rows.filter((m) => m.classId === null);
      else if (typeof params.classId === 'string') rows = rows.filter((m) => m.classId === params.classId);
    }
    return ok(paginate(rows, params));
  },

  /** Modules connected to a class — readable by anyone in the org. */
  async listClassModules(classId: string, token: string, params?: PageParams): Promise<Result<Page<Module>>> {
    await delay();
    const c = DB.classes.find((x) => x.id === classId);
    if (!c) return err('Class not found', 404);
    const auth = requireOrgAccess(token, c.organizationId);
    if (!auth.ok) return auth;
    const rows = DB.modules
      .filter((m) => m.classId === classId)
      .map((m) => ({ ...m, lessons: [...m.lessons].sort((a, b) => a.order - b.order) }));
    return ok(paginate(rows, params));
  },

  async createModule(teacherId: string, body: { title: string }, token: string): Promise<Result<Module>> {
    await delay();
    const auth = requireTeacherSelf(token, teacherId);
    if (!auth.ok) return auth;
    const m: Module = {
      id: uid(), teacherId, title: body.title, classId: null, lessons: [],
      createdAt: new Date().toISOString(),
    };
    DB.modules.push(m);
    return ok(m);
  },

  async connectModuleToClass(moduleId: string, classId: string, token: string): Promise<Result<Module>> {
    await delay();
    const m = DB.modules.find((x) => x.id === moduleId);
    if (!m) return err('Module not found', 404);
    const auth = requireTeacherSelf(token, m.teacherId);
    if (!auth.ok) return auth;
    const c = DB.classes.find((x) => x.id === classId);
    if (!c) return err('Class not found', 404);
    if (c.teacherId === null) return err('Class has no assigned teacher', 400);
    if (c.teacherId !== m.teacherId) return err('Class is not taught by this module\u2019s teacher', 400);
    m.classId = classId;
    return ok(m);
  },

  async disconnectModuleFromClass(moduleId: string, token: string): Promise<Result<Module>> {
    await delay();
    const m = DB.modules.find((x) => x.id === moduleId);
    if (!m) return err('Module not found', 404);
    const auth = requireTeacherSelf(token, m.teacherId);
    if (!auth.ok) return auth;
    m.classId = null;
    return ok(m);
  },

  /** Class teacher creates a module already connected to the class. */
  async createClassModule(classId: string, body: { title: string }, token: string): Promise<Result<Module>> {
    await delay();
    const auth = requireClassTeacher(token, classId);
    if (!auth.ok) return auth;
    const title = body.title.trim();
    if (!title) return err('Title is required', 400);
    const m: Module = {
      id: uid(), teacherId: auth.data.uniqueId, title, classId, lessons: [],
      createdAt: new Date().toISOString(),
    };
    DB.modules.push(m);
    return ok({ ...m, lessons: [] });
  },

  async createLesson(moduleId: string, body: { title: string }, token: string): Promise<Result<Lesson>> {
    await delay();
    const m = DB.modules.find((x) => x.id === moduleId);
    if (!m) return err('Module not found', 404);
    const auth = requireTeacherSelf(token, m.teacherId);
    if (!auth.ok) return auth;
    const lesson: Lesson = { id: uid(), moduleId, title: body.title, order: m.lessons.length + 1 };
    m.lessons.push(lesson);
    return ok(lesson);
  },

  // ── TEACHER CLASSES ───────────────────────────────────────
  async listTeacherClasses(teacherId: string, token: string): Promise<Result<Page<Class>>> {
    await delay();
    const auth = requireTeacherSelf(token, teacherId);
    if (!auth.ok) return auth;
    const rows = DB.classes.filter((c) => c.teacherId === teacherId).map((c) => ({ ...c, studentIds: [...c.studentIds] }));
    return ok(paginate(rows));
  },

  // ── BRANCH CLASSES (staff) ────────────────────────────────
  async listBranchClasses(orgId: string, branchId: string, token: string): Promise<Result<unknown>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    if (!DB.branches.find((b) => b.id === branchId && b.organizationId === orgId)) return err('Branch not found', 404);
    const rows = DB.classes.filter((c) => c.organizationId === orgId && c.branchId === branchId).map(toBranchClassDto);
    return ok(paginate(rows, { pageSize: 100 }));
  },

  async createBranchClass(orgId: string, branchId: string, body: { name: string; classPrice: number; teacherId: string | null }, token: string): Promise<Result<unknown>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    if (!DB.branches.find((b) => b.id === branchId && b.organizationId === orgId)) return err('Branch not found', 404);
    if (body.teacherId && !isBranchTeacher(body.teacherId, orgId, branchId)) return err('The teacher must be connected to this branch', 400);
    const c: Class = {
      id: uid(), organizationId: orgId, branchId, name: body.name.trim(), teacherId: body.teacherId,
      studentIds: [], classPrice: body.classPrice, joinCode: generateConnectCode(), createdAt: new Date().toISOString(),
    };
    DB.classes.push(c);
    return ok(toBranchClassDto(c));
  },

  async updateBranchClass(orgId: string, branchId: string, classId: string, body: {
    name?: string; teacherId?: string | null; price?: { amount: number; effectiveFrom: string };
  }, token: string): Promise<Result<unknown>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    const c = DB.classes.find((x) => x.id === classId && x.organizationId === orgId && x.branchId === branchId);
    if (!c) return err('Class not found', 404);
    const now = localIsoDate(new Date()).slice(0, 7);
    if (body.price && body.price.effectiveFrom < now) return err('A price change cannot start in a past month', 400);
    if (body.teacherId && !isBranchTeacher(body.teacherId, orgId, branchId)) return err('The teacher must be connected to this branch', 400);
    if (body.name !== undefined) c.name = body.name.trim();
    if (body.teacherId !== undefined && body.teacherId !== c.teacherId) {
      for (const m of DB.modules) if (m.classId === c.id && m.teacherId === c.teacherId) m.classId = null;
      c.teacherId = body.teacherId;
    }
    if (body.price) {
      if (body.price.effectiveFrom <= now) {
        c.classPrice = body.price.amount;
        delete c.scheduledPrice;
      } else {
        c.scheduledPrice = { price: body.price.amount, effectiveFrom: body.price.effectiveFrom };
      }
    }
    return ok(toBranchClassDto(c));
  },

  async deleteBranchClass(orgId: string, branchId: string, classId: string, token: string): Promise<Result<null>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    const idx = DB.classes.findIndex((x) => x.id === classId && x.organizationId === orgId && x.branchId === branchId);
    if (idx < 0) return err('Class not found', 404);
    if (DB.classes[idx].studentIds.length) return err('The class still has students. Remove them first.', 409);
    if (DB.payments.some((p) => p.classId === classId && p.status === 'paid')) return err('The class has payment history and cannot be deleted.', 409);
    for (const m of DB.modules) if (m.classId === classId) m.classId = null;
    DB.classes.splice(idx, 1);
    return ok(null);
  },

  // ── PARENT ────────────────────────────────────────────────
  async listParentChildren(parentId: string, token: string): Promise<Result<unknown>> {
    await delay();
    const auth = requireAuth(token);
    if (!auth.ok) return auth;
    const p = auth.data;
    if (p.role !== 'parent' || p.uniqueId !== parentId) return err('Forbidden: only the parent themselves', 403);
    return ok(p.childIds
      .map((id) => DB.users.find((u): u is StoredStudent => u.role === 'student' && u.uniqueId === id))
      .filter((s): s is StoredStudent => !!s)
      .map((s) => ({ uniqueId: s.uniqueId, name: s.name, surname: s.surname, classes: mockChildClasses(s.uniqueId) })));
  },

  async getChildOverview(parentId: string, studentId: string, token: string): Promise<Result<unknown>> {
    await delay();
    const auth = requireAuth(token);
    if (!auth.ok) return auth;
    const p = auth.data;
    if (p.role !== 'parent' || p.uniqueId !== parentId) return err('Forbidden: only the parent themselves', 403);
    const s = p.childIds.includes(studentId)
      ? DB.users.find((u): u is StoredStudent => u.role === 'student' && u.uniqueId === studentId)
      : undefined;
    if (!s) return err('Child not found', 404);
    const classes = DB.classes.filter((c) => c.studentIds.includes(studentId));
    const nameOf = (classId: string) => classes.find((c) => c.id === classId)?.name ?? '';
    const lessonTitle = (lessonId: string | null) => (lessonId ? DB.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId)?.title ?? null : null);
    const counts = mockAttendanceCounts(classes, studentId);
    const since = localIsoDate(new Date(Date.now() - 29 * 86_400_000));
    const today = localIsoDate(new Date());
    const recentAttendance = DB.attendance
      .filter((a) => a.studentId === studentId && a.date >= since && a.date <= today && classes.some((c) => c.id === a.classId))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10)
      .map((a) => ({ date: a.date, className: nameOf(a.classId), status: a.status }));
    const submissions = DB.homeworks.filter((h) => h.studentId === studentId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    const submitted = new Set(submissions.map((h) => h.lessonId));
    const now = new Date().toISOString();
    const tasks = DB.tasks.filter((t) => classes.some((c) => c.id === t.classId)).sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));
    const taskDto = (t: Task) => ({
      taskId: t.id, title: t.title, description: t.description, dueDate: t.dueDate, priority: t.priority,
      className: nameOf(t.classId), lessonTitle: lessonTitle(t.lessonId), submitted: !!t.lessonId && submitted.has(t.lessonId),
    });
    const unpaid = classes.flatMap((c) => mockUnpaidLines(c, studentId)).sort((a, b) => a.period.localeCompare(b.period));
    return ok({
      student: { uniqueId: s.uniqueId, name: s.name, surname: s.surname },
      classes: mockChildClasses(studentId),
      attendance: { ...counts, pct: counts.total ? Math.round((counts.present / counts.total) * 100) : null, recent: recentAttendance },
      homework: {
        upcoming: tasks.filter((t) => !t.dueDate || t.dueDate >= now).slice(0, 10).map(taskDto),
        missing: tasks.filter((t) => t.lessonId && t.dueDate && t.dueDate < now && !submitted.has(t.lessonId)).map(taskDto),
        recent: submissions.slice(0, 10).map((h) => ({
          id: h.id, className: nameOf(h.classId), lessonTitle: lessonTitle(h.lessonId) ?? '', status: h.status,
          submittedAt: h.submittedAt, photoCount: h.photos.length, comment: h.comment,
        })),
      },
      payments: {
        outstanding: unpaid.reduce((sum, l) => sum + l.balance, 0),
        overdue: unpaid.filter((l) => l.status === 'overdue').reduce((sum, l) => sum + l.balance, 0),
        unpaid,
        recent: DB.payments
          .filter((pay) => pay.studentId === studentId && pay.status === 'paid' && classes.some((c) => c.id === pay.classId))
          .sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? ''))
          .slice(0, 10)
          .map((pay) => ({ id: pay.id, className: nameOf(pay.classId), period: pay.period, amount: pay.amount, paidAt: pay.paidAt ?? pay.recordedAt })),
      },
    });
  },

  async listStudentParents(orgId: string, branchId: string, studentId: string, token: string): Promise<Result<unknown>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    return ok(DB.users
      .filter((u): u is StoredParent => u.role === 'parent' && u.childIds.includes(studentId))
      .map((u) => ({ uniqueId: u.uniqueId, name: u.name, surname: u.surname, phone: u.phone, email: u.email })));
  },

  async lookupParent(orgId: string, branchId: string, uniqueId: string, token: string): Promise<Result<unknown>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    const p = DB.users.find((u) => u.role === 'parent' && u.uniqueId === uniqueId.trim().toUpperCase());
    if (!p) return err('No parent with this ID', 404);
    return ok({ uniqueId: p.uniqueId, name: p.name, surname: p.surname });
  },

  async linkParent(orgId: string, branchId: string, studentId: string, parentId: string, token: string): Promise<Result<unknown>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    const p = DB.users.find((u): u is StoredParent => u.role === 'parent' && u.uniqueId === parentId);
    if (!p) return err('No parent with this ID', 404);
    if (p.childIds.includes(studentId)) return err('This parent is already linked', 409);
    p.childIds.push(studentId);
    p.connectionStatus = 'connected';
    return ok({ uniqueId: p.uniqueId, name: p.name, surname: p.surname, phone: p.phone, email: p.email });
  },

  async unlinkParent(orgId: string, branchId: string, studentId: string, parentId: string, token: string): Promise<Result<null>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    const p = DB.users.find((u): u is StoredParent => u.role === 'parent' && u.uniqueId === parentId);
    if (!p || !p.childIds.includes(studentId)) return err('This parent is not linked to the student', 404);
    p.childIds = p.childIds.filter((id) => id !== studentId);
    if (!p.childIds.length) p.connectionStatus = 'unconnected';
    return ok(null);
  },

  // ── BRANCH STUDENTS (staff) ───────────────────────────────
  /** Mock version of the backend view: attendance over 30 days; debts for months since the class opened. */
  async listBranchStudents(orgId: string, branchId: string, token: string): Promise<Result<unknown>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    const classes = DB.classes.filter((c) => c.organizationId === orgId && c.branchId === branchId);
    const studentIds = [...new Set(classes.flatMap((c) => c.studentIds))];
    const rows = studentIds
      .map((id) => DB.users.find((u): u is StoredStudent => u.role === 'student' && u.uniqueId === id))
      .filter((s): s is StoredStudent => !!s)
      .sort((a, b) => `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`))
      .map((s) => {
        const own = classes.filter((c) => c.studentIds.includes(s.uniqueId));
        const counts = mockAttendanceCounts(own, s.uniqueId);
        const unpaid = own.flatMap((c) => mockUnpaidLines(c, s.uniqueId));
        return {
          uniqueId: s.uniqueId, name: s.name, surname: s.surname, email: s.email, phone: s.phone, role: 'student' as const,
          classes: own.map((c) => ({ id: c.id, name: c.name })),
          enrolledAt: own.map((c) => c.createdAt).sort()[0],
          attendance: { ...counts, pct: counts.total ? Math.round((counts.present / counts.total) * 100) : null },
          outstanding: unpaid.reduce((sum, l) => sum + l.balance, 0),
          overdue: unpaid.filter((l) => l.status === 'overdue').reduce((sum, l) => sum + l.balance, 0),
          unpaid,
        };
      });
    return ok(rows);
  },

  async lookupBranchStudent(orgId: string, branchId: string, uniqueId: string, token: string): Promise<Result<unknown>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    const s = DB.users.find((u): u is StoredStudent => u.role === 'student' && u.uniqueId === uniqueId.trim().toUpperCase());
    if (!s) return err('No student with this ID', 404);
    if (s.organizationId && s.organizationId !== orgId) return err('This student belongs to another organization', 403);
    const classIds = DB.classes.filter((c) => c.branchId === branchId && c.studentIds.includes(s.uniqueId)).map((c) => c.id);
    return ok({ uniqueId: s.uniqueId, name: s.name, surname: s.surname, classIds });
  },

  async enrollBranchStudent(orgId: string, branchId: string, body: { uniqueId: string; classId: string }, token: string): Promise<Result<unknown>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    const c = DB.classes.find((x) => x.id === body.classId && x.organizationId === orgId && x.branchId === branchId);
    if (!c) return err('Class not found in this branch', 404);
    const s = DB.users.find((u): u is StoredStudent => u.role === 'student' && u.uniqueId === body.uniqueId);
    if (!s) return err('No student with this ID', 404);
    if (s.organizationId && s.organizationId !== orgId) return err('This student belongs to another organization', 403);
    if (c.studentIds.includes(s.uniqueId)) return err('Student is already in this class', 409);
    s.organizationId = orgId;
    s.branchId = branchId;
    s.connectionStatus = 'connected';
    s.requestedBranchId = null;
    if (!s.classIds.includes(c.id)) s.classIds.push(c.id);
    c.studentIds.push(s.uniqueId);
    return ok({ uniqueId: s.uniqueId, name: s.name, surname: s.surname, email: s.email, phone: s.phone, role: 'student' });
  },

  /** Classes the student is enrolled in. Only the student themselves. */
  async listStudentClasses(studentId: string, token: string): Promise<Result<Page<Class>>> {
    await delay();
    const auth = requireAuth(token);
    if (!auth.ok) return auth;
    if (auth.data.role !== 'student' || auth.data.uniqueId !== studentId) {
      return err('Forbidden: only the student themselves', 403);
    }
    const rows = DB.classes.filter((c) => c.studentIds.includes(studentId)).map((c) => ({ ...c, studentIds: [...c.studentIds] }));
    return ok(paginate(rows));
  },

  /** Teacher creates a class in their own branch and becomes its teacher. */
  async createTeacherClass(teacherId: string, body: { name: string }, token: string): Promise<Result<Class>> {
    await delay();
    const auth = requireTeacherSelf(token, teacherId);
    if (!auth.ok) return auth;
    const t = auth.data;
    if (!t.organizationId || !t.branchId) return err('Teacher is not connected to a branch', 400);
    const name = body.name.trim();
    if (!name) return err('Class name is required', 400);
    const c: Class = {
      id: uid(), organizationId: t.organizationId, branchId: t.branchId, name,
      teacherId, studentIds: [], classPrice: 0, joinCode: generateConnectCode(),
      createdAt: new Date().toISOString(),
    };
    DB.classes.push(c);
    return ok(c);
  },

  /** Class teacher previews a student by their uniqueId before linking. */
  async lookupStudentForClass(classId: string, uniqueId: string, token: string): Promise<Result<StudentLookup>> {
    await delay();
    const auth = requireClassTeacher(token, classId);
    if (!auth.ok) return auth;
    const c = DB.classes.find((x) => x.id === classId)!;
    const found = findLinkableStudent(c, uniqueId);
    if (!found.ok) return found;
    const s = found.data;
    return ok({ uniqueId: s.uniqueId, name: s.name, surname: s.surname, alreadyInClass: c.studentIds.includes(s.uniqueId) });
  },

  /** Class teacher links an existing (self-registered) student to the class by uniqueId. */
  async addExistingStudentToClass(classId: string, uniqueId: string, token: string): Promise<Result<Student>> {
    await delay();
    const auth = requireClassTeacher(token, classId);
    if (!auth.ok) return auth;
    const c = DB.classes.find((x) => x.id === classId)!;
    const found = findLinkableStudent(c, uniqueId);
    if (!found.ok) return found;
    const s = found.data;
    if (c.studentIds.includes(s.uniqueId)) return err('Student is already in this class', 409);
    s.organizationId = c.organizationId;
    s.branchId = c.branchId;
    s.connectionStatus = 'connected';
    s.requestedBranchId = null;
    if (!s.classIds.includes(c.id)) s.classIds.push(c.id);
    c.studentIds.push(s.uniqueId);
    return ok(stripPassword(s) as Student);
  },

  /** Class teacher adds a student; login and password are generated and returned once. */
  async addStudentToClass(classId: string, body: { name: string; surname: string }, token: string): Promise<Result<StudentCredentials>> {
    await delay();
    const auth = requireClassTeacher(token, classId);
    if (!auth.ok) return auth;
    const c = DB.classes.find((x) => x.id === classId)!;
    const name = body.name.trim();
    const surname = body.surname.trim();
    if (!name || !surname) return err('Name and surname are required', 400);
    const login = uniqueStudentLogin(name, surname);
    const password = generatePassword();
    const s: StoredStudent = {
      uniqueId: generateConnectCode(), name, surname, email: login, phone: '',
      role: 'student', connectionStatus: 'connected',
      organizationId: c.organizationId, branchId: c.branchId, requestedBranchId: null,
      classIds: [classId],
      statistics: { quizAvg: 0, homeworkCompletion: 0, attendancePct: 0 },
      password,
    };
    DB.users.push(s);
    c.studentIds.push(s.uniqueId);
    return ok({ student: stripPassword(s) as Student, login, password });
  },

  /** Class teacher issues a fresh password for a student of the class. */
  async resetStudentPassword(classId: string, studentId: string, token: string): Promise<Result<StudentCredentials>> {
    await delay();
    const auth = requireClassTeacher(token, classId);
    if (!auth.ok) return auth;
    const c = DB.classes.find((x) => x.id === classId)!;
    if (!c.studentIds.includes(studentId)) return err('Student is not in this class', 404);
    const s = DB.users.find((u): u is StoredStudent => u.role === 'student' && u.uniqueId === studentId);
    if (!s) return err('Student not found', 404);
    s.password = generatePassword();
    return ok({ student: stripPassword(s) as Student, login: s.email, password: s.password });
  },

  /**
   * Class teacher or branch staff remove a student from the class. The mock keeps no enrollment history,
   * so it never reports `undone` and the student's months in this class are no longer billed here.
   */
  async removeClassStudent(classId: string, studentId: string, token: string): Promise<Result<unknown>> {
    await delay();
    const c = DB.classes.find((x) => x.id === classId);
    if (!c) return err('Class not found', 404);
    const auth = requireAuth(token);
    if (!auth.ok) return auth;
    const guard = auth.data.role === 'teacher'
      ? requireClassTeacher(token, classId)
      : requireBranchStaff(token, c.organizationId, c.branchId);
    if (!guard.ok) return guard;
    if (!c.studentIds.includes(studentId)) return err('Student is not in this class', 404);
    c.studentIds = c.studentIds.filter((id) => id !== studentId);
    return ok({ studentId, undone: false, lastBilledPeriod: localIsoDate(new Date()).slice(0, 7) });
  },

  // ── TASKS ─────────────────────────────────────────────────
  async listClassTasks(classId: string, token: string): Promise<Result<Task[]>> {
    await delay();
    const c = DB.classes.find((x) => x.id === classId);
    if (!c) return err('Class not found', 404);
    const auth = requireOrgAccess(token, c.organizationId);
    if (!auth.ok) return auth;
    return ok(DB.tasks.filter((t) => t.classId === classId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },

  async createTask(classId: string, body: {
    title: string; description: string; lessonId: string | null;
    dueDate: string | null; priority: TaskPriority;
  }, token: string): Promise<Result<Task>> {
    await delay();
    const c = DB.classes.find((x) => x.id === classId);
    if (!c) return err('Class not found', 404);
    const auth = requireOrgAccess(token, c.organizationId);
    if (!auth.ok) return auth;
    const task: Task = {
      id: uid(), classId, lessonId: body.lessonId ?? null,
      title: body.title, description: body.description,
      dueDate: body.dueDate ?? null, priority: body.priority ?? 'normal',
      createdBy: auth.data.uniqueId, createdAt: new Date().toISOString(),
    };
    DB.tasks.push(task);
    return ok(task);
  },

  // ── HOMEWORK ──────────────────────────────────────────────
  async listClassHomeworks(classId: string, token: string, params?: { lessonId?: string }): Promise<Result<HomeworkSubmission[]>> {
    await delay();
    const c = DB.classes.find((x) => x.id === classId);
    if (!c) return err('Class not found', 404);
    const auth = requireOrgAccess(token, c.organizationId);
    if (!auth.ok) return auth;
    const onlyStudent = auth.data.role === 'student' ? auth.data.uniqueId : null;
    const rows = DB.homeworks
      .filter((h) => h.classId === classId && (!params?.lessonId || h.lessonId === params.lessonId))
      .filter((h) => !onlyStudent || h.studentId === onlyStudent)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .map((h) => ({ ...h }));
    return ok(rows);
  },

  /** Student submits (or re-submits) photos + comment for a lesson. */
  async submitHomework(classId: string, body: { lessonId: string; comment: string; photos: File[] }, token: string): Promise<Result<HomeworkSubmission>> {
    await delay();
    const auth = requireRoles(token, 'student');
    if (!auth.ok) return auth;
    const s = auth.data as StoredStudent;
    const c = DB.classes.find((x) => x.id === classId);
    if (!c) return err('Class not found', 404);
    if (!c.studentIds.includes(s.uniqueId)) return err('Forbidden: not a student of this class', 403);
    const inClass = DB.modules.some((m) => m.classId === classId && m.lessons.some((l) => l.id === body.lessonId));
    if (!inClass) return err('Lesson does not belong to this class', 400);
    if (body.photos.length < 1 || body.photos.length > 5) return err('Attach 1 to 5 photos', 400);
    const now = new Date().toISOString();
    const late = DB.tasks.some((t) => t.classId === classId && t.lessonId === body.lessonId && t.dueDate !== null && t.dueDate < now);
    const fields = {
      comment: body.comment.trim(),
      photos: body.photos.map((f) => URL.createObjectURL(f)),
      submittedAt: now,
      status: (late ? 'late' : 'submitted') as HomeworkStatus,
    };
    const existing = DB.homeworks.find((h) => h.lessonId === body.lessonId && h.studentId === s.uniqueId);
    if (existing) {
      Object.assign(existing, fields);
      return ok({ ...existing });
    }
    const h: HomeworkSubmission = {
      id: uid(), classId, lessonId: body.lessonId, studentId: s.uniqueId,
      studentName: `${s.name} ${s.surname}`, ...fields,
    };
    DB.homeworks.push(h);
    return ok({ ...h });
  },

  async reviewHomework(homeworkId: string, token: string): Promise<Result<HomeworkSubmission>> {
    await delay();
    const h = DB.homeworks.find((x) => x.id === homeworkId);
    if (!h) return err('Submission not found', 404);
    const auth = requireClassTeacher(token, h.classId);
    if (!auth.ok) return auth;
    h.status = 'reviewed';
    return ok({ ...h });
  },

  // ── PAYMENTS ──────────────────────────────────────────────
  /**
   * Billing view of a branch for one month. Mirrors the backend: every student of a priced class
   * owes `classPrice` per month, due on the 10th; only `paid` rows count as money received.
   */
  async getBranchPayments(orgId: string, branchId: string, month: string, token: string): Promise<Result<unknown>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    if (!DB.branches.find((b) => b.id === branchId && b.organizationId === orgId)) return err('Branch not found', 404);
    const [y, m] = month.split('-').map(Number);
    const monthEnd = new Date(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1)).toISOString();
    const dueDate = `${month}-10`;
    const today = localIsoDate(new Date());
    const order = { overdue: 0, partial: 1, due: 2, paid: 3 } as const;
    const items = DB.classes
      .filter((c) => c.organizationId === orgId && c.branchId === branchId && c.classPrice > 0 && c.createdAt < monthEnd)
      .flatMap((c) => c.studentIds.map((studentId) => {
        const own = DB.payments.filter((p) => p.classId === c.id && p.studentId === studentId && p.period === month && p.status === 'paid');
        const paid = own.reduce((s, p) => s + p.amount, 0);
        const student = findUserById(studentId);
        const status: keyof typeof order = paid >= c.classPrice ? 'paid' : dueDate < today ? 'overdue' : paid > 0 ? 'partial' : 'due';
        return {
          classId: c.id, className: c.name, studentId,
          studentName: student ? `${student.name} ${student.surname}` : studentId,
          charge: c.classPrice, paid, balance: Math.max(0, c.classPrice - paid), dueDate, status,
          lastPaidAt: own.length ? own[own.length - 1].paidAt : null,
          payments: own.map((p) => ({ id: p.id, amount: p.amount, paidAt: p.paidAt ?? p.recordedAt, note: p.note, recordedBy: p.recordedBy ?? null })),
        };
      }))
      .sort((a, b) => order[a.status] - order[b.status] || a.studentName.localeCompare(b.studentName));
    const sum = (f: (l: (typeof items)[number]) => number) => items.reduce((s, l) => s + f(l), 0);
    return ok({
      month, dueDate, currency: 'UZS',
      summary: {
        expected: sum((l) => l.charge),
        collected: sum((l) => Math.min(l.paid, l.charge)),
        outstanding: sum((l) => l.balance),
        paidCount: items.filter((l) => l.status === 'paid').length,
        overdueCount: items.filter((l) => l.status === 'overdue').length,
        totalCount: items.length,
      },
      items,
    });
  },

  async recordPayment(orgId: string, branchId: string, body: {
    classId: string; studentId: string; period: string; amount: number; paidAt?: string; note: string;
  }, token: string): Promise<Result<unknown>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    const c = DB.classes.find((x) => x.id === body.classId && x.organizationId === orgId && x.branchId === branchId);
    if (!c) return err('Class not found in this branch', 404);
    if (!c.studentIds.includes(body.studentId)) return err('Student is not in this class', 400);
    if (!Number.isInteger(body.amount) || body.amount <= 0) return err('Amount must be a positive whole number', 400);
    const paidAt = body.paidAt ?? new Date().toISOString();
    if (localIsoDate(new Date(paidAt)) > localIsoDate(new Date())) return err('Payment date cannot be in the future', 400);
    const p: Payment = {
      id: uid(), classId: c.id, studentId: body.studentId, amount: body.amount, currency: 'UZS',
      period: body.period, dueDate: null, paidAt, status: 'paid', note: body.note,
      recordedBy: auth.data.uniqueId, recordedAt: new Date().toISOString(),
    };
    DB.payments.push(p);
    return ok({
      id: p.id, classId: p.classId, studentId: p.studentId, amount: p.amount, currency: p.currency,
      period: p.period, paidAt, note: p.note, recordedBy: p.recordedBy ?? null, recordedAt: p.recordedAt,
    });
  },

  async deletePayment(orgId: string, branchId: string, paymentId: string, token: string): Promise<Result<null>> {
    await delay();
    const auth = requireBranchStaff(token, orgId, branchId);
    if (!auth.ok) return auth;
    const idx = DB.payments.findIndex((p) => p.id === paymentId);
    const cls = idx >= 0 ? DB.classes.find((c) => c.id === DB.payments[idx].classId && c.branchId === branchId) : undefined;
    if (idx < 0 || !cls) return err('Payment not found in this branch', 404);
    DB.payments.splice(idx, 1);
    return ok(null);
  },

  // ── ATTENDANCE ────────────────────────────────────────────
  /** Register of one class for one day. Class teacher, or director / staff of the branch. */
  async getAttendanceRegister(classId: string, date: string, token: string): Promise<Result<AttendanceRegister>> {
    await delay();
    const c = DB.classes.find((x) => x.id === classId);
    if (!c) return err('Class not found', 404);
    const auth = requireAuth(token);
    if (!auth.ok) return auth;
    if (auth.data.role === 'teacher') {
      if (c.teacherId !== auth.data.uniqueId) return err('Forbidden: only the assigned teacher of this class', 403);
    } else {
      const staff = requireBranchStaff(token, c.organizationId, c.branchId);
      if (!staff.ok) return staff;
    }
    return ok(toAttendanceRegister(date, DB.attendance.filter((a) => a.classId === classId && a.date === date)));
  },

  /** Replaces the whole register of that date. Class teacher only. */
  async saveAttendanceRegister(classId: string, body: {
    date: string; lessonId: string | null; records: { studentId: string; status: AttendanceStatus }[];
  }, token: string): Promise<Result<AttendanceRegister>> {
    await delay();
    const auth = requireClassTeacher(token, classId);
    if (!auth.ok) return auth;
    const c = DB.classes.find((x) => x.id === classId)!;
    if (body.date > localIsoDate(new Date())) return err('Attendance cannot be recorded for a future date', 400);
    if (body.lessonId && !DB.modules.some((m) => m.classId === classId && m.lessons.some((l) => l.id === body.lessonId))) {
      return err('Lesson does not belong to this class', 400);
    }
    if (!body.records.length) return err('At least one student is required', 400);
    const stranger = body.records.find((r) => !c.studentIds.includes(r.studentId));
    if (stranger) return err(`Student ${stranger.studentId} is not in this class`, 400);
    const recordedAt = new Date().toISOString();
    DB.attendance = DB.attendance.filter((a) => !(a.classId === classId && a.date === body.date));
    const rows: Attendance[] = body.records.map((r) => ({
      id: uid(), classId, lessonId: body.lessonId, studentId: r.studentId, date: body.date,
      status: r.status, recordedBy: auth.data.uniqueId, recordedAt,
    }));
    DB.attendance.push(...rows);
    return ok(toAttendanceRegister(body.date, rows));
  },

  // ── RATINGS ───────────────────────────────────────────────
  /** Only the assigned class teacher can record ratings. */
  async recordRating(classId: string, body: {
    lessonId: string; studentId: string; score: number; comment?: string;
  }, token: string): Promise<Result<Rating>> {
    await delay();
    const auth = requireClassTeacher(token, classId);
    if (!auth.ok) return auth;
    const c = DB.classes.find((x) => x.id === classId);
    if (!c) return err('Class not found', 404);
    if (!c.studentIds.includes(body.studentId)) return err('Student not enrolled in this class', 400);
    const idx = DB.ratings.findIndex(
      (r) => r.classId === classId && r.lessonId === body.lessonId && r.studentId === body.studentId,
    );
    const rec: Rating = {
      id: idx >= 0 ? DB.ratings[idx].id : uid(),
      classId, lessonId: body.lessonId, studentId: body.studentId,
      score: body.score, comment: body.comment ?? '',
      ratedBy: auth.data.uniqueId, ratedAt: new Date().toISOString(),
    };
    if (idx >= 0) DB.ratings[idx] = rec;
    else DB.ratings.push(rec);
    return ok(rec);
  },

  async listRatings(classId: string, token: string, params?: PageParams & { lessonId?: string }): Promise<Result<Page<Rating>>> {
    await delay();
    const c = DB.classes.find((x) => x.id === classId);
    if (!c) return err('Class not found', 404);
    const auth = requireOrgAccess(token, c.organizationId);
    if (!auth.ok) return auth;
    let rows = DB.ratings.filter((r) => r.classId === classId);
    if (params?.lessonId) rows = rows.filter((r) => r.lessonId === params.lessonId);
    return ok(paginate(rows, params));
  },

  // ── STATISTICS ──────────────────────────────────────────────
  async getStatistics(
    orgId: string,
    period: { from: string; to: string },
    token: string,
    branchId: string,
  ): Promise<Result<StatisticsSnapshot>> {
    await delay();
    const auth = requireOrgAccess(token, orgId);
    if (!auth.ok) return auth;
    if (!DB.orgs.find((o) => o.id === orgId)) return err('Org not found', 404);
    if (period.from > period.to) return err('Invalid period', 400);
    const branch = DB.branches.find((b) => b.id === branchId && b.organizationId === orgId);
    if (!branch) return err('Branch not found', 404);
    return ok(validate(statisticsSnapshotSchema, buildBranchStatisticsSnapshot(orgId, branchId, period.from, period.to)));
  },

  // ── BRANCH OVERVIEW (manager / administrator home) ───────────
  async getBranchOverview(orgId: string, branchId: string, token: string): Promise<Result<BranchOverview>> {
    await delay();
    const auth = requireOrgAccess(token, orgId);
    if (!auth.ok) return auth;
    const branch = DB.branches.find((b) => b.id === branchId && b.organizationId === orgId);
    if (!branch) return err('Branch not found', 404);

    const attendanceTodayPct = attendancePctFromCounts(attendanceCountsToday(orgId, branchId));

    const today = new Date().toISOString().slice(0, 10);
    const branchClasses = DB.classes.filter((c) => c.organizationId === orgId && c.branchId === branchId);

    // A class is "pending" when it has a teacher but no attendance recorded today.
    const pendingCountByTeacher = new Map<string, number>();
    for (const c of branchClasses) {
      if (!c.teacherId) continue;
      const hasToday = DB.attendance.some((a) => a.classId === c.id && a.recordedAt.startsWith(today));
      if (!hasToday) {
        pendingCountByTeacher.set(c.teacherId, (pendingCountByTeacher.get(c.teacherId) ?? 0) + 1);
      }
    }
    const pendingTeachers = [...pendingCountByTeacher.entries()].map(([teacherId, pendingClassCount]) => {
      const teacher = DB.users.find(
        (u): u is StoredTeacher => u.role === 'teacher' && u.uniqueId === teacherId,
      );
      return {
        teacherId,
        name: teacher?.name ?? '',
        surname: teacher?.surname ?? '',
        classCategory: teacher?.classCategory ?? '',
        pendingClassCount,
      };
    });

    // One entry per student with a due/overdue payment; overdue wins over due.
    const branchClassIds = branchClasses.map((c) => c.id);
    const infoByStudent = new Map<string, { status: 'due' | 'overdue'; dueDate: string | null }>();
    for (const p of DB.payments) {
      if (!branchClassIds.includes(p.classId)) continue;
      if (p.status !== 'due' && p.status !== 'overdue') continue;
      const prev = infoByStudent.get(p.studentId);
      if (!prev || (p.status === 'overdue' && prev.status === 'due')) {
        infoByStudent.set(p.studentId, { status: p.status, dueDate: p.dueDate });
      }
    }
    const duePayments = [...infoByStudent.entries()].map(([studentId, info]) => {
      const student = DB.users.find(
        (u): u is StoredStudent => u.role === 'student' && u.uniqueId === studentId,
      );
      return {
        studentId,
        name: student?.name ?? '',
        surname: student?.surname ?? '',
        status: info.status,
        dueDate: info.dueDate,
      };
    });

    return ok(validate(branchOverviewSchema, { attendanceTodayPct, pendingTeachers, duePayments }));
  },

  // ── DEBUG (edunify_admin only) ────────────────────────────
  async dump(token: string): Promise<Result<{
    orgs: Organization[]; branches: Branch[]; classes: Class[];
    modules: Module[]; payments: Payment[]; attendance: Attendance[];
    ratings: Rating[]; users: AnyUser[];
  }>> {
    await delay(10);
    const auth = requireRoles(token, 'edunify_admin');
    if (!auth.ok) return auth;
    return ok({
      orgs: DB.orgs, branches: DB.branches, classes: DB.classes,
      modules: DB.modules, payments: DB.payments, attendance: DB.attendance,
      ratings: DB.ratings,
      users: DB.users.map((u) => stripPassword(u) as AnyUser),
    });
  },
};

export type Api = typeof api;
