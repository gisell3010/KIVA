def test_register_login_refresh_logout(client, register_data, password):
    payload = register_data.model_dump(mode='json')
    payload['password'] = password
    response = client.post('/api/auth/register', json=payload)
    assert response.status_code == 201
    assert response.json()['user']['role'] == 'USER'
    assert 'password_hash' not in response.json()['user']
    assert client.post('/api/auth/register', json=payload).status_code == 409
    login = client.post('/api/auth/login', json={'email': str(register_data.email), 'password': password})
    assert login.status_code == 200
    headers = {'Authorization': f'Bearer {login.json()["access_token"]}'}
    assert client.get('/api/users/me', headers=headers).status_code == 200
    assert client.post('/api/auth/refresh').status_code == 200
    assert client.post('/api/auth/logout').status_code == 204
    assert client.post('/api/auth/refresh').status_code == 401


def test_invalid_credentials_and_csrf(client):
    assert client.post('/api/auth/login', json={'email': 'missing@example.com', 'password': 'incorrectpass'}).status_code == 401
    assert client.post('/api/auth/login', headers={'X-KIVA-CSRF': ''}, json={'email': 'missing@example.com', 'password': 'incorrectpass'}).status_code == 403
    assert client.get('/api/users/me').status_code == 401
