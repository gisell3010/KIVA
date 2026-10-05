import pytest

@pytest.mark.parametrize('actor', ['admin','support','superadmin','outsider'])
def test_global_role_does_not_grant_private_membership(client, login_headers, scenario, actor):
    headers = login_headers(getattr(scenario, actor))
    path = f'/api/trips/{scenario.trip.id}'
    assert client.get(path, headers=headers).status_code == 404
    assert client.patch(path, headers=headers, json={'name':'Intervención'}).status_code == 404


def test_member_and_organizer_cannot_edit_general_trip(client, login_headers, scenario):
    path = f'/api/trips/{scenario.trip.id}'
    for user in (scenario.member, scenario.manager):
        headers = login_headers(user)
        assert client.get(path, headers=headers).status_code == 200
        assert client.patch(path, headers=headers, json={'name':'Cambio'}).status_code == 403
    assert client.patch(path, headers=login_headers(scenario.owner), json={'name':'Viaje actualizado'}).status_code == 200
