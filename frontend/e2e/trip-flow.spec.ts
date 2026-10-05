import { expect, test } from '@playwright/test';
import {
  createGroupAndTrip,
  futureDate,
  makeAccount,
  registerUser,
  uniqueName,
} from './e2e.helpers';

test.describe('Flujo principal de viajes', () => {
  test('crea un grupo y un viaje y asigna al creador como responsable', async ({ page }, testInfo) => {
    const account = makeAccount('owner', testInfo);
    await registerUser(page, account);

    const { groupName, tripName } = await createGroupAndTrip(page, testInfo);

    const groupCard = page.locator('.grupo-card').filter({ hasText: groupName });
    await page.goto('/grupos');
    await expect(groupCard).toContainText('Responsable del grupo');

    await page.goto('/viajes');
    const tripCard = page.locator('.trip-card').filter({ hasText: tripName });
    await expect(tripCard).toContainText('Responsable del viaje');
  });

  test('permite completar destinos, itinerario y gastos en un viaje propio', async ({ page }, testInfo) => {
    const account = makeAccount('flujo', testInfo);
    await registerUser(page, account);

    const { groupName, tripName } = await createGroupAndTrip(page, testInfo);
    const tripLabel = `${tripName} · ${groupName}`;

    const placeName = uniqueName('Destino E2E', testInfo);
    await page.goto('/destinos');
    await page.locator('#tripDestinations').selectOption({ label: tripLabel });
    await page.getByRole('button', { name: 'Proponer destino' }).click();

    const destinationModal = page.locator('.modal-box').filter({ hasText: 'Proponer destino' });
    await destinationModal.locator('input[name="country"]').fill('España');
    await destinationModal.locator('input[name="place"]').fill(placeName);
    await destinationModal.locator('textarea[name="description"]').fill('Destino creado durante la prueba E2E.');
    await destinationModal.getByRole('button', { name: 'Guardar' }).click();

    await expect(page.locator('.destino-card').filter({ hasText: placeName })).toBeVisible();

    const activityTitle = uniqueName('Actividad E2E', testInfo);
    await page.goto('/itinerario');
    await page.locator('#itineraryTrip').selectOption({ label: tripLabel });
    await page.getByRole('button', { name: 'Proponer actividad' }).click();

    const activityModal = page.locator('.modal-box').filter({ hasText: 'Proponer actividad' });
    await activityModal.locator('input[name="title"]').fill(activityTitle);
    await activityModal.locator('input[name="date"]').fill(futureDate(32));
    await activityModal.locator('input[name="time"]').fill('10:00');
    await activityModal.locator('input[name="location"]').fill('Centro histórico');
    await activityModal.locator('input[name="cost"]').fill('50000');
    await activityModal.locator('textarea[name="description"]').fill('Actividad creada durante la prueba E2E.');
    await activityModal.getByRole('button', { name: 'Guardar' }).click();

    await expect(page.locator('.activity-row').filter({ hasText: activityTitle })).toBeVisible();

    const expenseTitle = uniqueName('Gasto E2E', testInfo);
    await page.goto('/gastos');
    await page.locator('#expenseTrip').selectOption({ label: tripLabel });
    await page.getByRole('button', { name: 'Registrar gasto' }).click();

    const expenseModal = page.locator('.modal-box').filter({ hasText: 'Registrar gasto' });
    await expenseModal.locator('input[name="title"]').fill(expenseTitle);
    await expenseModal.locator('input[name="amount"]').fill('120000');
    await expenseModal.locator('input[name="date"]').fill(futureDate(31));
    await expenseModal.getByRole('button', { name: 'Guardar' }).click();

    await expect(page.locator('.tabla-gastos tbody tr').filter({ hasText: expenseTitle })).toBeVisible();
  });
});