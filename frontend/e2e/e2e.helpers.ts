import { expect, Page, TestInfo } from '@playwright/test';

export type TestAccount = {
  firstName: string;
  firstLastName: string;
  username: string;
  email: string;
  password: string;
};

let sequence = 0;

export const SUPER_ADMIN_ACCOUNT = {
  email: process.env['E2E_SUPERADMIN_EMAIL'] ?? 'superadmin@example.com',
  password: process.env['E2E_SUPERADMIN_PASSWORD'] ?? '',
};

export const TEST_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

export function testPassword(): string {
  return process.env['E2E_USER_PASSWORD'] ?? 'KivaE2E2026!';
}

export function makeAccount(label: string, testInfo: TestInfo): TestAccount {
  sequence += 1;

  const project = testInfo.project.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 12);

  const suffix = `${Date.now().toString(36)}${sequence.toString(36)}`;
  const username = `${base}${project}${suffix}`.slice(0, 48);

  return {
    firstName: 'Usuario',
    firstLastName: 'E2E',
    username,
    email: `${username}@example.com`,
    password: testPassword(),
  };
}

export async function registerUser(page: Page, account: TestAccount): Promise<void> {
  await page.goto('/register');
  await page.locator('input[name="firstName"]').fill(account.firstName);
  await page.locator('input[name="firstLastName"]').fill(account.firstLastName);
  await page.locator('input[name="username"]').fill(account.username);
  await page.locator('input[name="email"]').fill(account.email);
  await page.locator('input[name="password"]').fill(account.password);
  await page.locator('input[name="confirmPassword"]').fill(account.password);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function login(
  page: Page,
  account: Pick<TestAccount, 'email' | 'password'>,
  expectedPath: RegExp,
): Promise<void> {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(account.email);
  await page.locator('input[name="password"]').fill(account.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL(expectedPath);
}

export async function loginSuperAdmin(page: Page): Promise<void> {
  if (!SUPER_ADMIN_ACCOUNT.password) {
    throw new Error('Define E2E_SUPERADMIN_PASSWORD antes de ejecutar Playwright.');
  }

  await login(page, SUPER_ADMIN_ACCOUNT, /\/super-admin$/);
}

export async function resetSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto('/login');
  await expect(page).toHaveURL(/\/login$/);
}

export function uniqueName(prefix: string, testInfo: TestInfo): string {
  sequence += 1;

  const project = testInfo.project.name
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase();

  return `${prefix} ${project} ${Date.now().toString(36)}${sequence.toString(36)}`;
}

export function futureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

export async function createGroup(
  page: Page,
  groupName: string,
): Promise<void> {
  await page.goto('/grupos');
  await page.getByRole('button', { name: 'Nuevo grupo' }).click();

  const modal = page.locator('.modal-box').filter({ hasText: 'Nuevo grupo' });
  await modal.locator('input[name="name"]').fill(groupName);
  await modal.locator('textarea[name="description"]').fill('Grupo creado durante las pruebas E2E.');
  await modal.getByRole('button', { name: 'Crear grupo' }).click();

  await expect(page.locator('.grupo-card').filter({ hasText: groupName })).toBeVisible();
}

export async function createTrip(
  page: Page,
  groupName: string,
  tripName: string,
): Promise<void> {
  await page.goto('/viajes/nuevo');
  await page.locator('input[name="name"]').fill(tripName);
  await page.locator('select[name="groupId"]').selectOption({ label: groupName });
  await page.locator('input[name="startDate"]').fill(futureDate(30));
  await page.locator('input[name="endDate"]').fill(futureDate(40));
  await page.locator('textarea[name="description"]').fill('Viaje creado durante las pruebas E2E.');
  await page.getByRole('button', { name: 'Crear viaje' }).click();

  await expect(page).toHaveURL(/\/viajes$/);
  await expect(page.locator('.trip-card').filter({ hasText: tripName })).toBeVisible();
}

export async function createGroupAndTrip(
  page: Page,
  testInfo: TestInfo,
): Promise<{ groupName: string; tripName: string }> {
  const groupName = uniqueName('Grupo E2E', testInfo);
  const tripName = uniqueName('Viaje E2E', testInfo);

  await createGroup(page, groupName);
  await createTrip(page, groupName, tripName);

  return { groupName, tripName };
}

export async function addUserToGroup(
  page: Page,
  groupName: string,
  username: string,
): Promise<void> {
  await page.goto('/grupos');

  const card = page.locator('.grupo-card').filter({ hasText: groupName });
  await card.getByRole('button', { name: 'Administrar' }).click();

  const modal = page.locator('.group-manage-modal');
  const search = modal.locator('input[name="searchUser"]');
  await search.fill(username);

  const result = modal.locator('.member-row').filter({ hasText: `@${username}` });
  await expect(result).toBeVisible();
  await result.getByRole('button', { name: 'Agregar' }).click();

  await expect(modal.locator('.member-row').filter({ hasText: `@${username}` })).toBeVisible();
  await modal.getByRole('button', { name: 'Cerrar' }).click();
}

export async function addTripParticipant(
  page: Page,
  tripName: string,
  username: string,
  role: 'MEMBER' | 'ORGANIZER',
): Promise<void> {
  await page.goto('/participantes');
  await page.locator('#participantTrip').selectOption({ label: tripName });
  await page.getByRole('button', { name: 'Agregar participante' }).click();

  const modal = page.locator('.modal-box').filter({ hasText: 'Agregar participante' });
  const row = modal.locator('.member-row').filter({ hasText: `@${username}` });
  await expect(row).toBeVisible();

  await row.getByRole('button', {
    name: role === 'ORGANIZER' ? 'Como organizador' : 'Agregar',
  }).click();

  await modal.getByRole('button', { name: 'Cerrar' }).click();
  await expect(page.locator('.user-card').filter({ hasText: `@${username}` })).toBeVisible();
}

export async function promoteGlobalRole(
  page: Page,
  username: string,
  role: 'ADMIN' | 'SUPPORT' | 'USER',
): Promise<void> {
  await page.goto('/admin/usuarios');

  const search = page.locator('input[placeholder="Buscar por nombre, usuario o email"]');
  await search.fill(username);
  await page.getByRole('button', { name: 'Buscar' }).click();

  const row = page.locator('tbody tr').filter({ hasText: `@${username}` });
  await expect(row).toBeVisible();

  const roleSelect = row.locator('select.role-select');
  await expect(roleSelect).toHaveValue('USER');

  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'PATCH'
      && /\/api\/admin\/users\/\d+$/.test(new URL(response.url()).pathname),
  );

  await roleSelect.selectOption(role);
  expect((await responsePromise).ok()).toBeTruthy();
  await expect(roleSelect).toHaveValue(role);
}
