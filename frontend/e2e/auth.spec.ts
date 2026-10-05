import { expect, test } from '@playwright/test';
import {
  makeAccount,
  registerUser,
  resetSession,
  testPassword,
  uniqueName,
} from './e2e.helpers';

test.describe('Autenticación', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('muestra el formulario de inicio de sesión', async ({ page }) => {
    await expect(page.locator('h2')).toHaveText('Iniciar sesión');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
  });

  test('valida el formato del correo', async ({ page }) => {
    await page.locator('input[name="email"]').fill('correo-invalido');
    await expect(page.locator('.error-text')).toContainText('Formato de email inválido');
  });

  test('muestra un error con credenciales incorrectas', async ({ page }) => {
    await page.locator('input[name="email"]').fill('noexiste@example.com');
    await page.locator('input[name="password"]').fill(testPassword());
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.locator('.error-banner')).toBeVisible();
  });

  test('permite navegar al registro', async ({ page }) => {
    await page.getByRole('link', { name: 'Regístrate' }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.locator('h1')).toHaveText('Crear cuenta');
  });
});

test.describe('Registro', () => {
  test('registra una cuenta nueva como usuario normal', async ({ page }, testInfo) => {
    const account = makeAccount('registro', testInfo);

    await registerUser(page, account);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('.page-title')).toContainText('Bienvenido');
  });

  test('valida contraseñas que no coinciden', async ({ page }, testInfo) => {
    const account = makeAccount('password', testInfo);

    await page.goto('/register');
    await page.locator('input[name="firstName"]').fill(account.firstName);
    await page.locator('input[name="firstLastName"]').fill(account.firstLastName);
    await page.locator('input[name="username"]').fill(account.username);
    await page.locator('input[name="email"]').fill(account.email);
    await page.locator('input[name="password"]').fill(account.password);
    await page.locator('input[name="confirmPassword"]').fill('OtraClave2026!');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(page.locator('.field-error')).toContainText('Las contraseñas no coinciden');
  });

  test('valida un nombre de usuario inválido', async ({ page }, testInfo) => {
    const emailToken = uniqueName('correo', testInfo)
      .replace(/[^a-z0-9]/gi, '')
      .toLowerCase();

    await page.goto('/register');
    await page.locator('input[name="firstName"]').fill('Usuario');
    await page.locator('input[name="firstLastName"]').fill('Prueba');
    await page.locator('input[name="username"]').fill('Usuario Inválido');
    await page.locator('input[name="email"]').fill(`${emailToken}@example.com`);
    await page.locator('input[name="password"]').fill(testPassword());
    await page.locator('input[name="confirmPassword"]').fill(testPassword());
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(page.locator('.field-error')).toContainText('letras minúsculas, números, punto o guion bajo');
  });
});

test.describe('Cuenta de usuario', () => {
  test('permite navegar por el espacio personal', async ({ page }, testInfo) => {
    const account = makeAccount('navegacion', testInfo);
    await registerUser(page, account);

    await page.getByRole('link', { name: 'Grupos' }).click();
    await expect(page).toHaveURL(/\/grupos$/);

    await page.getByRole('link', { name: 'Viajes' }).click();
    await expect(page).toHaveURL(/\/viajes$/);

    await page.goto('/perfil');
    await expect(page.locator('.page-title')).toHaveText('Mi perfil');
    await expect(page.locator('.profile-sessions-section')).toBeVisible();
  });

  test('permite editar y restaurar el nombre del perfil', async ({ page }, testInfo) => {
    const account = makeAccount('perfil', testInfo);
    await registerUser(page, account);
    await page.goto('/perfil');

    const input = page.locator('input[name="fullName"]');
    const originalName = await input.inputValue();
    const temporaryName = uniqueName('Perfil E2E', testInfo).slice(0, 120);

    await input.fill(temporaryName);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.locator('.success-toast')).toContainText('Perfil actualizado correctamente');

    await input.fill(originalName);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.locator('.success-toast')).toContainText('Perfil actualizado correctamente');
  });

  test('permite cerrar todas las sesiones', async ({ page }, testInfo) => {
    const account = makeAccount('sesiones', testInfo);
    await registerUser(page, account);
    await page.goto('/configuracion');

    const responsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST'
        && response.url().includes('/api/auth/logout-all'),
    );

    await page.getByRole('button', { name: 'Cerrar todas las sesiones' }).click();
    expect((await responsePromise).ok()).toBeTruthy();

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login(?:\?|$)/);

    await resetSession(page);
  });
});
