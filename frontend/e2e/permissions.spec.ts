import { expect, test } from '@playwright/test';
import {
  addTripParticipant,
  addUserToGroup,
  createGroupAndTrip,
  login,
  loginSuperAdmin,
  makeAccount,
  promoteGlobalRole,
  registerUser,
  resetSession,
} from './e2e.helpers';

test.describe('Roles globales', () => {
  test('las cuentas nuevas nacen como USER y el SUPER_ADMIN asigna ADMIN y SUPPORT', async ({ page }, testInfo) => {
    const adminAccount = makeAccount('admin', testInfo);
    const supportAccount = makeAccount('support', testInfo);
    const userAccount = makeAccount('user', testInfo);

    await registerUser(page, adminAccount);
    await resetSession(page);

    await registerUser(page, supportAccount);
    await resetSession(page);

    await registerUser(page, userAccount);
    await resetSession(page);

    await loginSuperAdmin(page);
    await promoteGlobalRole(page, adminAccount.username, 'ADMIN');
    await promoteGlobalRole(page, supportAccount.username, 'SUPPORT');

    await resetSession(page);
    await login(page, adminAccount, /\/admin$/);
    await page.goto('/admin/usuarios');
    await expect(page.locator('.admin-table')).toBeVisible();
    await expect(page.locator('select.role-select')).toHaveCount(0);

    await resetSession(page);
    await login(page, supportAccount, /\/soporte$/);
    await page.goto('/soporte/usuarios');
    await expect(page.locator('.admin-table')).toBeVisible();
    await expect(page.locator('select.role-select')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Suspender|Activar/ })).toHaveCount(0);

    await resetSession(page);
    await login(page, userAccount, /\/dashboard$/);

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto('/soporte');
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto('/super-admin');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('el SUPER_ADMIN conserva las herramientas técnicas y la gestión de roles', async ({ page }) => {
    await loginSuperAdmin(page);

    await page.goto('/admin/usuarios');
    await expect(page.locator('.admin-table')).toBeVisible();
    await expect(page.locator('select.role-select').first()).toBeVisible();

    await page.goto('/super-admin/configuracion');
    await expect(page.locator('.page-title')).toHaveText('Configuración del sistema');
    await expect(page.locator('.config-grid')).toBeVisible();

    await page.goto('/super-admin/auditoria');
    await expect(page.locator('.page-title')).toContainText('Registro de auditoría');
    await expect(page.locator('.admin-table')).toBeVisible();

    await page.goto('/super-admin/salud');
    await expect(page.locator('.page-title')).toContainText('Salud');
    await expect(page.locator('.health-grid')).toBeVisible();
  });
});

test.describe('Roles contextuales', () => {
  test('OWNER, ORGANIZER y MEMBER reciben permisos distintos dentro del viaje', async ({ page }, testInfo) => {
    const owner = makeAccount('owner', testInfo);
    const organizer = makeAccount('organizer', testInfo);
    const member = makeAccount('member', testInfo);

    await registerUser(page, organizer);
    await resetSession(page);

    await registerUser(page, member);
    await resetSession(page);

    await registerUser(page, owner);
    const { groupName, tripName } = await createGroupAndTrip(page, testInfo);

    await addUserToGroup(page, groupName, organizer.username);
    await addUserToGroup(page, groupName, member.username);

    await addTripParticipant(page, tripName, organizer.username, 'ORGANIZER');
    await addTripParticipant(page, tripName, member.username, 'MEMBER');

    await page.goto('/participantes');
    await page.locator('#participantTrip').selectOption({ label: tripName });
    await expect(page.locator('.permissions-note')).toContainText('Responsable del viaje');
    await expect(page.getByRole('button', { name: 'Agregar participante' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hacer organizador' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Transferir responsabilidad' }).first()).toBeVisible();

    await resetSession(page);
    await login(page, organizer, /\/dashboard$/);
    await page.goto('/participantes');
    await page.locator('#participantTrip').selectOption({ label: tripName });
    await expect(page.locator('.permissions-note')).toContainText('Organizador');
    await expect(page.getByRole('button', { name: 'Agregar participante' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hacer organizador' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Transferir responsabilidad' })).toHaveCount(0);

    await resetSession(page);
    await login(page, member, /\/dashboard$/);
    await page.goto('/participantes');
    await page.locator('#participantTrip').selectOption({ label: tripName });
    await expect(page.locator('.permissions-note')).toContainText('Participante');
    await expect(page.getByRole('button', { name: 'Agregar participante' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Hacer organizador' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Transferir responsabilidad' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible();
  });
});

test('soporte recibe, revisa y resuelve un reporte sin administrar el viaje', async ({ page }, testInfo) => {
  const owner = makeAccount('incidencia', testInfo);
  const support = makeAccount('diagnostico', testInfo);

  await registerUser(page, owner);
  const { tripName } = await createGroupAndTrip(page, testInfo);

  await page.goto('/reportes');
  await page.locator('#reportCategory').selectOption('TRIP');
  await page.locator('#reportTrip').selectOption({ label: tripName });
  await page.locator('#reportSubject').fill('Información incorrecta del viaje');
  await page.locator('#reportDescription').fill('Necesito que soporte revise la información mostrada.');
  await page.getByRole('button', { name: 'Enviar reporte' }).click();
  await expect(page.getByRole('status')).toContainText('reporte fue enviado');

  await resetSession(page);
  await registerUser(page, support);
  await resetSession(page);
  await loginSuperAdmin(page);
  await promoteGlobalRole(page, support.username, 'SUPPORT');

  await resetSession(page);
  await login(page, support, /\/soporte$/);
  await page.goto('/soporte/reportes');
  await page.locator('input[name="query"]').fill(owner.email);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.locator('tbody tr').filter({ hasText: owner.email }).getByRole('button', { name: /^Abrir reporte/ }).click();
  await page.getByRole('button', { name: 'Atender este reporte' }).click();
  await page.locator('#supportResponse').fill('La información fue revisada.');
  await page.getByRole('button', { name: 'Enviar solución y resolver' }).click();
  await expect(page.getByRole('status')).toContainText('Solución enviada');
  await expect(page.getByRole('button', { name: /Editar|Eliminar|Suspender/ })).toHaveCount(0);
});
