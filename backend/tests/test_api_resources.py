def test_destination_crud(client, login_headers, scenario):
    headers = login_headers(scenario.member)
    path = f'/api/trips/{scenario.trip.id}/destinations'
    created = client.post(path, headers=headers, json={'country':'Colombia','place_name':'Cartagena'})
    assert created.status_code == 201
    item_path = f'{path}/{created.json()["id"]}'
    assert client.get(item_path, headers=headers).status_code == 200
    assert client.patch(item_path, headers=headers, json={'description':'Centro histórico'}).status_code == 200
    assert client.delete(item_path, headers=headers).status_code == 204


def test_multiple_votes_and_closed_poll(client, login_headers, scenario, poll):
    path = f'/api/trips/{scenario.trip.id}/polls/{poll.id}'
    headers = login_headers(scenario.member)
    detail = client.get(path, headers=headers).json()
    ids = [item['id'] for item in detail['options'][:2]]
    assert client.put(f'{path}/votes', headers=headers, json={'option_ids':ids}).status_code == 200
    results = client.get(f'{path}/results', headers=headers)
    assert results.json()['total_votes'] == 2
    assert client.post(f'{path}/close', headers=login_headers(scenario.owner)).status_code == 200
    assert client.put(f'{path}/votes', headers=headers, json={'option_ids':[]}).status_code == 409
