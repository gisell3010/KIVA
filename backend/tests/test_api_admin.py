import pytest

@pytest.mark.parametrize('role,expected', [('USER',403), ('SUPPORT',403), ('ADMIN',200), ('SUPER_ADMIN',200)])
def test_admin_dashboard_roles(client, login_headers, make_user, role, expected):
    headers = login_headers(make_user(role=role))
    assert client.get('/api/admin/dashboard', headers=headers).status_code == expected


def test_only_superadmin_assigns_roles(client, login_headers, scenario):
    admin = login_headers(scenario.admin)
    path = f'/api/admin/users/{scenario.member.id}'
    assert client.patch(path, headers=admin, json={'role':'ADMIN'}).status_code == 403
    assert client.patch(path, headers=admin, json={'status':'SUSPENDED'}).status_code == 200
    assert client.patch(path, headers=admin, json={'status':'ACTIVE'}).status_code == 200
    root = login_headers(scenario.superadmin)
    assert client.patch(path, headers=root, json={'role':'SUPPORT'}).status_code == 200
    assert client.patch(f'/api/admin/users/{scenario.superadmin.id}', headers=root, json={'status':'SUSPENDED'}).status_code == 409


def test_support_consults_but_cannot_suspend(client, login_headers, scenario):
    headers = login_headers(scenario.support)
    assert client.get('/api/support/users', headers=headers).status_code == 200
    assert client.patch(f'/api/admin/users/{scenario.member.id}', headers=headers, json={'status':'SUSPENDED'}).status_code == 403



def test_superadmin_health_and_readonly_configuration(client, login_headers, scenario):
    headers = login_headers(scenario.superadmin)
    response = client.get('/api/super-admin/health', headers=headers)
    assert response.status_code == 200
    assert response.json()['database'] == 'ok'
    config = client.get('/api/super-admin/config', headers=headers)
    assert config.status_code == 200
    assert 'db_password' not in config.json()
    assert client.put('/api/super-admin/config', headers=headers, json={}).status_code == 405
