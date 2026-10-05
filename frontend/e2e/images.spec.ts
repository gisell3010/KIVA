import { expect, test } from '@playwright/test';
import {
  createGroupAndTrip,
  makeAccount,
  registerUser,
  resetSession,
  TEST_PNG,
  uniqueName,
} from './e2e.helpers';

async function uploadProfileImage(page: import('@playwright/test').Page): Promise<string> {
  const imageResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET'
      && /\/api\/users\/\d+\/profile-image/.test(new URL(response.url()).pathname),
  );

  const uploadResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'PUT'
      && response.url().includes('/api/users/me/profile-image'),
  );

  await page.locator('#profileImageInput').setInputFiles({
    name: 'profile-e2e.png',
    mimeType: 'image/png',
    buffer: TEST_PNG,
  });

  expect((await uploadResponsePromise).ok()).toBeTruthy();
  const imageResponse = await imageResponsePromise;
  expect(imageResponse.ok()).toBeTruthy();

  await expect(page.locator('.profile-header app-user-avatar img.private-image')).toBeVisible();
  return imageResponse.url();
}

test.describe('Imágenes', () => {
  test('sube la foto de perfil, la protege y vuelve al avatar predeterminado al eliminarla', async ({ page }, testInfo) => {
    const account = makeAccount('imagenperfil', testInfo);
    await registerUser(page, account);
    await page.goto('/perfil');

    const imageUrl = await uploadProfileImage(page);
    await expect(page.locator('.profile-header app-user-avatar img.private-image')).toHaveAttribute('src', /^blob:/);

    await resetSession(page);
    const unauthenticated = await page.request.get(imageUrl);
    expect(unauthenticated.status()).toBe(401);

    await page.locator('input[name="email"]').fill(account.email);
    await page.locator('input[name="password"]').fill(account.password);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto('/perfil');

    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'DELETE'
        && response.url().includes('/api/users/me/profile-image'),
    );

    await page.getByRole('button', { name: 'Eliminar foto' }).click();
    expect((await deleteResponsePromise).ok()).toBeTruthy();

    await expect(page.locator('.profile-header app-user-avatar .avatar-fallback')).toBeVisible();
    await expect(page.locator('.profile-header app-user-avatar img.private-image')).toHaveCount(0);
  });

  test('sube y muestra una fotografía de un destino', async ({ page }, testInfo) => {
    const account = makeAccount('imagendestino', testInfo);
    await registerUser(page, account);

    const { groupName, tripName } = await createGroupAndTrip(page, testInfo);
    const tripLabel = `${tripName} · ${groupName}`;
    const placeName = uniqueName('Destino foto', testInfo);

    await page.goto('/destinos');
    await page.locator('#tripDestinations').selectOption({ label: tripLabel });
    await page.getByRole('button', { name: 'Proponer destino' }).click();

    const modal = page.locator('.modal-box').filter({ hasText: 'Proponer destino' });
    await modal.locator('input[name="country"]').fill('Colombia');
    await modal.locator('input[name="place"]').fill(placeName);
    await modal.locator('textarea[name="description"]').fill('Destino para validar la carga de imágenes.');
    await modal.getByRole('button', { name: 'Guardar' }).click();

    const card = page.locator('.destino-card').filter({ hasText: placeName });
    await expect(card).toBeVisible();

    const uploadResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST'
        && /\/api\/trips\/\d+\/destinations\/\d+\/photos$/.test(new URL(response.url()).pathname),
    );

    await card.locator('input[type="file"]').setInputFiles({
      name: 'destination-e2e.png',
      mimeType: 'image/png',
      buffer: TEST_PNG,
    });

    expect((await uploadResponsePromise).ok()).toBeTruthy();
    await expect(card.locator('app-private-image img.private-image')).toBeVisible();
  });
});
