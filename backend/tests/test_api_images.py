def test_private_profile_image_roundtrip(client, login_headers, scenario, image_stream):
    headers = login_headers(scenario.member)
    path = '/api/users/me/profile-image'
    response = client.put(path, headers=headers, files={'file':('profile.png',image_stream(),'image/png')})
    assert response.status_code == 200, response.text
    file_path = f'/api/users/{scenario.member.id}/profile-image'
    assert client.get(file_path).status_code == 401
    image = client.get(file_path, headers=headers)
    assert image.status_code == 200
    assert image.headers['content-type'].startswith('image/')
    assert client.delete(path, headers=headers).status_code == 204


def test_destination_photo_roundtrip(client, login_headers, scenario, destination, image_stream):
    headers = login_headers(scenario.member)
    path = f'/api/trips/{scenario.trip.id}/destinations/{destination.id}/photos'
    response = client.post(path, headers=headers, files={'file':('destination.png',image_stream(),'image/png')})
    assert response.status_code == 201, response.text
    photo = response.json()
    assert client.get(photo['image_url']).status_code == 401
    assert client.get(photo['image_url'], headers=headers).status_code == 200
    assert client.delete(f'{path}/{photo["id"]}', headers=headers).status_code == 204
