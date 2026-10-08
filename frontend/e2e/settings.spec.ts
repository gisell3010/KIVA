import { expect, test } from '@playwright/test';
import { makeAccount, registerUser } from './e2e.helpers';

test('configuración carga, conserva la edición del correo y permite volver a entrar', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const account = makeAccount('settings', testInfo);
  await registerUser(page, account);
  await page.goto('/configuracion');

  await expect(page.getByRole('heading', { name: 'Configuración', exact: true })).toBeVisible();
  const email = page.getByRole('textbox', { name: 'Nuevo correo electrónico', exact: true });
  await expect(email).toHaveValue(account.email);
  const changedEmail = `edit.${account.email}`;
  await email.fill(changedEmail);
  await page.locator('.theme-option').filter({ hasText: 'Claro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(email).toHaveValue(changedEmail);
  await page.locator('.theme-option').filter({ hasText: 'Oscuro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(email).toHaveValue(changedEmail);

  await page.getByRole('link', { name: 'Editar perfil' }).click();
  await expect(page).toHaveURL(/\/perfil$/);
  await page.goto('/configuracion');
  await expect(email).toHaveValue(account.email);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Configuración', exact: true })).toBeVisible();
  await expect(email).toHaveValue(account.email);
  expect(errors).toEqual([]);
});
