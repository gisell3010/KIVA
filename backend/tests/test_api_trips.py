def test_trip_crud_and_owner(client, login_headers, scenario):
    headers = login_headers(scenario.member)
    result = client.post('/api/trips', headers=headers, json={'group_id':scenario.group.id, 'name':'Nuevo viaje'})
    assert result.status_code == 201, result.text
    trip = result.json()
    assert trip['my_role'] == 'OWNER'
    path = f'/api/trips/{trip["id"]}'
    assert client.get(path, headers=headers).status_code == 200
    assert client.patch(path, headers=headers, json={'description':'Actualizado'}).status_code == 200
    listing = client.get('/api/trips?status=PLANNING', headers=headers)
    assert listing.status_code == 200
    assert all(t['status'] == 'PLANNING' for t in listing.json()['items'])
    assert client.delete(path, headers=headers).status_code == 204
    assert client.get(path, headers=headers).status_code == 404


def test_invalid_trip_dates(client, login_headers, scenario):
    response = client.post('/api/trips', headers=login_headers(scenario.owner), json={'group_id':scenario.group.id,'name':'Fecha inválida','start_date':'2030-02-02','end_date':'2030-02-01'})
    assert response.status_code == 422
